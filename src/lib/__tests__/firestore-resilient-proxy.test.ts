import * as admin from "firebase-admin";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createResilientFirestoreProxy,
  isPrimaryQuotaCurrentlyExhausted,
  isQuotaError,
  markPrimaryQuotaExhausted,
  resetPrimaryQuotaStatus,
} from "../firestore-resilient-proxy";

describe("firestore-resilient-proxy", () => {
  beforeEach(() => {
    resetPrimaryQuotaStatus();
    vi.clearAllMocks();
  });

  describe("isQuotaError", () => {
    it("identifies RESOURCE_EXHAUSTED in error message", () => {
      const err = new Error("8 RESOURCE_EXHAUSTED: Quota exceeded for metric");
      expect(isQuotaError(err)).toBe(true);
    });

    it("identifies code 8 in error object", () => {
      const err = { code: 8, details: "Quota limit reached" };
      expect(isQuotaError(err)).toBe(true);
    });

    it("identifies Quota exceeded string", () => {
      const err = new Error("Quota exceeded");
      expect(isQuotaError(err)).toBe(true);
    });

    it("returns false for non-quota errors", () => {
      expect(isQuotaError(new Error("Document not found"))).toBe(false);
      expect(isQuotaError(new Error("Permission denied"))).toBe(false);
      expect(isQuotaError({ code: 5, message: "NOT_FOUND" })).toBe(false);
      expect(isQuotaError(null)).toBe(false);
      expect(isQuotaError(undefined)).toBe(false);
    });
  });

  describe("circuit breaker", () => {
    it("marks primary quota exhausted and resets correctly", () => {
      expect(isPrimaryQuotaCurrentlyExhausted()).toBe(false);
      markPrimaryQuotaExhausted();
      expect(isPrimaryQuotaCurrentlyExhausted()).toBe(true);
      resetPrimaryQuotaStatus();
      expect(isPrimaryQuotaCurrentlyExhausted()).toBe(false);
    });
  });

  describe("createResilientFirestoreProxy - Document & Query failover", () => {
    it("successfully queries primary when no quota error occurs", async () => {
      const primaryGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ name: "Primary Member" }),
      });
      const backupGet = vi.fn();

      const primaryDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            id: "m1",
            path: "members/m1",
            get: primaryGet,
          })),
        })),
      } as unknown as admin.firestore.Firestore;

      const backupDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            id: "m1",
            path: "members/m1",
            get: backupGet,
          })),
        })),
      } as unknown as admin.firestore.Firestore;

      const proxy = createResilientFirestoreProxy(primaryDb, () => backupDb);
      const doc = await proxy.collection("members").doc("m1").get();

      expect(primaryGet).toHaveBeenCalled();
      expect(backupGet).not.toHaveBeenCalled();
      expect(doc.data()).toEqual({ name: "Primary Member" });
      expect(isPrimaryQuotaCurrentlyExhausted()).toBe(false);
    });

    it("transparently fails over to backup on RESOURCE_EXHAUSTED", async () => {
      const quotaError = new Error("8 RESOURCE_EXHAUSTED: Quota exceeded");
      const primaryGet = vi.fn().mockRejectedValue(quotaError);
      const backupGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ name: "Backup Member" }),
      });

      const backupDoc = vi.fn(() => ({
        id: "m1",
        path: "members/m1",
        get: backupGet,
      }));
      const backupCol = vi.fn(() => ({
        doc: backupDoc,
      }));

      const primaryDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            id: "m1",
            path: "members/m1",
            get: primaryGet,
          })),
        })),
      } as unknown as admin.firestore.Firestore;

      const backupDb = {
        collection: backupCol,
      } as unknown as admin.firestore.Firestore;

      const proxy = createResilientFirestoreProxy(primaryDb, () => backupDb);
      const doc = await proxy.collection("members").doc("m1").get();

      expect(primaryGet).toHaveBeenCalled();
      expect(backupCol).toHaveBeenCalledWith("members");
      expect(backupDoc).toHaveBeenCalledWith("m1");
      expect(backupGet).toHaveBeenCalled();
      expect(doc.data()).toEqual({ name: "Backup Member" });
      expect(isPrimaryQuotaCurrentlyExhausted()).toBe(true);
    });

    it("replays complex query chains (where, orderBy, limit) on backup", async () => {
      const quotaError = new Error("8 RESOURCE_EXHAUSTED: Quota exceeded");
      const primaryGet = vi.fn().mockRejectedValue(quotaError);
      const backupGet = vi.fn().mockResolvedValue({
        empty: false,
        docs: [{ id: "e1", data: () => ({ title: "Backup Event" }) }],
      });

      const primaryDb = {
        collection: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                get: primaryGet,
              })),
            })),
          })),
        })),
      } as unknown as admin.firestore.Firestore;

      const backupLimit = vi.fn(() => ({ get: backupGet }));
      const backupOrderBy = vi.fn(() => ({ limit: backupLimit }));
      const backupWhere = vi.fn(() => ({ orderBy: backupOrderBy }));
      const backupCol = vi.fn(() => ({ where: backupWhere }));

      const backupDb = {
        collection: backupCol,
      } as unknown as admin.firestore.Firestore;

      const proxy = createResilientFirestoreProxy(primaryDb, () => backupDb);
      const snapshot = await proxy
        .collection("events")
        .where("siteId", "==", "bkgalabovo")
        .orderBy("startDate", "desc")
        .limit(10)
        .get();

      expect(backupCol).toHaveBeenCalledWith("events");
      expect(backupWhere).toHaveBeenCalledWith("siteId", "==", "bkgalabovo");
      expect(backupOrderBy).toHaveBeenCalledWith("startDate", "desc");
      expect(backupLimit).toHaveBeenCalledWith(10);
      expect(backupGet).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((snapshot as any).docs[0].data()).toEqual({
        title: "Backup Event",
      });
    });

    it("does not catch or failover on normal business errors", async () => {
      const notFoundError = new Error("Custom business error");
      const primaryGet = vi.fn().mockRejectedValue(notFoundError);
      const backupGet = vi.fn();

      const primaryDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: primaryGet,
          })),
        })),
      } as unknown as admin.firestore.Firestore;

      const backupDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: backupGet,
          })),
        })),
      } as unknown as admin.firestore.Firestore;

      const proxy = createResilientFirestoreProxy(primaryDb, () => backupDb);

      await expect(proxy.collection("members").doc("m1").get()).rejects.toThrow(
        "Custom business error"
      );
      expect(backupGet).not.toHaveBeenCalled();
      expect(isPrimaryQuotaCurrentlyExhausted()).toBe(false);
    });

    it("replays writes (set) on backup when primary quota exceeded", async () => {
      const quotaError = new Error("8 RESOURCE_EXHAUSTED: Quota exceeded");
      const primarySet = vi.fn().mockRejectedValue(quotaError);
      const backupSet = vi.fn().mockResolvedValue({ writeTime: "now" });

      const primaryDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            id: "m2",
            path: "members/m2",
            set: primarySet,
          })),
        })),
      } as unknown as admin.firestore.Firestore;

      const backupDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            id: "m2",
            path: "members/m2",
            set: backupSet,
          })),
        })),
      } as unknown as admin.firestore.Firestore;

      const proxy = createResilientFirestoreProxy(primaryDb, () => backupDb);
      await proxy
        .collection("members")
        .doc("m2")
        .set({ name: "New Member" }, { merge: true });

      expect(primarySet).toHaveBeenCalledWith(
        { name: "New Member" },
        { merge: true }
      );
      expect(backupSet).toHaveBeenCalledWith(
        { name: "New Member" },
        { merge: true }
      );
      expect(isPrimaryQuotaCurrentlyExhausted()).toBe(true);
    });
  });

  describe("createResilientFirestoreProxy - WriteBatch failover", () => {
    it("replays batch commit on backup when primary commit fails with quota error", async () => {
      const quotaError = new Error("RESOURCE_EXHAUSTED");
      const primaryBatchCommit = vi.fn().mockRejectedValue(quotaError);
      const primaryBatch = {
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        commit: primaryBatchCommit,
      };

      const backupBatchCommit = vi.fn().mockResolvedValue([{ writeTime: "1" }]);
      const backupBatchSet = vi.fn();
      const backupBatch = {
        set: backupBatchSet,
        update: vi.fn(),
        delete: vi.fn(),
        commit: backupBatchCommit,
      };

      const backupDoc = vi.fn((path: string) => ({
        path,
        id: path.split("/")[1],
      }));

      const primaryDb = {
        batch: vi.fn(() => primaryBatch),
      } as unknown as admin.firestore.Firestore;

      const backupDb = {
        batch: vi.fn(() => backupBatch),
        doc: backupDoc,
      } as unknown as admin.firestore.Firestore;

      const proxy = createResilientFirestoreProxy(primaryDb, () => backupDb);
      const batch = proxy.batch();
      const dummyDocRef = {
        path: "members/m123",
      } as admin.firestore.DocumentReference;

      batch.set(dummyDocRef, { name: "Batch Member" });
      const result = await batch.commit();

      expect(primaryBatchCommit).toHaveBeenCalled();
      expect(backupDoc).toHaveBeenCalledWith("members/m123");
      expect(backupBatchSet).toHaveBeenCalled();
      expect(backupBatchCommit).toHaveBeenCalled();
      expect(result).toEqual([{ writeTime: "1" }]);
      expect(isPrimaryQuotaCurrentlyExhausted()).toBe(true);
    });
  });

  describe("createResilientFirestoreProxy - runTransaction failover", () => {
    it("retries runTransaction on backup when primary fails with quota error", async () => {
      const quotaError = new Error("RESOURCE_EXHAUSTED");
      const primaryRunTx = vi.fn().mockRejectedValue(quotaError);
      const backupRunTx = vi.fn().mockResolvedValue("tx-success");

      const primaryDb = {
        runTransaction: primaryRunTx,
      } as unknown as admin.firestore.Firestore;

      const backupDb = {
        runTransaction: backupRunTx,
      } as unknown as admin.firestore.Firestore;

      const proxy = createResilientFirestoreProxy(primaryDb, () => backupDb);
      const txFn = async () => "ok";
      const res = await proxy.runTransaction(txFn);

      expect(primaryRunTx).toHaveBeenCalled();
      expect(backupRunTx).toHaveBeenCalledWith(txFn, undefined);
      expect(res).toBe("tx-success");
      expect(isPrimaryQuotaCurrentlyExhausted()).toBe(true);
    });
  });
});

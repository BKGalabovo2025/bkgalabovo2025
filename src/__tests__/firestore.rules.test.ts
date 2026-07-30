import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setLogLevel } from "firebase/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let testEnv: RulesTestEnvironment;

describe("Firestore Rules Security Testing", () => {
  beforeAll(async () => {
    // Hide Firestore warnings
    setLogLevel("error");

    testEnv = await initializeTestEnvironment({
      projectId: "bkgalabovo-test",
      firestore: {
        rules: readFileSync(
          resolve(__dirname, "../../firestore.rules"),
          "utf8"
        ),
        host: "127.0.0.1",
        port: 8081,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  const getUnauthDb = () => testEnv.unauthenticatedContext().firestore();

  const getAuthDb = (
    uid = "user123",
    email = "user@example.com",
    admin = false,
    allowedSites = ["bkgalabovo", "recoveryzone"]
  ) => {
    return testEnv
      .authenticatedContext(uid, { email, admin, allowedSites })
      .firestore();
  };

  const getAdminDb = () =>
    getAuthDb("admin123", "bkgalabovo2014@gmail.com", true, [
      "bkgalabovo",
      "recoveryzone",
    ]);

  describe("Collection: members & GDPR rules", () => {
    it("анонимен потребител НЕ може да чете members", async () => {
      const db = getUnauthDb();
      const docRef = db.collection("members").doc("m1");
      await expect(assertFails(docRef.get())).resolves.toBeDefined();
    });

    it("логнат потребител МОЖЕ да чете members от неговия siteId", async () => {
      const db = getAuthDb("user1", "user@test.com", false, ["bkgalabovo"]);
      // Трябва да имаме документ със съответния siteId, за да прочетем.
      // Нека админът създаде документа първо
      const adminDb = getAdminDb();
      await adminDb
        .collection("members")
        .doc("m1")
        .set({ siteId: "bkgalabovo", name: "Player" });

      const docRef = db.collection("members").doc("m1");
      await expect(assertSucceeds(docRef.get())).resolves.toBeDefined();
    });

    it("логнат потребител НЕ може да чете members от чужд siteId", async () => {
      const db = getAuthDb("user1", "user@test.com", false, ["recoveryzone"]);
      const adminDb = getAdminDb();
      await adminDb
        .collection("members")
        .doc("m2")
        .set({ siteId: "bkgalabovo", name: "Player" });

      const docRef = db.collection("members").doc("m2");
      await expect(assertFails(docRef.get())).resolves.toBeDefined();
    });

    it("логнат потребител НЕ може да пише в members", async () => {
      const db = getAuthDb();
      const docRef = db.collection("members").doc("m1");
      await expect(
        assertFails(docRef.set({ name: "Hacker", siteId: "bkgalabovo" }))
      ).resolves.toBeDefined();
    });

    it("админ МОЖЕ да пише в members с валиден siteId", async () => {
      const db = getAdminDb();
      const docRef = db.collection("members").doc("m3");
      await expect(
        assertSucceeds(
          docRef.set({ name: "Admin Setup", siteId: "bkgalabovo" })
        )
      ).resolves.toBeUndefined();
    });
  });

  describe("Collection: member_assessments", () => {
    it("админ МОЖЕ да създава оценки (member_assessments)", async () => {
      const db = getAdminDb();
      const docRef = db.collection("member_assessments").doc("a1");
      await expect(
        assertSucceeds(docRef.set({ score: 10, siteId: "bkgalabovo" }))
      ).resolves.toBeUndefined();
    });

    it("обикновен потребител НЕ може да създава оценки (GDPR)", async () => {
      const db = getAuthDb();
      const docRef = db.collection("member_assessments").doc("a2");
      await expect(
        assertFails(docRef.set({ score: 10, siteId: "bkgalabovo" }))
      ).resolves.toBeDefined();
    });

    it("админ НЕ може да създава оценка за сайт, към който няма достъп", async () => {
      const db = getAuthDb("admin_limited", "admin@limited.com", true, [
        "recoveryzone",
      ]);
      const docRef = db.collection("member_assessments").doc("a3");
      await expect(
        assertFails(docRef.set({ score: 10, siteId: "bkgalabovo" }))
      ).resolves.toBeDefined();
    });
  });

  describe("Collection: inventory & sales (Strict Admin Roles)", () => {
    it("обикновен логнат потребител НЕ може да чете sales", async () => {
      const db = getAuthDb();
      const docRef = db.collection("sales").doc("s1");
      await expect(assertFails(docRef.get())).resolves.toBeDefined();
    });

    it("обикновен логнат потребител НЕ може да чете inventory", async () => {
      const db = getAuthDb();
      const docRef = db.collection("inventory").doc("inv1");
      await expect(assertFails(docRef.get())).resolves.toBeDefined();
    });

    it("админ МОЖЕ да чете и пише в inventory за неговия siteId", async () => {
      const db = getAdminDb();
      const docRef = db.collection("inventory").doc("inv1");
      await expect(
        assertSucceeds(docRef.set({ product: "Water", siteId: "bkgalabovo" }))
      ).resolves.toBeUndefined();
      await expect(assertSucceeds(docRef.get())).resolves.toBeDefined();
    });
  });

  describe("Collection: tournaments (Public Access)", () => {
    it("анонимен потребител МОЖЕ да чете tournaments", async () => {
      const db = getUnauthDb();
      const docRef = db.collection("tournaments").doc("t1");
      await expect(assertSucceeds(docRef.get())).resolves.toBeDefined();
    });

    it("анонимен потребител НЕ може да пише в tournaments", async () => {
      const db = getUnauthDb();
      const docRef = db.collection("tournaments").doc("t1");
      await expect(
        assertFails(
          docRef.set({ name: "Hacked Tournament", siteId: "bkgalabovo" })
        )
      ).resolves.toBeDefined();
    });
  });
});

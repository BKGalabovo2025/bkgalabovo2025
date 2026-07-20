import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { setLogLevel } from "firebase/firestore";

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

  describe("Collection: members", () => {
    it("анонимен потребител НЕ може да чете members", async () => {
      const db = getUnauthDb();
      const docRef = db.collection("members").doc("m1");
      await expect(assertFails(docRef.get())).resolves.toBeDefined();
    });

    it("логнат потребител МОЖЕ да чете members", async () => {
      const db = getAuthDb();
      const docRef = db.collection("members").doc("m1");
      await expect(assertSucceeds(docRef.get())).resolves.toBeDefined();
    });

    it("логнат потребител НЕ може да пише в members", async () => {
      const db = getAuthDb();
      const docRef = db.collection("members").doc("m1");
      await expect(
        assertFails(docRef.set({ name: "Hacker" }))
      ).resolves.toBeDefined();
    });

    it("админ МОЖЕ да пише в members, ако има валиден siteId", async () => {
      const db = getAdminDb();
      const docRef = db.collection("members").doc("m1");
      await expect(
        assertSucceeds(
          docRef.set({ name: "Admin Setup", siteId: "bkgalabovo" })
        )
      ).resolves.toBeDefined();
    });

    it("админ НЕ може да пише в members с невалиден siteId", async () => {
      const db = getAdminDb();
      const docRef = db.collection("members").doc("m1");
      await expect(
        assertFails(docRef.set({ name: "Admin Setup", siteId: "hacked_site" }))
      ).resolves.toBeDefined();
    });
  });

  describe("Collection: sales", () => {
    it("обикновен логнат потребител НЕ може да чете sales", async () => {
      const db = getAuthDb();
      const docRef = db.collection("sales").doc("s1");
      await expect(assertFails(docRef.get())).resolves.toBeDefined();
    });

    it("админ МОЖЕ да чете sales", async () => {
      const db = getAdminDb();
      const docRef = db.collection("sales").doc("s1");
      await expect(assertSucceeds(docRef.get())).resolves.toBeDefined();
    });
  });

  describe("Collection: tournaments", () => {
    it("анонимен потребител МОЖЕ да чете tournaments", async () => {
      const db = getUnauthDb();
      const docRef = db.collection("tournaments").doc("t1");
      await expect(assertSucceeds(docRef.get())).resolves.toBeDefined();
    });

    it("анонимен потребител НЕ може да пише в tournaments", async () => {
      const db = getUnauthDb();
      const docRef = db.collection("tournaments").doc("t1");
      await expect(
        assertFails(docRef.set({ name: "Hacked Tournament" }))
      ).resolves.toBeDefined();
    });
  });
});

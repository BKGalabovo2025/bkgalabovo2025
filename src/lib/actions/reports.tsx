"use server";

import * as React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAdminDb } from "@/lib/firebase-admin";

// We'll define a simple PDF component internally or import it
// For this example, I'll define a very basic structure
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  label: { width: 120, fontWeight: "bold" },
  value: { flex: 1 },
});

const MemberPDF = ({ member }: { member: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Картон на Член</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Име:</Text>
        <Text style={styles.value}>{member.name}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Статус:</Text>
        <Text style={styles.value}>{member.status}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Група:</Text>
        <Text style={styles.value}>{member.ageGroup || "N/A"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Телефон:</Text>
        <Text style={styles.value}>{member.phone || "N/A"}</Text>
      </View>
      <View style={{ marginTop: 40 }}>
        <Text>Генерирано от BKGálabovo Management System</Text>
        <Text>Дата: {new Date().toLocaleDateString("bg-BG")}</Text>
      </View>
    </Page>
  </Document>
);

export async function generateMemberPDFAction(memberId: string) {
  try {
    const db = getAdminDb();
    const doc = await db.collection("members").doc(memberId).get();

    if (!doc.exists) throw new Error("Member not found");
    const member = doc.data();

    // Render PDF to buffer on the server
    const buffer = await renderToBuffer(<MemberPDF member={member} />);

    // Return as base64 string (since Server Actions can't return streams directly easily)
    return {
      success: true,
      pdfBase64: buffer.toString("base64"),
      fileName: `member_${memberId}.pdf`,
    };
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return { success: false, message: error.message };
  }
}

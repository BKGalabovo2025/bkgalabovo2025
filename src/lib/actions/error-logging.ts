"use server";
import "server-only";

import nodemailer from "nodemailer";

import { getAdminDb } from "@/lib/firebase-admin";

export interface ErrorLogDetails {
  message: string;
  stack?: string;
  context?: string;
  path?: string;
}

export async function logSystemError(details: ErrorLogDetails) {
  try {
    const db = getAdminDb();

    const errorDocument = {
      ...details,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    // 1. Запис във Firestore
    await db.collection("system_errors").add(errorDocument);

    // 2. Изпращане на имейл известие
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const adminEmail =
      process.env.ADMIN_ARCHIVE_EMAIL || "bkgalabovo2014@gmail.com";

    if (user && pass) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: user,
          pass: pass,
        },
      });

      const mailOptions = {
        from: {
          name: "Системен Мониторинг - БК Гълъбово",
          address: user,
        },
        to: adminEmail,
        subject: `⚠️ КРИТИЧНА ГРЕШКА В СИСТЕМАТА: ${details.message.substring(0, 50)}...`,
        text: `
Възникна нова системна грешка!

Съобщение: ${details.message}
Път/URL: ${details.path || "Неизвестен"}
Контекст: ${details.context || "Няма допълнителен контекст"}

Stack Trace:
${details.stack || "Няма stack trace"}

Влезте в админ панела, за да прегледате всички грешки.
        `,
      };

      await transporter.sendMail(mailOptions);
    } else {
      console.warn(
        "Критична грешка бе записана в базата, но липсват EMAIL_USER/PASS за изпращане на известие."
      );
    }
  } catch (err) {
    // Ако самият логър се счупи (напр. базата падне), го принтираме в конзолата
    console.error("КРИТИЧНО: Неуспешен опит за запис на системна грешка:", err);
  }
}

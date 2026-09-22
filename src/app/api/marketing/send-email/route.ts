/* eslint-disable sonarjs/cognitive-complexity */
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

import { ensureAdmin, ensureAdminFromSession } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";

const SendEmailSchema = z.object({
  recipients: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        childName: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .min(1, "Моля, изберете поне един получател с валиден имейл адрес."),
  subject: z.string().trim().min(1, "Моля, въведете тема на имейла."),
  messageText: z.string().trim().min(1, "Моля, въведете текст на имейла."),
  templateTitle: z.string().optional(),
  siteId: z.string().default("bkgalabovo"),
  senderProfile: z.enum(["bkgalabovo", "recoveryzone"]).optional(),
});

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split("Bearer ")[1];
    let adminUid = "admin";

    if (token) {
      const decoded = await ensureAdmin(token);
      adminUid = decoded.uid;
    } else {
      const session = await ensureAdminFromSession();
      adminUid = session.uid;
    }

    const json = await request.json();
    const parsed = SendEmailSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Невалидни данни за изпращане.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      recipients,
      subject,
      messageText,
      templateTitle,
      siteId,
      senderProfile,
    } = parsed.data;
    const isRecovery = (senderProfile || siteId) === "recoveryzone";

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      return NextResponse.json(
        {
          error:
            "Имейл сървърът не е конфигуриран (липсват EMAIL_USER или EMAIL_PASS).",
        },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPass },
    });

    const senderName = isRecovery
      ? "Recovery Zone by ZM"
      : "Бадминтон Клуб Гълъбово";

    const brandColor = isRecovery ? "#10b981" : "#2563eb";
    const brandBg = isRecovery ? "#09090b" : "#f8fafc";
    const cardBg = isRecovery ? "#18181b" : "#ffffff";
    const textColor = isRecovery ? "#ffffff" : "#0f172a";
    const mutedColor = isRecovery ? "#a1a1aa" : "#64748b";
    const borderColor = isRecovery ? "#27272a" : "#e2e8f0";

    const adminDb = getAdminDb();
    const now = new Date().toISOString();
    let sentCount = 0;
    let failedCount = 0;
    const batchLogs = [];

    const escapeHtml = (str: unknown): string => {
      if (str === null || str === undefined) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    for (const r of recipients) {
      try {
        const personalizedMessage = messageText
          .replace(/{ИМЕ}/g, r.name)
          .replace(/{ДЕТЕ}/g, r.childName || r.name)
          .replace(/{СЪБИТИЕ}/g, "Клубно събитие")
          .replace(/{ДАТА}/g, new Date().toLocaleDateString("bg-BG"))
          .replace(/{ЧАС}/g, "18:00 ч.")
          .replace(
            /{ЛОКАЦИЯ}/g,
            isRecovery
              ? "Спортна зала „Енергетик“ - Recovery Zone by ZM"
              : 'Спортна зала „Енергетик"'
          )
          .replace(
            /{ЛИНК_АНКЕТА}/g,
            "https://bkgalabovo2025.vercel.app/feedback/sample"
          );

        const safeSubject = escapeHtml(subject).replace(/[\r\n]+/g, " ");
        const formattedBody = personalizedMessage
          .split("\n")
          .map(
            (line) => `<p style="margin: 0 0 12px 0;">${escapeHtml(line)}</p>`
          )
          .join("");

        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: ${brandBg}; color: ${textColor}; padding: 32px 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: ${brandColor}; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800;">
                ${isRecovery ? "🌿 RECOVERY ZONE BY ZM" : "🏸 БК ГЪЛЪБОВО"}
              </h2>
              <p style="color: ${mutedColor}; font-size: 13px; margin: 4px 0 0 0; letter-spacing: 0.5px;">
                ${isRecovery ? "Център за спортно възстановяване и релакс" : "Бадминтон Клуб Гълъбово"}
              </p>
            </div>

            <div style="background-color: ${cardBg}; padding: 28px; border-radius: 16px; border: 1px solid ${borderColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.05); font-size: 15px; line-height: 1.6;">
              <div style="color: ${textColor};">
                ${formattedBody}
              </div>
            </div>

            <div style="text-align: center; margin-top: 24px; font-size: 12px; color: ${mutedColor}; line-height: 1.5;">
              <p style="margin: 0 0 4px 0;">
                ${isRecovery ? "Recovery Zone by ZM • Спортна зала „Енергетик“, гр. Гълъбово" : "Бадминтон Клуб Гълъбово • Спортна зала „Енергетик“"}
              </p>
              <p style="margin: 0;">
                Телефон: 0899 829 923 • Имейл: ${emailUser}
              </p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: {
            name: senderName,
            address: emailUser,
          },
          to: r.email,
          subject: safeSubject,
          html,
          text: personalizedMessage,
        });

        sentCount++;
        batchLogs.push({
          siteId,
          recipientId: r.id,
          recipientName: r.name,
          recipientEmail: r.email,
          recipientPhone: r.phone || null,
          channel: "email" as const,
          messageText: personalizedMessage,
          campaignTitle: subject,
          templateUsed: templateTitle || "Персонален имейл",
          status: "sent" as const,
          sentAt: now,
          sentBy: adminUid,
        });
      } catch (err) {
        console.error(`Failed to send email to ${r.email}:`, err);
        failedCount++;
        batchLogs.push({
          siteId,
          recipientId: r.id,
          recipientName: r.name,
          recipientEmail: r.email,
          recipientPhone: r.phone || null,
          channel: "email" as const,
          messageText: messageText,
          campaignTitle: subject,
          templateUsed: templateTitle || "Персонален имейл",
          status: "failed" as const,
          sentAt: now,
          sentBy: adminUid,
        });
      }
    }

    // Save history logs to Firestore
    if (batchLogs.length > 0) {
      const batch = adminDb.batch();
      const colRef = adminDb.collection("marketing_history");
      for (const log of batchLogs) {
        const newDocRef = colRef.doc();
        batch.set(newDocRef, log);
      }
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      total: recipients.length,
      message: `Успешно изпратени: ${sentCount} от ${recipients.length} имейла.`,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "";
    if (
      errorMsg.includes("администраторски права") ||
      errorMsg.includes("Невалидна сесия") ||
      errorMsg.includes("Unauthorized")
    ) {
      return NextResponse.json(
        { error: errorMsg || "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("[marketing-send-email] Error:", error);
    return NextResponse.json(
      { error: "Грешка при изпращането на имейли." },
      { status: 500 }
    );
  }
}

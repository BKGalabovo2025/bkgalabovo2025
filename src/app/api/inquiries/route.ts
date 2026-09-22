/* eslint-disable sonarjs/cognitive-complexity */
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

import { ensureAdmin, ensureAdminFromSession } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";

const InquiryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Моля, въведете име и фамилия (поне 2 символа)."),
  phone: z.string().trim().min(6, "Моля, въведете валиден телефонен номер."),
  target: z.enum(["self", "child"]).optional().nullable(),
  childAge: z.string().trim().optional().nullable(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  eventId: z.string().optional().nullable(),
  eventTitle: z
    .string()
    .trim()
    .min(1, "Липсва заглавие на събитието или процедурата."),
  eventDate: z.string().optional().nullable(),
  eventTime: z.string().optional().nullable(),
  eventLocation: z.string().optional().nullable(),
  siteId: z.string().default("bkgalabovo"),
  // Recovery zone specific fields
  procedureName: z.string().trim().optional().nullable(),
  preferredZone: z.string().trim().optional().nullable(),
  goal: z.string().trim().optional().nullable(),
  preferredTimeSlot: z.string().trim().optional().nullable(),
});

const targetTranslations: Record<string, string> = {
  self: "За мен (възрастен / любител)",
  child: "За дете",
};

const levelTranslations: Record<string, string> = {
  beginner: "Начинаещ",
  intermediate: "Средно ниво",
  advanced: "Напреднал",
};

/**
 * Public endpoint: Submit new inquiry
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = InquiryInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Невалидни данни.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const isRecovery = data.siteId === "recoveryzone";
    const now = new Date().toISOString();

    const inquiryRecord = {
      name: data.name,
      phone: data.phone,
      target: data.target || "self",
      childAge: data.target === "child" ? data.childAge || null : null,
      level: data.level || (isRecovery ? null : "beginner"),
      notes: data.notes || null,
      eventId: data.eventId || null,
      eventTitle: data.eventTitle,
      eventDate: data.eventDate || null,
      eventTime: data.eventTime || null,
      eventLocation:
        data.eventLocation ||
        (isRecovery
          ? "Спортна зала „Енергетик“ - Recovery Zone by ZM"
          : 'Спортна зала „Енергетик"'),
      siteId: data.siteId || "bkgalabovo",
      status: "new",
      createdAt: now,
      contactedAt: null,
      procedureName:
        data.procedureName || (isRecovery ? data.eventTitle : null),
      preferredZone: data.preferredZone || null,
      goal: data.goal || null,
      preferredTimeSlot: data.preferredTimeSlot || null,
    };

    const adminDb = getAdminDb();
    const docRef = await adminDb.collection("inquiries").add(inquiryRecord);

    // Send email notification asynchronously
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const adminEmail = isRecovery
      ? "recoveryzonebyzm@gmail.com"
      : process.env.ADMIN_NOTIFICATION_EMAIL ||
        process.env.ADMIN_ARCHIVE_EMAIL ||
        "bkgalabovo2014@gmail.com";

    if (emailUser && emailPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: emailUser, pass: emailPass },
        });

        const escapeHtml = (str: unknown): string => {
          if (str === null || str === undefined) return "";
          return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        };

        const safeName = escapeHtml(data.name);
        const safePhone = escapeHtml(data.phone);
        const safeEventTitle = escapeHtml(data.eventTitle);
        const safeNotes = escapeHtml(data.notes);
        const safeSubjectName = data.name.replace(/[\r\n]+/g, " ");
        const safeSubjectTitle = data.eventTitle.replace(/[\r\n]+/g, " ");

        if (isRecovery) {
          const safeZone = escapeHtml(data.preferredZone);
          const safeGoal = escapeHtml(data.goal);
          const safeTimeSlot = escapeHtml(data.preferredTimeSlot);
          const safeEventDate = escapeHtml(data.eventDate);

          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #10b981;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #10b981; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">🌿 RECOVERY ZONE BY ZM</h2>
                <p style="color: #a1a1aa; font-size: 13px; margin-top: 4px;">Ново онлайн запитване за възстановителна процедура</p>
              </div>
              <div style="background-color: #18181b; padding: 20px; border-radius: 12px; border: 1px solid #27272a;">
                <p style="margin: 8px 0; font-size: 15px;"><strong>Процедура:</strong> <span style="color: #34d399; font-weight: bold;">${safeEventTitle}</span></p>
                ${data.preferredZone ? `<p style="margin: 8px 0;"><strong>Зона / Приставка:</strong> ${safeZone}</p>` : ""}
                ${data.goal ? `<p style="margin: 8px 0;"><strong>Цел на посещението:</strong> ${safeGoal}</p>` : ""}
                ${data.preferredTimeSlot ? `<p style="margin: 8px 0;"><strong>Удобно време:</strong> ${safeTimeSlot}</p>` : ""}
                ${data.eventDate ? `<p style="margin: 8px 0;"><strong>Предпочитана дата:</strong> ${safeEventDate}</p>` : ""}
                <hr style="border: none; border-top: 1px solid #27272a; margin: 16px 0;" />
                <p style="margin: 8px 0;"><strong>Име на клиент:</strong> ${safeName}</p>
                <p style="margin: 8px 0;"><strong>Телефон:</strong> <a href="tel:${safePhone}" style="color: #34d399; font-weight: bold; font-size: 16px;">${safePhone}</a></p>
                ${data.notes ? `<p style="margin: 8px 0;"><strong>Бележка / Въпрос:</strong> <em>${safeNotes}</em></p>` : ""}
              </div>
              <p style="font-size: 11px; color: #71717a; text-align: center; margin-top: 20px;">Получено на ${new Date(now).toLocaleString("bg-BG")} през официалния уебсайт на Recovery Zone by ZM.</p>
            </div>
          `;

          await transporter.sendMail({
            from: {
              name: "Recovery Zone by ZM - Онлайн Запитвания",
              address: emailUser,
            },
            to: adminEmail,
            subject: `[Ново запитване за процедура] ${safeSubjectName} - ${safeSubjectTitle}`,
            html: htmlContent,
            text: `Ново запитване за процедура ${data.eventTitle} от ${data.name} (тел: ${data.phone}).`,
          });
        } else {
          const targetText =
            data.target === "child" && data.childAge
              ? `За дете (възраст: ${data.childAge})`
              : targetTranslations[data.target || "self"] || data.target;

          const levelText = data.level
            ? levelTranslations[data.level] || data.level
            : "Стандартно";

          const safeTargetText = escapeHtml(targetText);
          const safeLevelText = escapeHtml(levelText);
          const safeLocation = escapeHtml(
            data.eventLocation || 'Спортна зала „Енергетик"'
          );
          const safeEventDate = escapeHtml(data.eventDate);
          const safeEventTime = escapeHtml(data.eventTime || "");

          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1e3a8a; margin-top: 0;">🏸 Ново запитване от сайта на БК Гълъбово</h2>
              <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin: 6px 0;"><strong>Събитие:</strong> ${safeEventTitle}</p>
                ${data.eventDate ? `<p style="margin: 6px 0;"><strong>Дата/Час:</strong> ${safeEventDate} (${safeEventTime})</p>` : ""}
                <p style="margin: 6px 0;"><strong>Място:</strong> ${safeLocation}</p>
                <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 16px 0;" />
                <p style="margin: 6px 0;"><strong>Име на кандидат:</strong> ${safeName}</p>
                <p style="margin: 6px 0;"><strong>Телефон за връзка:</strong> <a href="tel:${safePhone}" style="color: #2563eb; font-weight: bold;">${safePhone}</a></p>
                <p style="margin: 6px 0;"><strong>За кого:</strong> ${safeTargetText}</p>
                <p style="margin: 6px 0;"><strong>Ниво:</strong> ${safeLevelText}</p>
                ${data.notes ? `<p style="margin: 6px 0;"><strong>Бележка/Въпрос:</strong> <em>${safeNotes}</em></p>` : ""}
              </div>
              <p style="font-size: 12px; color: #6b7280; margin-top: 16px;">Получено на ${new Date(now).toLocaleString("bg-BG")} от уебсайта на клуба.</p>
            </div>
          `;

          await transporter.sendMail({
            from: {
              name: "БК Гълъбово - Уебсайт",
              address: emailUser,
            },
            to: adminEmail,
            subject: `[Ново запитване] ${safeSubjectName} - ${safeSubjectTitle}`,
            html: htmlContent,
            text: `Ново запитване за ${data.eventTitle} от ${data.name} (тел: ${data.phone}). Ниво: ${levelText}, За кого: ${targetText}.`,
          });
        }
      } catch (mailErr) {
        console.warn(
          "[inquiries-api] Failed to send email notification:",
          mailErr
        );
      }
    }

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: isRecovery
        ? "Запитването за сесия е прието успешно."
        : "Запитването е прието успешно.",
    });
  } catch (error) {
    console.error("[inquiries-api] Error submitting inquiry:", error);
    return NextResponse.json(
      {
        error:
          "Възникна системна грешка. Моля, опитайте отново или се обадете по телефона.",
      },
      { status: 500 }
    );
  }
}

/**
 * Admin endpoint: List inquiries for the site (siteId aware)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId") || "bkgalabovo";

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split("Bearer ")[1];

    // Check either Bearer token or session cookie
    if (token) {
      await ensureAdmin(token);
    } else {
      await ensureAdminFromSession();
    }

    const adminDb = getAdminDb();
    let query: FirebaseFirestore.Query = adminDb.collection("inquiries");

    if (siteId && siteId !== "all") {
      query = query.where("siteId", "==", siteId);
    }

    const snapshot = await query.get();

    const inquiries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort descending by createdAt
    inquiries.sort(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

    return NextResponse.json({ inquiries, siteId });
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
    console.error("[inquiries-api] Error fetching inquiries:", error);
    return NextResponse.json(
      { error: "Грешка при зареждане на запитванията." },
      { status: 500 }
    );
  }
}

/**
 * Admin endpoint: Update inquiry details and status
 */
export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split("Bearer ")[1];
    if (token) {
      await ensureAdmin(token);
    } else {
      await ensureAdminFromSession();
    }

    const body = await request.json();
    const { id, status, ...fields } = body;
    if (!id) {
      return NextResponse.json(
        { error: "Липсва ID на запитване." },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (status) {
      updateData.status = status;
      if (status === "contacted" || status === "enrolled") {
        updateData.contactedAt = new Date().toISOString();
      } else if (status === "new") {
        updateData.contactedAt = null;
      }
    }

    // Editable fields
    const allowedFields = [
      "name",
      "phone",
      "notes",
      "eventTitle",
      "eventDate",
      "eventTime",
      "eventLocation",
      "procedureName",
      "preferredZone",
      "goal",
      "preferredTimeSlot",
      "target",
      "childAge",
      "level",
    ];

    for (const key of allowedFields) {
      if (key in fields) {
        updateData[key] = fields[key];
      }
    }

    await adminDb.collection("inquiries").doc(id).update(updateData);

    return NextResponse.json({
      success: true,
      message: "Запитването е обновено успешно.",
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
    console.error("[inquiries-api] Error updating inquiry:", error);
    return NextResponse.json(
      { error: "Грешка при обновяване на запитването." },
      { status: 500 }
    );
  }
}

/**
 * Admin endpoint: Delete an inquiry permanently
 */
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split("Bearer ")[1];
    if (token) {
      await ensureAdmin(token);
    } else {
      await ensureAdminFromSession();
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // Body may be empty if id was in query param
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: "Липсва ID на запитване за изтриване." },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    await adminDb.collection("inquiries").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Запитването беше изтрито успешно.",
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
    console.error("[inquiries-api] Error deleting inquiry:", error);
    return NextResponse.json(
      { error: "Грешка при изтриване на запитването." },
      { status: 500 }
    );
  }
}

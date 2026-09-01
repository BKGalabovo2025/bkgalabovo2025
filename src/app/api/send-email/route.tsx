import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "react-email";
import { z } from "zod";

import {
  DeactivatedEmail,
  DeactivatedEmailProps,
} from "@/components/emails/deactivated-email";
import {
  MarketingEmail,
  MarketingEmailProps,
} from "@/components/emails/marketing-email";
import {
  ReminderEmail,
  ReminderEmailProps,
} from "@/components/emails/reminder-email";
import {
  ReservationConfirmationEmail,
  ReservationConfirmationEmailProps,
} from "@/components/emails/reservation-confirmation-email";
import { ensureAdmin } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";

// Define the data types for each email template
type EmailTemplateData = {
  reminder: ReminderEmailProps;
  reservationConfirmation: ReservationConfirmationEmailProps & {
    isRecoveryZone?: boolean;
  };
  deactivated: DeactivatedEmailProps;
  marketing: MarketingEmailProps;
};

// Define Zod schemas for each template's data
const ReminderEmailDataSchema = z.object({
  memberName: z.string().optional(),
});

const ReservationConfirmationEmailDataSchema = z.object({
  clientName: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  courtId: z.string().min(1),
  baseUrl: z.string().url().optional(),
  isRecoveryZone: z.boolean().optional(),
});

const DeactivatedEmailDataSchema = z.object({
  memberName: z.string().optional(),
});

const MarketingEmailDataSchema = z.object({
  memberName: z.string().optional(),
  messageText: z.string().min(1),
});

// Discriminated union for template-specific data validation
const EmailDataSchema = z.discriminatedUnion("template", [
  z.object({ template: z.literal("reminder"), data: ReminderEmailDataSchema }),
  z.object({
    template: z.literal("reservationConfirmation"),
    data: ReservationConfirmationEmailDataSchema,
  }),
  z.object({
    template: z.literal("deactivated"),
    data: DeactivatedEmailDataSchema,
  }),
  z.object({
    template: z.literal("marketing"),
    data: MarketingEmailDataSchema,
  }),
]);

// A mapping of template names to their components and text generators
const templates = {
  reminder: {
    component: ReminderEmail,
    getText: (data: ReminderEmailProps) => {
      if (data.memberName) {
        return `Здравейте, ${data.memberName}. Напомняме Ви за просрочено плащане към Бадминтон Клуб Гълъбово. Моля, свържете се с нас за повече информация.`;
      }
      return "Просрочено плащане към Бадминтон Клуб Гълъбово."; // Generic fallback
    },
  },
  reservationConfirmation: {
    component: ReservationConfirmationEmail,
    getText: (data: ReservationConfirmationEmailProps) => {
      const { clientName, startTime, endTime, courtId, isRecoveryZone } = data;
      // Important: Re-create Date objects if they are passed as strings
      const formattedStartTime = new Date(startTime).toLocaleString("bg-BG", {
        dateStyle: "full",
        timeStyle: "short",
      });
      const formattedEndTime = new Date(endTime).toLocaleString("bg-BG", {
        timeStyle: "short",
      });

      if (isRecoveryZone) {
        return `Здравейте, ${clientName}. Вашата резервация във възстановителния център е потвърдена. Детайли: ${courtId}, от ${formattedStartTime} до ${formattedEndTime} ч.`;
      }
      return `Здравейте, ${clientName}. Вашата резервация в бадминтон клуб "Гълъбово" е потвърдена. Детайли: Корт ${courtId}, от ${formattedStartTime} до ${formattedEndTime} ч.`;
    },
  },
  deactivated: {
    component: DeactivatedEmail,
    getText: (data: DeactivatedEmailProps) => {
      if (data.memberName) {
        return `Здравейте, ${data.memberName}. Поради липса на активен абонамент за последните 30 дни, статусът на Вашия профил в Бадминтон Клуб Гълъбово беше променен на неактивен.`;
      }
      return "Вашето членство в Бадминтон Клуб Гълъбово беше променено на неактивно поради липса на плащане.";
    },
  },
  marketing: {
    component: MarketingEmail,
    getText: (data: MarketingEmailProps) => {
      return data.messageText || "Съобщение от БК Гълъбово";
    },
  },
};

const EmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  template: z.enum([
    "reminder",
    "reservationConfirmation",
    "deactivated",
    "marketing",
  ]),
  data: z.record(z.string(), z.any()), // Validated separately via EmailDataSchema
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(),
        encoding: z.string().optional(),
      })
    )
    .optional(),
});

async function renderEmailTemplate<T extends keyof EmailTemplateData>(
  template: T,
  data: EmailTemplateData[T]
) {
  let html: string;
  let text: string;

  if (template === "reminder") {
    const props = data as ReminderEmailProps;
    html = await render(<ReminderEmail {...props} />);
    text = templates.reminder.getText(props);
  } else if (template === "reservationConfirmation") {
    const props = data as ReservationConfirmationEmailProps;
    html = await render(<ReservationConfirmationEmail {...props} />);
    text = templates.reservationConfirmation.getText(props);
  } else if (template === "deactivated") {
    const props = data as DeactivatedEmailProps;
    html = await render(<DeactivatedEmail {...props} />);
    text = templates.deactivated.getText(props);
  } else if (template === "marketing") {
    const props = data as MarketingEmailProps;
    html = await render(<MarketingEmail {...props} />);
    text = templates.marketing.getText(props);
  } else {
    const _exhaustive: never = template;
    throw new Error(`Unknown email template: ${String(_exhaustive)}`);
  }

  return { html, text };
}

async function authorizeEmailRequest(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const isCronAuthorized =
    Boolean(process.env.CRON_SECRET) &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (isCronAuthorized) return true;

  try {
    const token = authHeader?.split("Bearer ")[1];
    if (!token) return false;
    await ensureAdmin(token);
    return true;
  } catch (err) {
    console.warn("[send-email] Unauthorized attempt blocked.", err);
    return false;
  }
}

async function recordEmailLog(
  recipient: string,
  subject: string,
  template: string,
  status: "delivered" | "failed",
  siteId?: string,
  error?: string
): Promise<void> {
  try {
    const adminDb = getAdminDb();
    await adminDb.collection("email_logs").add({
      recipient,
      subject: subject || "unknown",
      template: template || "unknown",
      status,
      error: error || null,
      siteId: siteId || process.env.NEXT_PUBLIC_SITE_ID || "bkgalabovo",
      sentAt: new Date().toISOString(),
    });
  } catch (logErr) {
    console.error("[send-email] Failed to record email_log:", logErr);
  }
}

export async function POST(request: Request) {
  const isAuthorized = await authorizeEmailRequest(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const baseResult = EmailSchema.safeParse(body);

    if (!baseResult.success) {
      return NextResponse.json(
        {
          error: "Невалидни данни за имейл",
          details: baseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const dataResult = EmailDataSchema.safeParse({
      template: baseResult.data.template,
      data: baseResult.data.data,
    });

    if (!dataResult.success) {
      return NextResponse.json(
        {
          error: "Невалидни данни за шаблона на имейла",
          details: dataResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { to, subject, template, data, attachments } = baseResult.data;
    const { html, text } = await renderEmailTemplate(
      template,
      data as EmailTemplateData[typeof template]
    );

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      const errorMessage =
        "Грешка в конфигурацията на сървъра: Липсват EMAIL_USER или EMAIL_PASS.";
      console.error(`[send-email] CRITICAL: ${errorMessage}`);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: {
        name: 'Администратор "Бадминтон Клуб Гълъбово"',
        address: user,
      },
      to,
      bcc: process.env.ADMIN_ARCHIVE_EMAIL || "bkgalabovo2014@gmail.com",
      subject,
      html,
      text,
      attachments,
    });

    await recordEmailLog(
      to,
      subject,
      template,
      "delivered",
      (data as { siteId?: string })?.siteId
    );

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    const e = error as Error & { code?: string };
    console.error("[send-email] Failed to send email:", e.message);

    await recordEmailLog("unknown", "", "", "failed", undefined, e.message);

    let errorMessage = "Възникна грешка при изпращането на имейла.";
    if (e.code === "EAUTH") {
      errorMessage =
        "Грешка при автентикация с Gmail. Проверете EMAIL_USER и EMAIL_PASS.";
    } else if (e.message.includes("template")) {
      errorMessage = e.message;
    }

    return NextResponse.json(
      { error: errorMessage, details: e.message },
      { status: 500 }
    );
  }
}

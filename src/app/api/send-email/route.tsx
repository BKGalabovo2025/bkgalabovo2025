import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "react-email";
import { z } from "zod";

import {
  ReminderEmail,
  ReminderEmailProps,
} from "@/components/emails/reminder-email";
import {
  ReservationConfirmationEmail,
  ReservationConfirmationEmailProps,
} from "@/components/emails/reservation-confirmation-email";

// Define the data types for each email template
type EmailTemplateData = {
  reminder: ReminderEmailProps;
  reservationConfirmation: ReservationConfirmationEmailProps;
  // Add other templates here...
};

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
      const { clientName, startTime, endTime, courtId } = data;
      // Important: Re-create Date objects if they are passed as strings
      const formattedStartTime = new Date(startTime).toLocaleString("bg-BG", {
        dateStyle: "full",
        timeStyle: "short",
      });
      const formattedEndTime = new Date(endTime).toLocaleString("bg-BG", {
        timeStyle: "short",
      });
      return `Здравейте, ${clientName}. Вашата резервация в бадминтон клуб "Гълъбово" е потвърдена. Детайли: Корт ${courtId}, от ${formattedStartTime} до ${formattedEndTime} ч.`;
    },
  },
};

const EmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  template: z.enum(["reminder", "reservationConfirmation"]),
  data: z.record(z.string(), z.any()), // Keep z.any() here for validation flexibility, but we will use the typed data below
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
  } else {
    throw new Error(`Unknown email template: ${template}`);
  }

  return { html, text };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = EmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Невалидни данни за имейл", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { to, subject, template, data } = result.data;

    console.log(
      `[send-email] Received request for: ${to}, template: ${template}`
    );

    const { html, text } = await renderEmailTemplate(
      template,
      data as EmailTemplateData[typeof template]
    );

    console.log(
      `[send-email] Template rendered successfully. HTML length: ${html.length}`
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
      service: "gmail",
      auth: {
        user: user,
        pass: pass, // This should be a Google App Password
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: {
        name: 'Администратор "Бадминтон Клуб Гълъбово"',
        address: user,
      },
      to: to,
      bcc: process.env.ADMIN_ARCHIVE_EMAIL || "bkgalabovo2014@gmail.com",
      subject: subject,
      html: html,
      text: text,
    };

    console.log(`[send-email] Attempting to send email via Gmail to: ${to}`);
    await transporter.sendMail(mailOptions);
    console.log(`[send-email] Successfully sent email to ${to}`);

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    const e = error as Error & { code?: string };
    console.error(
      "[send-email] CRITICAL: Failed to process and send email. Full Error:",
      JSON.stringify(e, null, 2)
    );

    let errorMessage = "Възникна грешка при изпращането на имейла.";
    if (e.code === "EAUTH") {
      errorMessage =
        "Грешка при автентикация с Gmail. Проверете EMAIL_USER и EMAIL_PASS. Препоръчително е да се използва App Password.";
    } else if (e.message.includes("template")) {
      errorMessage = e.message;
    }

    return NextResponse.json(
      { error: errorMessage, details: e.message },
      { status: 500 }
    );
  }
}

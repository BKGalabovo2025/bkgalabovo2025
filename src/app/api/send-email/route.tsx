
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import * as React from 'react';
import { render } from '@react-email/render';
import { ReminderEmail } from '@/components/emails/reminder-email';
import { z } from 'zod';

// A mapping of template names to their components and text generators
const templates: { [key: string]: { component: React.ComponentType<any>; getText: (data: any) => string; } } = {
    reminder: {
        component: ReminderEmail,
        getText: (data: any) => {
            if (data.memberName) {
                return `Здравейте, ${data.memberName}. Напомняме Ви за просрочено плащане към Бадминтон Клуб Гълъбово. Моля, свържете се с нас за повече информация.`;
            }
            return 'Просрочено плащане към Бадминтон Клуб Гълъбово.'; // Generic fallback
        }
    },
};

const EmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  template: z.enum(['reminder']), // Добавяй новите шаблони тук
  data: z.record(z.string(), z.any())
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = EmailSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: "Невалидни данни за имейл" }, { status: 400 });
    }

    // The payload now includes a template identifier and the data for it.
    const { to, subject, template, data } = result.data;

    console.log(`[send-email] Received request for: ${to}, template: ${template}`);

    const templateConfig = templates[template];
    if (!templateConfig) {
        return NextResponse.json({ error: `Шаблонът за имейл '${template}' не е намерен.` }, { status: 400 });
    }

    const { component: EmailComponent, getText } = templateConfig;

    // Render the React component to an HTML string
    console.log(`[send-email] Rendering template '${template}' with data:`, data);
    const html = await render(<EmailComponent {...data} />);
    const text = getText(data);
    console.log(`[send-email] Template rendered successfully. HTML length: ${html.length}`);

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      const errorMessage = "Грешка в конфигурацията на сървъра: Липсват EMAIL_USER или EMAIL_PASS.";
      console.error(`[send-email] CRITICAL: ${errorMessage}`);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass, // This should be a Google App Password
      },
    });

    const mailOptions = {
      from: {
        name: 'Администратор "Бадминтон Клуб Гълъбово"',
        address: user,
      },
      to: to,
      bcc: process.env.ADMIN_ARCHIVE_EMAIL || 'bkgalabovo2014@gmail.com',
      subject: subject,
      html: html, // The rendered HTML is now used here
      text: text, // A plain text version
    };
    
    console.log(`[send-email] Attempting to send email via Gmail to: ${to}`);
    await transporter.sendMail(mailOptions);
    console.log(`[send-email] Successfully sent email to ${to}`);

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[send-email] CRITICAL: Failed to process and send email. Full Error:', JSON.stringify(error, null, 2));
    
    let errorMessage = 'Възникна грешка при изпращането на имейла.';
    if (error.code === 'EAUTH') {
        errorMessage = 'Грешка при автентикация с Gmail. Проверете EMAIL_USER и EMAIL_PASS. Препоръчително е да се използва App Password.';
    } else if (error.message.includes('template')) { // A crude way to check for template errors
        errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
}

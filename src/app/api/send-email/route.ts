
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, html, text } = await request.json();

    // --- Start Enhanced Debugging ---
    console.log(`[send-email] Received payload for: ${to}`)
    console.log(`[send-email] Type of 'html' variable: ${typeof html}`)
    if (typeof html === 'string') {
        console.log(`[send-email] 'html' is a string. Snippet: ${html.substring(0, 150)}...`)
    } else if (typeof html === 'object' && html !== null) {
        console.log(`[send-email] 'html' is an object. Keys: ${Object.keys(html).join(', ')}`)
        console.log(`[send-email] Full object (stringified): ${JSON.stringify(html)}`)
    } else {
        console.log(`[send-email] 'html' is of another type: ${html}`)
    }
    // --- End Enhanced Debugging ---

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      const errorMessage = "Грешка в конфигурацията на сървъра: Липсват EMAIL_USER или EMAIL_PASS.";
      console.error(errorMessage);
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
      bcc: 'bkgalabovo2014@gmail.com', // Keep sending a copy to the admin email
      subject: subject,
      html: html, // The problem is here
      text: text,
    };
    
    console.log(`Attempting to send email via Gmail to: ${to}`);
    await transporter.sendMail(mailOptions);
    console.log(`Successfully sent email to ${to}`);

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });

  } catch (error: any) {
    // Log the detailed error from Nodemailer/Gmail
    console.error('Failed to send email via Gmail. Full Error:', JSON.stringify(error, null, 2));
    
    // Return a more specific error message
    let errorMessage = 'Възникна грешка при изпращането на имейла.';
    if (error.code === 'EAUTH') {
        errorMessage = 'Грешка при автентикация с Gmail. Проверете EMAIL_USER и EMAIL_PASS. Препоръчително е да се използва App Password.';
    } else if (error.code === 'ESTREAM') {
        errorMessage = 'Грешка в данните на имейла. Съдържанието (html) не е в правилния текстов формат.'
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, text, html } = await request.json();

    const user = process.env.GMAIL_EMAIL;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      console.error('Missing GMAIL_EMAIL or GMAIL_APP_PASSWORD environment variables');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });

    const mailOptions = {
      from: `"БК Гълъбово" <${user}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

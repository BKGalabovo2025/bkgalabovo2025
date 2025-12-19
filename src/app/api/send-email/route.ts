
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, text, html } = await request.json();

    const user = process.env.GMAIL_EMAIL;
    const pass = process.env.GMAIL_APP_PASSWORD;

    // === НОВА ПО-ДЕТАЙЛНА ПРОВЕРКА ===
    if (!user || !pass) {
      let errorMessage = "Грешка в конфигурацията на Vercel. ";
      if (!user) errorMessage += "Променливата GMAIL_EMAIL липсва или е грешна. ";
      if (!pass) errorMessage += "Променливата GMAIL_APP_PASSWORD липсва или е грешна.";
      
      console.error(errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
    // === КРАЙ НА НОВАТА ПРОВЕРКА ===
    
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
      html: html,
      text: text, // Добавям и текстова версия за съвместимост
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to send email:', error);
    // Връщаме оригиналната грешка от nodemailer, ако има такава
    const errorMessage = error.message || 'Failed to send email';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

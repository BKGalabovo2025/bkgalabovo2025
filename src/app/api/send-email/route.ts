
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, text, html } = await request.json();

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      let errorMessage = "Грешка в конфигурацията на Vercel. ";
      if (!user) errorMessage += "Променливата EMAIL_USER липсва. ";
      if (!pass) errorMessage += "Променливата EMAIL_PASS липсва.";
      
      console.error(errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass, // Should be a Google App Password
      },
    });

    const mailOptions = {
      from: {
        name: 'Администратор "Бадминтон Клуб Гълъбово"',
        address: user,
      },
      to: to,
      bcc: 'bkgalabovo2014@gmail.com',
      subject: subject,
      html: html,
      text: text,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to send email:', error);
    const errorMessage = error.message || 'Failed to send email';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

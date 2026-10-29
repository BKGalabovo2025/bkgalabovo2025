import "server-only";

import nodemailer from "nodemailer";

import { getSiteByIdAdmin } from "@/services/admin/site-service.admin";
import {
  DataCorrectionRequest,
  ParentAbsence,
  ParentAccessRequest,
} from "@/types/parent-portal.types";

const ADMIN_EMAIL =
  process.env.ADMIN_NOTIFY_EMAIL || "bkgalabovo2014@gmail.com";

/**
 * Извлича актуалните данни за клуба и спортната зала от администраторския панел (Настройки -> Информация за клуба).
 */
export async function getClubSiteInfo(): Promise<{
  clubName: string;
  hallName: string;
  address: string;
  fullFooterLine: string;
}> {
  try {
    const site = await getSiteByIdAdmin("bkgalabovo");
    const clubName = site?.name?.trim() || "СНЦ „Бадминтон клуб Гълъбово“";

    // Пълно наименование на залата от административния панел
    let hallName = site?.hallName?.trim();
    if (!hallName) {
      if (
        site?.address &&
        (site.address.toLowerCase().includes("зала") ||
          site.address.toLowerCase().includes("комплекс"))
      ) {
        hallName = site.address.split(",")[0].trim();
      } else {
        hallName = "Спортен комплекс „Енергетик“ град Гълъбово";
      }
    }
    const address =
      site?.address?.trim() ||
      "ул. Александър Стамболийски 41, 6280 Гълъбово, България";
    const fullFooterLine = `${clubName} — ${hallName}`;

    return { clubName, hallName, address, fullFooterLine };
  } catch (err) {
    console.warn(
      "[parent-email] Could not load club site settings, using fallback:",
      err
    );
    return {
      clubName: "СНЦ „Бадминтон клуб Гълъбово“",
      hallName: "Спортен комплекс „Енергетик“ град Гълъбово",
      address: "ул. Александър Стамболийски 41, 6280 Гълъбово, България",
      fullFooterLine:
        "СНЦ „Бадминтон клуб Гълъбово“ — Спортен комплекс „Енергетик“ град Гълъбово",
    };
  }
}

export async function sendParentPortalEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

  if (!user || !pass) {
    console.warn(
      "[parent-email] EMAIL_USER or EMAIL_PASS missing. Skipping email send to:",
      to
    );
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: {
        name: 'СНЦ "Бадминтон клуб Гълъбово" - Родителски портал',
        address: user,
      },
      to,
      subject,
      html,
      text: text || subject,
    });

    return true;
  } catch (error) {
    console.error("[parent-email] Failed to send email to:", to, error);
    return false;
  }
}

/**
 * Modern responsive HTML container for club emails.
 */
async function wrapEmailTemplate(content: string): Promise<string> {
  const { clubName, fullFooterLine } = await getClubSiteInfo();

  return `
<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; opacity: 0.9; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 32px 24px; font-size: 15px; line-height: 1.6; }
    .button-container { text-align: center; margin: 28px 0; }
    .button { display: inline-block; background: #2563eb; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${clubName.toUpperCase()}</h1>
      <p>Родителски портал</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      ${fullFooterLine}<br>
      Това е автоматично съобщение. Моля, не отговаряйте директно на този имейл.
    </div>
  </div>
</body>
</html>
`;
}

export async function notifyAdminNewRequest(request: ParentAccessRequest) {
  const roleLabel =
    request.parentRole === "mother"
      ? "Майка"
      : request.parentRole === "father"
        ? "Баща"
        : "Настойник";

  const html = await wrapEmailTemplate(`
    <h2 style="color: #0f172a; margin-top: 0;">Нова заявка за родителски достъп 🔔</h2>
    <p>Получена е нова заявка за регистрация в Родителския портал на БК Гълъбово:</p>
    <div class="card">
      <p><strong>Родител:</strong> ${request.parentName} (${roleLabel})</p>
      <p><strong>Телефон:</strong> ${request.parentPhone}</p>
      <p><strong>Имейл:</strong> ${request.parentEmail}</p>
      <p><strong>Дете:</strong> ${request.childFullName}</p>
      <p><strong>Рождена дата на детето:</strong> ${request.childBirthDate}</p>
      ${
        request.matchedMemberId
          ? `<p style="color: #16a34a;"><strong>✓ Открито съвпадение в базата</strong></p>`
          : `<p style="color: #ea580c;"><strong>! Изисква ръчно съпоставяне с член</strong></p>`
      }
    </div>
    <p>Моля, отворете административния панел, за да прегледате и одобрите заявката.</p>
  `);

  return sendParentPortalEmail({
    to: ADMIN_EMAIL,
    subject: `🔔 Нова заявка за родителски достъп: ${request.parentName} (${request.childFullName})`,
    html,
  });
}

export async function notifyParentApproved(
  parentEmail: string,
  parentName: string,
  childName: string,
  loginUrl: string
) {
  const html = await wrapEmailTemplate(`
    <h2 style="color: #16a34a; margin-top: 0;">Заявката ви за достъп е одобрена! 🎉</h2>
    <p>Здравейте, <strong>${parentName}</strong>,</p>
    <p>Администраторът одобри вашия достъп до профила на <strong>${childName}</strong>.</p>
    <p>Вече можете да следите месечните присъствия, актуалните данни и график на тренировките, както и да уведомявате треньора при отсъствие.</p>
    <div class="button-container">
      <a href="${loginUrl}" class="button">Вход в Родителския портал</a>
    </div>
    <p style="font-size: 13px; color: #64748b;">Можете да влезете със своя регистриран телефонен номер или имейл и паролата, която въведохте при подаване на заявката.</p>
  `);

  return sendParentPortalEmail({
    to: parentEmail,
    subject: `✓ Одобрен достъп до Родителския портал за ${childName}`,
    html,
  });
}

export async function notifyParentCreatedManually({
  parentEmail,
  parentName,
  childName,
  loginUrl,
  tempPassword,
  parentPhone,
}: {
  parentEmail: string;
  parentName: string;
  childName: string;
  loginUrl: string;
  tempPassword: string;
  parentPhone: string;
}) {
  const html = await wrapEmailTemplate(`
    <h2 style="color: #1d4ed8; margin-top: 0;">Вашият родителски достъп е готов! 🏸</h2>
    <p>Здравейте, <strong>${parentName}</strong>,</p>
    <p>Треньорът на клуба създаде за Вас профил в Родителския портал за състезателя <strong>${childName}</strong>.</p>
    
    <div class="card" style="border-left: 4px solid #2563eb; background: #f0f7ff; padding: 18px; border-radius: 12px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1e3a8a; font-size: 15px; font-weight: 800;">Вашите данни за вход в системата:</h3>
      <p style="margin: 8px 0; font-size: 14px;"><strong>Потребител (Телефон или Имейл):</strong> ${parentPhone} или ${parentEmail}</p>
      <p style="margin: 8px 0; font-size: 14px;"><strong>Временна парола:</strong> <span style="font-family: monospace; font-size: 17px; font-weight: bold; background: #ffffff; padding: 4px 10px; border-radius: 6px; border: 1px dashed #3b82f6; letter-spacing: 1px; color: #1e3a8a;">${tempPassword}</span></p>
    </div>

    <p>След като влезете в портала, можете веднага да смените временната парола с нова от настройките на профила си.</p>

    <div class="button-container" style="text-align: center; margin: 28px 0;">
      <a href="${loginUrl}" class="button" style="display: inline-block; background: #2563eb; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px;">Вход в Родителския портал</a>
    </div>

    <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
      В портала можете да следите месечните присъствия, актуалния график на тренировките, да подавате уведомления при отсъствие и да заявявате корекции на данни.
    </p>
  `);

  return sendParentPortalEmail({
    to: parentEmail,
    subject: `🔑 Данни за вход в Родителския портал за ${childName}`,
    html,
  });
}

export async function notifyAdminParentCreated({
  parentName,
  parentRole,
  parentEmail,
  parentPhone,
  childName,
  tempPassword,
}: {
  parentName: string;
  parentRole: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  tempPassword: string;
}) {
  const roleLabel =
    parentRole === "mother"
      ? "Майка"
      : parentRole === "father"
        ? "Баща"
        : "Настойник";

  const html = await wrapEmailTemplate(`
    <h2 style="color: #0f172a; margin-top: 0;">Създаден е нов родителски профил 📋</h2>
    <p>Успешно създадохте родителски профил за състезателя <strong>${childName}</strong>:</p>
    <div class="card" style="padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; margin: 18px 0;">
      <p style="margin: 6px 0;"><strong>Родител:</strong> ${parentName} (${roleLabel})</p>
      <p style="margin: 6px 0;"><strong>Телефон:</strong> ${parentPhone}</p>
      <p style="margin: 6px 0;"><strong>Имейл:</strong> ${parentEmail}</p>
      <p style="margin: 6px 0;"><strong>Дете:</strong> ${childName}</p>
      <p style="margin: 6px 0;"><strong>Временна парола:</strong> <span style="font-family: monospace; font-weight: bold; background: #fff; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">${tempPassword}</span></p>
    </div>
    <p style="font-size: 13px; color: #64748b;">На родителя беше изпратен автоматичен имейл с данните и линк за вход.</p>
  `);

  return sendParentPortalEmail({
    to: ADMIN_EMAIL,
    subject: `📋 Създаден родителски профил: ${parentName} за ${childName}`,
    html,
  });
}

export async function notifyParentRejected(
  parentEmail: string,
  parentName: string,
  childName: string,
  reason: string
) {
  const { hallName } = await getClubSiteInfo();
  const html = await wrapEmailTemplate(`
    <h2 style="color: #dc2626; margin-top: 0;">Относно вашата заявка за родителски достъп</h2>
    <p>Здравейте, <strong>${parentName}</strong>,</p>
    <p>Благодарим за интереса към Родителския портал за детето <strong>${childName}</strong>.</p>
    <p>За съжаление заявката ви не може да бъде одобрена автоматично поради следната причина:</p>
    <div class="card" style="border-left: 4px solid #dc2626;">
      <p style="margin: 0; font-style: italic;">"${reason}"</p>
    </div>
    <p>Моля, свържете се с треньора на клуба на място в ${hallName} за уточняване на данните.</p>
  `);

  return sendParentPortalEmail({
    to: parentEmail,
    subject: `Информация относно заявка за родителски достъп за ${childName}`,
    html,
  });
}

export async function notifyParentPasswordReset(
  parentEmail: string,
  parentName: string,
  resetUrl: string
) {
  const html = await wrapEmailTemplate(`
    <h2 style="color: #0f172a; margin-top: 0;">Възстановяване на парола 🔐</h2>
    <p>Здравейте, <strong>${parentName}</strong>,</p>
    <p>Получихме заявка за нулиране на паролата за вашия родителски профил.</p>
    <p>Кликнете на бутона по-долу, за да въведете нова парола. Линкът е валиден 1 час:</p>
    <div class="button-container">
      <a href="${resetUrl}" class="button">Задайте нова парола</a>
    </div>
    <p style="font-size: 13px; color: #64748b;">Ако не сте заявили промяна на паролата, можете спокойно да пренебрегнете това съобщение.</p>
  `);

  return sendParentPortalEmail({
    to: parentEmail,
    subject: `Възстановяване на парола за Родителския портал`,
    html,
  });
}

export async function notifyAdminNewAbsence(absence: ParentAbsence) {
  const dateDisplay =
    absence.type === "period" && absence.endDate
      ? `от ${absence.startDate} до ${absence.endDate}`
      : `на ${absence.startDate}`;

  const reasonLabels: Record<string, string> = {
    illness: "Болест / Неразположение 🤒",
    school: "Училищни ангажименти / Изпит 📚",
    travel: "Семейно пътуване / Лични 🚗",
    injury: "Контузия / Възстановяване 🩹",
    other: "Друго ✏️",
  };

  const html = await wrapEmailTemplate(`
    <h2 style="color: #ea580c; margin-top: 0;">Заявено отсъствие от родител 🤒</h2>
    <p>Родителят <strong>${absence.parentName}</strong> заяви отсъствие за <strong>${absence.memberName}</strong>:</p>
    <div class="card">
      <p><strong>Период:</strong> ${dateDisplay}</p>
      <p><strong>Причина:</strong> ${reasonLabels[absence.reason] || absence.reason}</p>
      ${absence.note ? `<p><strong>Бележка:</strong> "${absence.note}"</p>` : ""}
    </div>
    <p>Можете да отворите админ панела, за да отбележите отсъствието като прегледано.</p>
  `);

  return sendParentPortalEmail({
    to: ADMIN_EMAIL,
    subject: `🤒 Отсъствие за ${absence.memberName} (${dateDisplay})`,
    html,
  });
}

export async function notifyAdminNewCorrection(
  correction: DataCorrectionRequest
) {
  const html = await wrapEmailTemplate(`
    <h2 style="color: #2563eb; margin-top: 0;">Предложена корекция на данни ✏️</h2>
    <p>Родителят <strong>${correction.parentName}</strong> предложи корекция за <strong>${correction.memberName}</strong>:</p>
    <div class="card">
      <p><strong>Поле:</strong> ${correction.fieldLabel}</p>
      <p><strong>Текуща стойност:</strong> ${correction.currentValue || "—"}</p>
      <p><strong>Предложена нова стойност:</strong> <span style="color: #16a34a; font-weight: bold;">${correction.proposedValue}</span></p>
      ${correction.note ? `<p><strong>Бележка от родител:</strong> "${correction.note}"</p>` : ""}
    </div>
    <p>Можете да одобрите или откажете корекцията с 1 клик от Административния панел.</p>
  `);

  return sendParentPortalEmail({
    to: ADMIN_EMAIL,
    subject: `✏️ Корекция на данни за ${correction.memberName}: ${correction.fieldLabel}`,
    html,
  });
}

export async function notifyParentCorrectionApproved(
  parentEmail: string,
  parentName: string,
  childName: string,
  fieldLabel: string
) {
  const html = await wrapEmailTemplate(`
    <h2 style="color: #16a34a; margin-top: 0;">Корекцията е приета! ✓</h2>
    <p>Здравейте, <strong>${parentName}</strong>,</p>
    <p>Вашата предложена корекция за полето <strong>${fieldLabel}</strong> в картона на <strong>${childName}</strong> беше одобрена от треньора.</p>
    <p>Данните в клубната система бяха успешно актуализирани.</p>
  `);

  return sendParentPortalEmail({
    to: parentEmail,
    subject: `✓ Приета корекция на данни за ${childName}`,
    html,
  });
}

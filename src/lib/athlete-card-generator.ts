import QRCode from "qrcode";

import { Member } from "@/types/member.types";

export type TeamMemberForCard = Member & {
  ageGroupDisplay: string;
  tournaments: string[];
};

export type CardFormat = "story" | "square";

/**
 * Safely load an image from URL into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => resolve(null);
      fallbackImg.src = src;
    };
    img.src = src;
  });
}

function resolveAvatarUrl(rawUrl: string | undefined | null): string {
  if (!rawUrl) return "";
  let cleanSrc = rawUrl.replace(/\\/g, "/");
  if (cleanSrc.startsWith("public/")) cleanSrc = cleanSrc.substring(6);
  if (cleanSrc.startsWith("/public/")) cleanSrc = cleanSrc.substring(7);
  if (
    !cleanSrc.startsWith("http://") &&
    !cleanSrc.startsWith("https://") &&
    !cleanSrc.startsWith("/")
  ) {
    cleanSrc = `/${cleanSrc}`;
  }
  if (cleanSrc.startsWith("/") && typeof window !== "undefined") {
    return window.location.origin + cleanSrc;
  }
  return cleanSrc;
}

/**
 * Draw background styling and court accents
 */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#030712");
  bgGrad.addColorStop(0.4, "#0a1128");
  bgGrad.addColorStop(0.8, "#020617");
  bgGrad.addColorStop(1, "#000000");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const radialGlow1 = ctx.createRadialGradient(
    width * 0.2,
    height * 0.15,
    10,
    width * 0.2,
    height * 0.15,
    500
  );
  radialGlow1.addColorStop(0, "rgba(37, 99, 235, 0.25)");
  radialGlow1.addColorStop(1, "rgba(37, 99, 235, 0)");
  ctx.fillStyle = radialGlow1;
  ctx.fillRect(0, 0, width, height);

  const radialGlow2 = ctx.createRadialGradient(
    width * 0.8,
    height * 0.75,
    10,
    width * 0.8,
    height * 0.75,
    600
  );
  radialGlow2.addColorStop(0, "rgba(59, 130, 246, 0.18)");
  radialGlow2.addColorStop(1, "rgba(59, 130, 246, 0)");
  ctx.fillStyle = radialGlow2;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(59, 130, 246, 0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(50, 50, width - 100, height - 100);
  ctx.stroke();

  ctx.strokeStyle = "rgba(59, 130, 246, 0.15)";
  ctx.strokeRect(60, 60, width - 120, height - 120);
}

/**
 * Draw club header & crest
 */
function drawHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  headerY: number,
  logoImg: HTMLImageElement | null
) {
  if (logoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(width / 2 - 40, headerY, 80, 80, 20);
    ctx.clip();
    ctx.drawImage(logoImg, width / 2 - 40, headerY, 80, 80);
    ctx.restore();

    ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(width / 2 - 40, headerY, 80, 80, 20);
    ctx.stroke();
  }

  const textYOffset = logoImg ? 120 : 50;
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("СНЦ БАДМИНТОН КЛУБ ГЪЛЪБОВО", width / 2, headerY + textYOffset);

  ctx.fillStyle = "#60a5fa";
  ctx.font = "bold 15px sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText(
    "ОФИЦИАЛНА ДИГИТАЛНА КАРТА НА СЪСТЕЗАТЕЛ",
    width / 2,
    headerY + textYOffset + 30
  );
}

/**
 * Draw circular athlete photo with glowing ring
 */
function drawAvatar(
  ctx: CanvasRenderingContext2D,
  width: number,
  avatarX: number,
  avatarY: number,
  avatarSize: number,
  athleteImg: HTMLImageElement | null
) {
  const ringGrad = ctx.createLinearGradient(
    avatarX,
    avatarY,
    avatarX + avatarSize,
    avatarY + avatarSize
  );
  ringGrad.addColorStop(0, "#3b82f6");
  ringGrad.addColorStop(0.5, "#60a5fa");
  ringGrad.addColorStop(1, "#1d4ed8");

  ctx.save();
  ctx.shadowColor = "rgba(59, 130, 246, 0.4)";
  ctx.shadowBlur = 30;
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(
    width / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2 + 8,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();

  if (athleteImg) {
    const aspect = athleteImg.width / athleteImg.height;
    let sWidth = athleteImg.width;
    let sHeight = athleteImg.height;
    let sx = 0;
    let sy = 0;
    if (aspect > 1) {
      sWidth = athleteImg.height;
      sx = (athleteImg.width - sWidth) / 2;
    } else {
      sHeight = athleteImg.width;
      sy = (athleteImg.height - sHeight) / 2;
    }
    ctx.drawImage(
      athleteImg,
      sx,
      sy,
      sWidth,
      sHeight,
      avatarX,
      avatarY,
      avatarSize,
      avatarSize
    );
  } else {
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.fillStyle = "#64748b";
    ctx.font = `bold ${Math.round(avatarSize * 0.4)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🏸", width / 2, avatarY + avatarSize / 2);
  }
  ctx.restore();
}

/**
 * Draw name and level/age group pills
 */
function drawNameAndBadges(
  ctx: CanvasRenderingContext2D,
  width: number,
  member: TeamMemberForCard,
  nameY: number,
  badgesY: number,
  format: CardFormat
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${format === "story" ? 54 : 44}px sans-serif`;
  ctx.letterSpacing = "1px";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 10;
  ctx.fillText(
    member.name || `${member.firstName} ${member.lastName}`,
    width / 2,
    nameY
  );
  ctx.shadowBlur = 0;

  const isCompetitor =
    member.skillLevel === "advanced" || member.skillLevel === "professional";
  const levelText = isCompetitor ? "СЪСТЕЗАТЕЛ" : "ЛЮБИТЕЛ";
  const ageGroupText = `ВЪЗРАСТ: ${member.ageGroupDisplay || "Мъже/Жени"}`;

  ctx.font = "bold 16px sans-serif";
  const levelWidth = ctx.measureText(levelText).width + 44;
  const ageWidth = ctx.measureText(ageGroupText).width + 44;
  const gap = 16;
  const startX = (width - (levelWidth + ageWidth + gap)) / 2;

  // Level Pill
  ctx.save();
  ctx.fillStyle = isCompetitor
    ? "rgba(30, 58, 138, 0.7)"
    : "rgba(16, 185, 129, 0.2)";
  ctx.strokeStyle = isCompetitor
    ? "rgba(96, 165, 250, 0.6)"
    : "rgba(52, 211, 153, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(startX, badgesY - 26, levelWidth, 36, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isCompetitor ? "#93c5fd" : "#6ee7b7";
  ctx.textAlign = "center";
  ctx.letterSpacing = "1px";
  ctx.fillText(levelText, startX + levelWidth / 2, badgesY - 3);
  ctx.restore();

  // Age Pill
  ctx.save();
  ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(startX + levelWidth + gap, badgesY - 26, ageWidth, 36, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "center";
  ctx.letterSpacing = "1px";
  ctx.fillText(
    ageGroupText,
    startX + levelWidth + gap + ageWidth / 2,
    badgesY - 3
  );
  ctx.restore();
}

/**
 * Draw school or kindergarten institution line
 */
function drawSchool(
  ctx: CanvasRenderingContext2D,
  width: number,
  institution: string | null | undefined,
  currentY: number
) {
  if (!institution || !institution.trim()) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "italic 18px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`🎓 ${institution.trim()}`, width / 2, currentY);
  ctx.restore();
}

/**
 * Draw tournaments list box
 */
function drawTournaments(
  ctx: CanvasRenderingContext2D,
  width: number,
  tournaments: string[],
  currentY: number,
  format: CardFormat
) {
  const boxWidth = width - 180;
  const boxX = (width - boxWidth) / 2;
  const maxToShow = format === "story" ? 8 : 4;
  const visible = tournaments.slice(0, maxToShow);
  const remaining = tournaments.length - visible.length;
  const boxHeight = format === "story" ? 480 : 230;

  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
  ctx.strokeStyle = "rgba(59, 130, 246, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(boxX, currentY, boxWidth, boxHeight, 24);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#60a5fa";
  ctx.font = "bold 15px sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText(
    `🏆 УЧАСТИЯ В СЪСТЕЗАНИЯ (${tournaments.length} ОБЩО)`,
    boxX + 32,
    currentY + 40
  );

  let tY = currentY + 75;
  const itemLineHeight = format === "story" ? 44 : 36;

  if (visible.length === 0) {
    ctx.font = "italic 16px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(
      "В активна подготовка за предстоящи турнири",
      boxX + 32,
      tY + 10
    );
  } else {
    for (const tourn of visible) {
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(boxX + 36, tY - 5, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "16px sans-serif";
      ctx.letterSpacing = "0px";
      ctx.fillText(tourn, boxX + 52, tY);
      tY += itemLineHeight;
    }

    if (remaining > 0) {
      ctx.font = "italic 15px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`и още ${remaining} турнира...`, boxX + 52, tY);
    }
  }
  ctx.restore();
}

/**
 * Draw footer with QR code
 */
async function drawFooterQr(
  ctx: CanvasRenderingContext2D,
  width: number,
  footerY: number,
  format: CardFormat,
  memberId: string
) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bkgalabovo2025.vercel.app";
  const shareUrl = `${baseUrl}/club/team?athlete=${memberId}`;

  try {
    const qrSize = format === "story" ? 160 : 110;
    const qrDataUrl = await QRCode.toDataURL(shareUrl, {
      margin: 1,
      width: qrSize + 10,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    const qrImg = await loadImage(qrDataUrl);
    if (!qrImg) return;

    const qrX = width / 2 - qrSize / 2;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(qrX - 8, footerY, qrSize + 16, qrSize + 16, 16);
    ctx.fill();
    ctx.drawImage(qrImg, qrX, footerY + 8, qrSize, qrSize);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText(
      "Сканирайте за пълен профил",
      width / 2,
      footerY + qrSize + 36
    );

    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("bkgalabovo2025.vercel.app", width / 2, footerY + qrSize + 56);
  } catch (err) {
    console.warn("Failed to generate QR code on canvas:", err);
  }
}

/**
 * Generates an Ultra-HD branded Athlete Share Card (Story 1080x1920 or Square 1080x1080)
 */
export async function generateAthleteCardBlob(
  member: TeamMemberForCard,
  format: CardFormat = "story"
): Promise<Blob> {
  const width = 1080;
  const height = format === "story" ? 1920 : 1080;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context is not available");
  }

  // 1. Background
  drawBackground(ctx, width, height);

  // 2. Header
  const headerY = format === "story" ? 110 : 80;
  const logoImg = await loadImage("/icons/badge-option-3-light-squircle.png");
  drawHeader(ctx, width, headerY, logoImg);

  // 3. Avatar
  const avatarSize = format === "story" ? 340 : 250;
  const avatarY = format === "story" ? headerY + 195 : headerY + 175;
  const avatarX = (width - avatarSize) / 2;
  const avatarUrl = resolveAvatarUrl(member.avatarUrl);
  const athleteImg = avatarUrl ? await loadImage(avatarUrl) : null;
  drawAvatar(ctx, width, avatarX, avatarY, avatarSize, athleteImg);

  // 4. Name & Badges
  const nameY = avatarY + avatarSize + (format === "story" ? 65 : 45);
  const badgesY = nameY + (format === "story" ? 48 : 36);
  drawNameAndBadges(ctx, width, member, nameY, badgesY, format);

  // 5. School
  let currentY = badgesY + (format === "story" ? 44 : 34);
  if (member.educationInstitution?.trim()) {
    drawSchool(ctx, width, member.educationInstitution, currentY);
    currentY += format === "story" ? 45 : 30;
  }

  // 6. Tournaments
  drawTournaments(ctx, width, member.tournaments || [], currentY, format);

  // 7. Footer QR
  const footerY = format === "story" ? height - 260 : height - 160;
  await drawFooterQr(ctx, width, footerY, format, member.id);

  // 8. Convert to Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas blob generation failed"));
      }
    }, "image/png");
  });
}

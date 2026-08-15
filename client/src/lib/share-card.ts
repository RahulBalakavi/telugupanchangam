// Renders today's panchangam as a branded 1080×1350 PNG on a canvas and
// shares it via the native share sheet (WhatsApp etc.) when available,
// falling back to a download. Everything happens client-side so it also
// works offline in the installed PWA.

import type { PanchangData } from "@shared/schema";

const W = 1080;
const H = 1350;
const GOLD = "#e0b05f";
const GOLD_SOFT = "rgba(224, 176, 95, 0.55)";
const CREAM = "#f5efdf";
const MUTED = "rgba(245, 239, 223, 0.62)";
const TELUGU_SERIF = '"Noto Serif Telugu", "Fraunces", serif';
const DISPLAY = '"Fraunces", "Noto Serif Telugu", serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Deterministic pseudo-random star field so the card is reproducible. */
function drawStars(ctx: CanvasRenderingContext2D) {
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 90; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = rand() * 1.6 + 0.4;
    ctx.globalAlpha = rand() * 0.5 + 0.12;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Small waxing/waning moon glyph based on paksha and day-of-paksha. */
function drawMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, paksha: string, dayInPaksha: number) {
  const frac = Math.max(0.05, Math.min(1, dayInPaksha / 15));
  const lit = paksha === "Shukla" ? frac : 1 - frac;
  ctx.save();
  // dark disc
  ctx.fillStyle = "#2a3150";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // lit portion: offset bright disc clipped to the moon circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const offset = (1 - lit) * 2 * r * (paksha === "Shukla" ? 1 : -1);
  ctx.fillStyle = "#efe6c8";
  ctx.beginPath();
  ctx.arc(cx + offset, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCard(p: PanchangData, language: "telugu" | "english"): HTMLCanvasElement {
  const te = language === "telugu";
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ---- background ----
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#141a33");
  bg.addColorStop(0.55, "#10142a");
  bg.addColorStop(1, "#1a1430");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawStars(ctx);
  // soft gold glow behind the header
  const glow = ctx.createRadialGradient(W / 2, 240, 40, W / 2, 240, 520);
  glow.addColorStop(0, "rgba(224, 176, 95, 0.13)");
  glow.addColorStop(1, "rgba(224, 176, 95, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 700);

  // double frame
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 3;
  roundRect(ctx, 36, 36, W - 72, H - 72, 28);
  ctx.stroke();
  ctx.strokeStyle = "rgba(224, 176, 95, 0.25)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 52, 52, W - 104, H - 104, 20);
  ctx.stroke();

  ctx.textAlign = "center";

  // ---- header ----
  ctx.fillStyle = GOLD;
  ctx.font = `600 34px ${te ? TELUGU_SERIF : DISPLAY}`;
  (ctx as any).letterSpacing = te ? "2px" : "10px";
  ctx.fillText(te ? "తెలుగు పంచాంగం" : "TELUGU PANCHANGAM", W / 2, 138);
  (ctx as any).letterSpacing = "0px";

  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 130, 168);
  ctx.lineTo(W / 2 - 30, 168);
  ctx.moveTo(W / 2 + 30, 168);
  ctx.lineTo(W / 2 + 130, 168);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.font = `28px ${DISPLAY}`;
  ctx.fillText("✦", W / 2, 178);

  // date headline
  const dateLine = te
    ? `${p.isAdhikaMasa ? "అధిక " : ""}${p.teluguMonth} ${p.teluguDate}`
    : `${p.isAdhikaMasa ? "Adhika " : ""}${p.teluguMonthEnglish} ${p.teluguDate}`;
  ctx.fillStyle = CREAM;
  ctx.font = `600 92px ${te ? TELUGU_SERIF : DISPLAY}`;
  ctx.fillText(dateLine, W / 2, 300);

  ctx.fillStyle = GOLD;
  ctx.font = `italic 500 44px ${te ? TELUGU_SERIF : DISPLAY}`;
  ctx.fillText(
    te ? `శ్రీ ${p.samvatsaraNameTelugu} నామ సంవత్సరం` : `Sri ${p.samvatsaraName} Nama Samvatsaram`,
    W / 2, 372,
  );

  const gregorian = new Date(p.date + "T12:00:00").toLocaleDateString(te ? "te-IN" : "en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  ctx.fillStyle = MUTED;
  ctx.font = `400 36px ${te ? TELUGU_SERIF : '"Mulish", sans-serif'}`;
  ctx.fillText(gregorian, W / 2, 432);

  // special-day pill
  let tilesTop = 510;
  const special = te ? p.specialDayInfoTelugu : p.specialDayInfo;
  if (p.isSpecialDay && special) {
    ctx.font = `600 34px ${te ? TELUGU_SERIF : '"Mulish", sans-serif'}`;
    const tw = ctx.measureText(special).width;
    const pillW = tw + 96;
    const pill = ctx.createLinearGradient(W / 2 - pillW / 2, 0, W / 2 + pillW / 2, 0);
    pill.addColorStop(0, "#c98a2e");
    pill.addColorStop(1, "#e0b05f");
    ctx.fillStyle = pill;
    roundRect(ctx, W / 2 - pillW / 2, 470, pillW, 62, 31);
    ctx.fill();
    ctx.fillStyle = "#241a08";
    ctx.fillText(`✦ ${special}`, W / 2, 513);
    tilesTop = 566;
  }

  // ---- tiles (2 × 3) ----
  const pad = 84;
  const gap = 22;
  const tileW = (W - pad * 2 - gap) / 2;
  const tileH = 184;
  const dayInPaksha = ((p.tithiNumber % 15) + 1);
  const tiles: { label: string; value: string; sub: string; moon?: boolean }[] = [
    {
      label: te ? "తిథి" : "TITHI",
      value: te ? p.tithiTelugu : p.tithi,
      sub: `${te ? "వరకు" : "until"} ${p.tithiEndTime}`,
    },
    {
      label: te ? "నక్షత్రం" : "NAKSHATRA",
      value: te ? p.nakshatraTelugu : p.nakshatra,
      sub: `${te ? "వరకు" : "until"} ${p.nakshatraEndTime}`,
    },
    {
      label: te ? "యోగం" : "YOGA",
      value: te ? p.yogaTelugu : p.yoga,
      sub: te ? "శుభ యోగం" : "shubha yoga",
    },
    {
      label: te ? "కరణం" : "KARANA",
      value: te ? p.karanaTelugu : p.karana,
      sub: te ? "శుభ కరణం" : "shubha karana",
    },
    {
      label: te ? "సూర్యోదయం · అస్తమయం" : "SUNRISE · SUNSET",
      value: `${p.sunrise} · ${p.sunset}`,
      sub: p.timezone,
    },
    {
      label: te ? "పక్షం" : "PAKSHA",
      value: te ? p.pakshaTelugu : `${p.paksha} Paksha`,
      sub: te ? `${p.teluguMonth} మాసం` : `${p.teluguMonthEnglish} masa`,
      moon: true,
    },
  ];

  tiles.forEach((tile, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = pad + col * (tileW + gap);
    const y = tilesTop + row * (tileH + gap);
    ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
    roundRect(ctx, x, y, tileW, tileH, 22);
    ctx.fill();
    ctx.strokeStyle = "rgba(224, 176, 95, 0.28)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, tileW, tileH, 22);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = GOLD;
    ctx.font = `600 26px ${te ? TELUGU_SERIF : '"Mulish", sans-serif'}`;
    (ctx as any).letterSpacing = te ? "1px" : "4px";
    ctx.fillText(tile.label, x + 36, y + 58, tileW - 72);
    (ctx as any).letterSpacing = "0px";

    ctx.fillStyle = CREAM;
    ctx.font = `600 50px ${TELUGU_SERIF}`;
    ctx.fillText(tile.value, x + 36, y + 120, tileW - (tile.moon ? 210 : 72));

    ctx.fillStyle = MUTED;
    ctx.font = `400 28px ${te ? TELUGU_SERIF : '"Mulish", sans-serif'}`;
    ctx.fillText(tile.sub, x + 36, y + 160, tileW - (tile.moon ? 210 : 72));
    ctx.textAlign = "center";

    if (tile.moon) {
      drawMoon(ctx, x + tileW - 72, y + tileH / 2, 38, p.paksha, dayInPaksha);
    }
  });

  // ---- footer (kept inside the inner frame, which ends at H-52) ----
  const tilesBottom = tilesTop + 3 * tileH + 2 * gap;
  const footRule = tilesBottom + 34;
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad, footRule);
  ctx.lineTo(W - pad, footRule);
  ctx.stroke();

  ctx.fillStyle = CREAM;
  ctx.font = `600 40px ${DISPLAY}`;
  ctx.fillText("mytelugupanchangam.space", W / 2, footRule + 58);
  ctx.fillStyle = MUTED;
  ctx.font = `400 29px ${te ? TELUGU_SERIF : '"Mulish", sans-serif'}`;
  ctx.fillText(
    te ? "నిత్య పంచాంగం · పండుగలు · గ్రహణ సమాచారం · నోటిఫికేషన్లు" : "Daily panchangam · Festivals · Grahanam alerts · Notifications",
    W / 2, footRule + 104, W - pad * 2,
  );

  return canvas;
}

export interface ShareResult {
  method: "shared" | "downloaded";
}

export async function sharePanchangCard(
  p: PanchangData,
  language: "telugu" | "english",
): Promise<ShareResult> {
  // Make sure the webfonts are loaded before drawing text on canvas.
  await document.fonts.ready;
  const canvas = drawCard(p, language);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
  const file = new File([blob], `panchangam-${p.date}.png`, { type: "image/png" });

  const shareData = {
    files: [file],
    title: "Telugu Panchangam",
    text: `${language === "telugu" ? "నేటి పంచాంగం" : "Today's panchangam"} · https://mytelugupanchangam.space`,
  };
  if (typeof navigator.canShare === "function" && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return { method: "shared" };
    } catch (err) {
      // AbortError = user closed the share sheet; treat as done.
      if ((err as Error).name === "AbortError") return { method: "shared" };
      // fall through to download on any other failure
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return { method: "downloaded" };
}

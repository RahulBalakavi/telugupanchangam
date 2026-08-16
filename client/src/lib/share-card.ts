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

// ---- sankalpam card ----

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Renders the full sankalpam text (already assembled by the Sankalpam
 * component) as a card. Height adapts to the text length.
 */
function drawSankalpamCard(text: string, dateLabel: string, language: "telugu" | "english"): HTMLCanvasElement {
  const te = language === "telugu";
  const bodyFont = `400 33px ${te ? TELUGU_SERIF : DISPLAY}`;
  const lineH = te ? 58 : 48;
  const paraGap = 26;
  const pad = 96;

  // Measure first so the canvas height fits the text.
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = bodyFont;
  const paragraphs = text.split("\n\n").map((p) => wrapText(measure, p, W - pad * 2));
  const textHeight = paragraphs.reduce((h, lines) => h + lines.length * lineH + paraGap, 0);

  const headerH = 300;
  const footerH = 190;
  const height = Math.max(1350, headerH + textHeight + footerH);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // background + frame (same night/gold treatment as the panchang card)
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#141a33");
  bg.addColorStop(0.55, "#10142a");
  bg.addColorStop(1, "#1a1430");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, height);
  drawStars(ctx);
  const glow = ctx.createRadialGradient(W / 2, 200, 40, W / 2, 200, 500);
  glow.addColorStop(0, "rgba(224, 176, 95, 0.13)");
  glow.addColorStop(1, "rgba(224, 176, 95, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 640);
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 3;
  roundRect(ctx, 36, 36, W - 72, height - 72, 28);
  ctx.stroke();
  ctx.strokeStyle = "rgba(224, 176, 95, 0.25)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 52, 52, W - 104, height - 104, 20);
  ctx.stroke();

  // header
  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  ctx.font = `600 34px ${te ? TELUGU_SERIF : DISPLAY}`;
  (ctx as any).letterSpacing = te ? "2px" : "10px";
  ctx.fillText(te ? "తెలుగు పంచాంగం" : "TELUGU PANCHANGAM", W / 2, 132);
  (ctx as any).letterSpacing = "0px";
  ctx.fillStyle = CREAM;
  ctx.font = `600 64px ${te ? TELUGU_SERIF : DISPLAY}`;
  ctx.fillText(te ? "నేటి సంకల్పం" : "Today's Sankalpam", W / 2, 214);
  ctx.fillStyle = MUTED;
  ctx.font = `400 32px ${te ? TELUGU_SERIF : '"Mulish", sans-serif'}`;
  ctx.fillText(dateLabel, W / 2, 262);

  // body
  ctx.textAlign = "left";
  ctx.fillStyle = CREAM;
  ctx.font = bodyFont;
  let y = headerH + 40;
  for (const lines of paragraphs) {
    for (const line of lines) {
      ctx.fillText(line, pad, y);
      y += lineH;
    }
    y += paraGap;
  }

  // footer
  ctx.textAlign = "center";
  const footRule = height - 148;
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad, footRule);
  ctx.lineTo(W - pad, footRule);
  ctx.stroke();
  ctx.fillStyle = CREAM;
  ctx.font = `600 38px ${DISPLAY}`;
  ctx.fillText("mytelugupanchangam.space", W / 2, footRule + 56);
  ctx.fillStyle = MUTED;
  ctx.font = `400 28px ${te ? TELUGU_SERIF : '"Mulish", sans-serif'}`;
  ctx.fillText(
    te ? "నిత్య పంచాంగం · సంకల్పం · పండుగలు · గ్రహణ సమాచారం" : "Daily panchangam · Sankalpam · Festivals · Grahanam alerts",
    W / 2, footRule + 100, W - pad * 2,
  );
  return canvas;
}

// ---- eclipse card ----

export interface EclipseCardData {
  type: "solar" | "lunar";
  kindLabel: string; // localized "Partial", "Total", ...
  title: string; // localized "Partial Lunar Eclipse" / "పాక్షిక చంద్రగ్రహణం"
  dateLabel: string; // localized long date
  date: string; // YYYY-MM-DD (for the filename)
  peakLocal: string;
  obscuration: number | null;
  nakshatra: string;
  affectedNakshatras: string[];
  timezone: string;
}

function drawEclipseCard(e: EclipseCardData, language: "telugu" | "english"): HTMLCanvasElement {
  const te = language === "telugu";
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#141a33");
  bg.addColorStop(0.55, "#10142a");
  bg.addColorStop(1, "#1a1430");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawStars(ctx);
  const glow = ctx.createRadialGradient(W / 2, 470, 60, W / 2, 470, 560);
  glow.addColorStop(0, e.type === "solar" ? "rgba(232, 165, 67, 0.2)" : "rgba(200, 90, 60, 0.18)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 100, W, 800);
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 3;
  roundRect(ctx, 36, 36, W - 72, H - 72, 28);
  ctx.stroke();
  ctx.strokeStyle = "rgba(224, 176, 95, 0.25)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 52, 52, W - 104, H - 104, 20);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  ctx.font = `600 34px ${te ? TELUGU_SERIF : DISPLAY}`;
  (ctx as any).letterSpacing = te ? "2px" : "10px";
  ctx.fillText(te ? "గ్రహణ గమనిక" : "ECLIPSE WATCH", W / 2, 138);
  (ctx as any).letterSpacing = "0px";

  // eclipse disk motif
  const cy = 350;
  if (e.type === "lunar") {
    ctx.fillStyle = "#3a1710";
    ctx.beginPath();
    ctx.arc(W / 2, cy, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(230, 120, 80, 0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(W / 2, cy, 130, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#f4efdf";
    ctx.beginPath();
    ctx.arc(W / 2 - 105, cy - 40, 62, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const sun = ctx.createRadialGradient(W / 2, cy, 10, W / 2, cy, 130);
    sun.addColorStop(0, "#fff2b2");
    sun.addColorStop(1, "#c96f24");
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(W / 2, cy, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#171c2b";
    ctx.beginPath();
    ctx.arc(W / 2 + 75, cy - 35, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(140, 150, 190, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2 + 75, cy - 35, 100, 0, Math.PI * 2);
    ctx.stroke();
  }
  // dotted orbit ring
  ctx.setLineDash([4, 10]);
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(W / 2, cy, 185, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = CREAM;
  ctx.font = `600 76px ${te ? TELUGU_SERIF : DISPLAY}`;
  ctx.fillText(e.title, W / 2, 640, W - 160);
  ctx.fillStyle = GOLD;
  ctx.font = `italic 500 42px ${te ? TELUGU_SERIF : DISPLAY}`;
  ctx.fillText(e.dateLabel, W / 2, 712);

  // tiles: peak, nakshatra, obscuration
  const pad = 84;
  const gap = 22;
  const tileW = (W - pad * 2 - gap * 2) / 3;
  const tileH = 190;
  const tilesTop = 770;
  const tiles = [
    { label: te ? "మధ్యకాలం" : "PEAK", value: e.peakLocal, sub: e.timezone },
    { label: te ? "నక్షత్రం" : "NAKSHATRA", value: e.nakshatra, sub: te ? "గ్రహణ నక్షత్రం" : "eclipse star" },
    {
      label: te ? "కప్పివేత" : "COVERAGE",
      value: e.obscuration != null ? `${Math.round(e.obscuration * 100)}%` : "—",
      sub: e.kindLabel,
    },
  ];
  tiles.forEach((tile, i) => {
    const x = pad + i * (tileW + gap);
    ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
    roundRect(ctx, x, tilesTop, tileW, tileH, 22);
    ctx.fill();
    ctx.strokeStyle = "rgba(224, 176, 95, 0.28)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, tilesTop, tileW, tileH, 22);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.font = `600 25px ${te ? TELUGU_SERIF : '"Mulish", sans-serif'}`;
    (ctx as any).letterSpacing = te ? "1px" : "3px";
    ctx.fillText(tile.label, x + tileW / 2, tilesTop + 56, tileW - 40);
    (ctx as any).letterSpacing = "0px";
    ctx.fillStyle = CREAM;
    ctx.font = `600 46px ${TELUGU_SERIF}`;
    ctx.fillText(tile.value, x + tileW / 2, tilesTop + 122, tileW - 40);
    ctx.fillStyle = MUTED;
    ctx.font = `400 26px ${te ? TELUGU_SERIF : '"Mulish", sans-serif'}`;
    ctx.fillText(tile.sub, x + tileW / 2, tilesTop + 162, tileW - 40);
  });

  // affected nakshatras
  const affY = tilesTop + tileH + 74;
  ctx.fillStyle = GOLD;
  ctx.font = `600 28px ${te ? TELUGU_SERIF : '"Mulish", sans-serif'}`;
  (ctx as any).letterSpacing = te ? "1px" : "4px";
  ctx.fillText(te ? "ప్రభావిత నక్షత్రాలు" : "AFFECTED NAKSHATRAS", W / 2, affY);
  (ctx as any).letterSpacing = "0px";
  ctx.fillStyle = CREAM;
  ctx.font = `500 40px ${TELUGU_SERIF}`;
  ctx.fillText(e.affectedNakshatras.join(" · "), W / 2, affY + 58, W - pad * 2);
  ctx.fillStyle = MUTED;
  ctx.font = `400 28px ${te ? TELUGU_SERIF : '"Mulish", sans-serif'}`;
  ctx.fillText(
    te
      ? "ఈ నక్షత్రాల వారు గ్రహణ శాంతి పరిహారాలు పాటించడం సంప్రదాయం"
      : "Those born under these stars traditionally observe grahana shanti remedies",
    W / 2, affY + 108, W - pad * 2,
  );

  // footer
  const footRule = H - 148;
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad, footRule);
  ctx.lineTo(W - pad, footRule);
  ctx.stroke();
  ctx.fillStyle = CREAM;
  ctx.font = `600 38px ${DISPLAY}`;
  ctx.fillText("mytelugupanchangam.space/eclipses", W / 2, footRule + 56);
  ctx.fillStyle = MUTED;
  ctx.font = `400 28px ${te ? TELUGU_SERIF : '"Mulish", sans-serif'}`;
  ctx.fillText(
    te ? "మీ ఊరిలో కనిపిస్తుందా · సమయాలు · పరిహారాలు — యాప్‌లో చూడండి" : "City-wise visibility · timings · remedies — on the app",
    W / 2, footRule + 100, W - pad * 2,
  );
  return canvas;
}

// ---- shared plumbing ----

export interface ShareResult {
  method: "shared" | "downloaded";
}

async function shareCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  shareText: string,
): Promise<ShareResult> {
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
  const file = new File([blob], filename, { type: "image/png" });
  const shareData = { files: [file], title: "Telugu Panchangam", text: shareText };
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

export async function sharePanchangCard(
  p: PanchangData,
  language: "telugu" | "english",
): Promise<ShareResult> {
  // Make sure the webfonts are loaded before drawing text on canvas.
  await document.fonts.ready;
  return shareCanvas(
    drawCard(p, language),
    `panchangam-${p.date}.png`,
    `${language === "telugu" ? "నేటి పంచాంగం" : "Today's panchangam"} · https://mytelugupanchangam.space`,
  );
}

export async function shareEclipseCard(
  e: EclipseCardData,
  language: "telugu" | "english",
): Promise<ShareResult> {
  await document.fonts.ready;
  return shareCanvas(
    drawEclipseCard(e, language),
    `grahanam-${e.date}.png`,
    `${e.title} — ${e.dateLabel} · https://mytelugupanchangam.space/eclipses`,
  );
}

export async function shareSankalpamCard(
  text: string,
  dateLabel: string,
  date: string,
  language: "telugu" | "english",
): Promise<ShareResult> {
  await document.fonts.ready;
  return shareCanvas(
    drawSankalpamCard(text, dateLabel, language),
    `sankalpam-${date}.png`,
    `${language === "telugu" ? "నేటి సంకల్పం" : "Today's sankalpam"} · https://mytelugupanchangam.space`,
  );
}

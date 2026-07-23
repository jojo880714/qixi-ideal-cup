import type { Persona, PersonaSeal } from "@/data/personas";

export const POSTER_WIDTH = 1080;
export const POSTER_HEIGHT = 1440;

export interface PosterData {
  persona: Persona;
  nickname: string;
  mode: 64 | 128;
  championTitle: string;
  finalFourTitles: string[];
  dateFaction: string;
  friendFaction: string;
  /** Preloaded Joysee logo for the footer band; falls back to text if absent/unloaded. */
  logo?: HTMLImageElement | null;
}

/* ---------------- canvas helpers ---------------- */

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

interface SealOpts {
  rotateDeg?: number;
  alpha?: number;
  withFrame?: boolean;
}

/**
 * Draws a persona seal (viewBox 0..64 path space) into a `size`×`size` box at
 * (x, y), optionally rotated about its own centre and with the rounded-rect
 * stamp frame. Uses Path2D — browser-canvas only (this module runs client-side).
 */
function drawSeal(
  ctx: CanvasRenderingContext2D,
  seal: PersonaSeal,
  color: string,
  x: number,
  y: number,
  size: number,
  opts: SealOpts = {},
) {
  const scale = size / 64;
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  const cx = x + size / 2;
  const cy = y + size / 2;
  if (opts.rotateDeg) {
    ctx.translate(cx, cy);
    ctx.rotate((opts.rotateDeg * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (opts.withFrame) {
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, 3, 3, 58, 58, 14);
    ctx.stroke();
  }
  ctx.lineWidth = 3.5;
  ctx.stroke(new Path2D(seal.d1));
  if (seal.d2) ctx.stroke(new Path2D(seal.d2));
  ctx.restore();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth) {
      lines.push(line);
      line = ch;
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const WHITE_BOX = "rgba(255,255,255,0.55)";
const WHITE_PILL = "rgba(255,255,255,0.7)";

/**
 * Draws the shareable poster (1080×1440) per Design Spec §04:
 *  giant seal watermark · stamp · white info boxes · framed champion box ·
 *  ink-coloured Joysee brand footer band. One master, recoloured per persona.
 */
export function drawPosterToCanvas(canvas: HTMLCanvasElement, data: PosterData): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { persona, nickname, mode, championTitle, finalFourTitles, logo } = data;
  const { bg, ink, frame, seal } = persona;
  const W = POSTER_WIDTH;
  const H = POSTER_HEIGHT;
  const M = 72;
  const contentW = W - 2 * M;

  // base
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // giant seal watermark, top-right bleed
  drawSeal(ctx, seal, ink, W - 110 - 560, -60, 560, { alpha: 0.13, rotateDeg: -10 });

  ctx.fillStyle = ink;
  ctx.textAlign = "left";

  // header
  ctx.font = '700 34px "Noto Sans TC",sans-serif';
  ctx.fillText("你是", M, 116);
  const nameSize = Array.from(persona.name).length <= 6 ? 84 : 72;
  ctx.font = `900 ${nameSize}px "Noto Serif TC","Noto Sans TC",serif`;
  const nameBaseline = 116 + nameSize + 14;
  ctx.fillText(persona.name, M, nameBaseline);
  ctx.font = '400 28px "Noto Sans TC",sans-serif';
  ctx.globalAlpha = 0.75;
  const subBaseline = nameBaseline + 46;
  ctx.fillText(`@${nickname}｜${persona.faction}｜七夕理想型世界盃 ${mode} 強`, M, subBaseline);
  ctx.globalAlpha = 1;

  // stamp seal, top-right
  drawSeal(ctx, seal, ink, W - M - 150, 84, 150, { rotateDeg: -8, withFrame: true });

  let y = subBaseline + 44; // top of first info box

  // ---- 口頭禪 pills box ----
  {
    const padX = 36;
    const padY = 30;
    const pillH = 52;
    const pillGap = 14;
    ctx.font = '500 28px "Noto Sans TC",sans-serif';
    // lay out pills into rows
    const rows: { text: string; w: number }[][] = [[]];
    let rowW = 0;
    const maxRowW = contentW - 2 * padX;
    for (const tag of persona.tags) {
      const w = ctx.measureText(tag).width + 52; // 26px h-pad each side
      const row = rows[rows.length - 1]!;
      if (row.length > 0 && rowW + pillGap + w > maxRowW) {
        rows.push([]);
        rowW = 0;
      }
      rows[rows.length - 1]!.push({ text: tag, w });
      rowW += (row.length > 0 ? pillGap : 0) + w;
    }
    const boxH = padY * 2 + rows.length * pillH + (rows.length - 1) * pillGap;
    ctx.fillStyle = WHITE_BOX;
    roundRectPath(ctx, M, y, contentW, boxH, 28);
    ctx.fill();
    // pills
    let py = y + padY;
    for (const row of rows) {
      let px = M + padX;
      for (const pill of row) {
        ctx.fillStyle = WHITE_PILL;
        roundRectPath(ctx, px, py, pill.w, pillH, pillH / 2);
        ctx.fill();
        ctx.fillStyle = ink;
        ctx.textBaseline = "middle";
        ctx.fillText(pill.text, px + 26, py + pillH / 2 + 1);
        ctx.textBaseline = "alphabetic";
        px += pill.w + pillGap;
      }
      py += pillH + pillGap;
    }
    y += boxH + 26;
  }

  // ---- desc box ----
  {
    const padX = 38;
    const padY = 34;
    const lineH = 59;
    ctx.font = '400 31px "Noto Sans TC",sans-serif';
    const lines = wrapLines(ctx, persona.desc, contentW - 2 * padX);
    const boxH = padY * 2 + lines.length * lineH - (lineH - 40);
    ctx.fillStyle = WHITE_BOX;
    roundRectPath(ctx, M, y, contentW, boxH, 28);
    ctx.fill();
    ctx.fillStyle = ink;
    lines.forEach((l, i) => ctx.fillText(l, M + padX, y + padY + 40 + i * lineH));
    y += boxH + 26;
  }

  // ---- champion box (only framed box) ----
  {
    const padX = 38;
    const boxTop = y;
    // fill remaining space above the "報到" line + footer band
    const footerBandTop = H - 150;
    const shoutY = footerBandTop - 60;
    const boxH = shoutY - 40 - boxTop;
    ctx.fillStyle = WHITE_BOX;
    roundRectPath(ctx, M, boxTop, contentW, boxH, 28);
    ctx.fill();
    ctx.strokeStyle = frame;
    ctx.lineWidth = 4;
    roundRectPath(ctx, M + 2, boxTop + 2, contentW - 4, boxH - 4, 26);
    ctx.stroke();

    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.7;
    ctx.font = '500 26px "Noto Sans TC",sans-serif';
    ctx.fillText("天字第一號條件", M + padX, boxTop + 60);
    ctx.globalAlpha = 1;
    ctx.font = '900 56px "Noto Serif TC","Noto Sans TC",serif';
    ctx.fillText(`「${championTitle}」`, M + padX, boxTop + 132);
    ctx.font = '400 26px "Noto Sans TC",sans-serif';
    ctx.globalAlpha = 0.85;
    const fourLine = `四強：${finalFourTitles.join("｜")}`;
    const fourTrimmed = Array.from(fourLine).length > 30 ? Array.from(fourLine).slice(0, 30).join("") + "…" : fourLine;
    ctx.fillText(fourTrimmed, M + padX, boxTop + 184);
    ctx.globalAlpha = 1;

    // shout line
    ctx.font = '700 34px "Noto Sans TC",sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("符合的請在留言區報到 🙋", W / 2, shoutY);
    ctx.textAlign = "left";
  }

  // ---- footer brand band (ink bg) ----
  {
    const bandTop = H - 150;
    ctx.fillStyle = ink;
    ctx.fillRect(0, bandTop, W, 150);
    const midY = bandTop + 75;

    // left: real Joysee logo (if preloaded) + call-to-action line.
    ctx.textBaseline = "middle";
    if (logo && logo.complete && logo.naturalWidth > 0) {
      const lh = 60;
      const lw = (logo.naturalWidth / logo.naturalHeight) * lh;
      ctx.drawImage(logo, M, midY - lh / 2 - 12, lw, lh);
    } else {
      ctx.fillStyle = bg;
      ctx.font = '800 34px "Noto Serif TC",sans-serif';
      ctx.fillText("揪西歡玩 Joysee", M, midY - 16);
    }
    ctx.fillStyle = bg;
    ctx.globalAlpha = 0.9;
    ctx.font = '400 24px "Noto Sans TC",sans-serif';
    ctx.fillText("掃碼報名七夕單身限定活動", M, midY + 26);
    ctx.globalAlpha = 1;

    // right: title + QR placeholder
    const qrSize = 96;
    const qrX = W - M - qrSize;
    const qrY = midY - qrSize / 2;
    ctx.fillStyle = bg;
    roundRectPath(ctx, qrX, qrY, qrSize, qrSize, 14);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = '600 20px "Noto Sans TC",sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("QR", qrX + qrSize / 2, midY);
    ctx.textAlign = "left";

    ctx.fillStyle = bg;
    ctx.font = '800 30px "Noto Serif TC",sans-serif';
    ctx.textAlign = "right";
    ctx.fillText("七夕理想型世界盃", qrX - 18, midY);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): void {
  const a = document.createElement("a");
  a.download = filename;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

export interface ShareTextData {
  persona: Persona;
  nickname: string;
  mode: 64 | 128;
  championTitle: string;
  finalFourTitles: string[];
  dateFaction: string;
  friendFaction: string;
  /** 完賽結果的分享短網址（絕對）。若尚未取得則省略。 */
  resultUrl?: string | null;
}

export function buildShareText(data: ShareTextData): string {
  const { persona, mode, championTitle, finalFourTitles, dateFaction, resultUrl } = data;
  const lines = [
    `這個七夕我單身，但我測出來了——我是「${persona.name}」（${persona.faction}）。`,
    `${mode} 個條件淘汰到最後，天字第一號：「${championTitle}」`,
    `四強：${finalFourTitles.join("、")}`,
    `適合跟我交往的是${dateFaction}，符合的請在留言區報到 🙋`,
    `你的單身人格又是哪型？來測測看！`,
  ];
  if (resultUrl) lines.push(resultUrl);
  return lines.join("\n");
}

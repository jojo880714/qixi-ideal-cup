import type { Persona, PersonaSeal } from "@/data/personas";

// IG Story ratio (9:16) so the download drops straight into 限時動態.
export const POSTER_WIDTH = 1080;
export const POSTER_HEIGHT = 1920;

export interface PosterData {
  persona: Persona;
  nickname: string;
  mode: 64 | 128;
  championTitle: string;
  finalFourTitles: string[];
  dateFaction: string;
  friendFaction: string;
  /** Preloaded Joysee logo, drawn (yellow) on the night background below the card. */
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

interface PillRow {
  pills: { text: string; w: number }[];
}

function layoutPills(ctx: CanvasRenderingContext2D, tags: string[], maxRowW: number, pillGap: number): PillRow[] {
  const rows: PillRow[] = [{ pills: [] }];
  let rowW = 0;
  for (const tag of tags) {
    const w = ctx.measureText(tag).width + 48;
    const row = rows[rows.length - 1]!;
    if (row.pills.length > 0 && rowW + pillGap + w > maxRowW) {
      rows.push({ pills: [] });
      rowW = 0;
    }
    const cur = rows[rows.length - 1]!;
    rowW += (cur.pills.length > 0 ? pillGap : 0) + w;
    cur.pills.push({ text: tag, w });
  }
  return rows;
}

/**
 * Draws the shareable poster at IG-Story size (1080×1920): a faithful render
 * of the on-screen result card (persona-tinted card with corner seal, tag
 * pills, description, framed 天字第一號 box, 適合交往／交友, and the 留言區報到
 * line) floating on the app's night background, with the Joysee logo centred
 * below it. Recoloured per persona. No QR / brand band.
 */
export function drawPosterToCanvas(canvas: HTMLCanvasElement, data: PosterData): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { persona, nickname, mode, championTitle, finalFourTitles, dateFaction, friendFaction, logo } = data;
  const { bg, ink, frame, seal } = persona;
  const W = POSTER_WIDTH;
  const H = POSTER_HEIGHT;

  // ---- night background (matches the app) ----
  ctx.clearRect(0, 0, W, H);
  const grad = ctx.createRadialGradient(W / 2, -160, 0, W / 2, -160, 1400);
  grad.addColorStop(0, "#2A1650");
  grad.addColorStop(0.6, "#170D2E");
  grad.addColorStop(1, "#170D2E");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ---- card geometry ----
  const cardX = 46;
  const cardW = W - 2 * cardX; // 988
  const cPad = 46; // card inner padding
  const innerX = cardX + cPad;
  const innerW = cardW - 2 * cPad; // 896
  const boxPad = 32;
  const gap = 22;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // ===== measuring pass (compute card height) =====
  const nameSize = Array.from(persona.name).length <= 6 ? 76 : 64;
  const headerH = 40 + nameSize + 12 + 34; // 你是 + name + meta

  ctx.font = '500 28px "Noto Sans TC",sans-serif';
  const tagRows = layoutPills(ctx, persona.tags, innerW - 2 * boxPad, 14);
  const pillH = 52;
  const tagsH = boxPad * 2 + tagRows.length * pillH + (tagRows.length - 1) * 14;

  ctx.font = '400 31px "Noto Sans TC",sans-serif';
  const descLines = wrapLines(ctx, persona.desc, innerW - 2 * boxPad);
  const descLineH = 52;
  const descH = boxPad * 2 + descLines.length * descLineH;

  ctx.font = '400 26px "Noto Sans TC",sans-serif';
  const fourLines = wrapLines(ctx, `四強：${finalFourTitles.join("｜")}`, innerW - 2 * boxPad);
  const fourLineH = 40;
  const champH = boxPad + 36 + 20 + 62 + 16 + fourLines.length * fourLineH + boxPad - 6;

  const matchH = 128;
  const shoutH = 46;

  const cardContentH =
    headerH + gap + tagsH + gap + descH + gap + champH + gap + matchH + gap + shoutH;
  const cardH = cPad + cardContentH + cPad - 8;

  const logoH = 84;
  const logoGap = 56;
  const blockH = cardH + logoGap + logoH;
  const topY = Math.max(120, Math.round((H - blockH) / 2));

  // ===== draw pass =====
  // card
  ctx.fillStyle = bg;
  roundRectPath(ctx, cardX, topY, cardW, cardH, 40);
  ctx.fill();

  // faint seal watermark, clipped inside the card
  ctx.save();
  roundRectPath(ctx, cardX, topY, cardW, cardH, 40);
  ctx.clip();
  drawSeal(ctx, seal, ink, cardX + cardW - 360, topY + cardH - 300, 460, { alpha: 0.06, rotateDeg: -10 });
  ctx.restore();

  // corner stamp seal
  drawSeal(ctx, seal, ink, cardX + cardW - cPad - 116, topY + cPad - 6, 116, { rotateDeg: -8, withFrame: true });

  ctx.fillStyle = ink;
  let y = topY + cPad;

  // header
  ctx.font = '700 30px "Noto Sans TC",sans-serif';
  ctx.globalAlpha = 0.85;
  ctx.fillText("你是", innerX, y + 30);
  ctx.globalAlpha = 1;
  ctx.font = `900 ${nameSize}px "Noto Serif TC","Noto Sans TC",serif`;
  y += 40 + nameSize;
  ctx.fillText(persona.name, innerX, y);
  ctx.font = '400 26px "Noto Sans TC",sans-serif';
  ctx.globalAlpha = 0.72;
  y += 40;
  ctx.fillText(`@${nickname}｜${persona.faction}｜七夕理想型世界盃 ${mode} 強`, innerX, y);
  ctx.globalAlpha = 1;

  // 口頭禪 pills box
  y += gap - 4;
  ctx.fillStyle = WHITE_BOX;
  roundRectPath(ctx, innerX, y, innerW, tagsH, 24);
  ctx.fill();
  {
    let py = y + boxPad;
    ctx.font = '500 28px "Noto Sans TC",sans-serif';
    for (const row of tagRows) {
      let px = innerX + boxPad;
      for (const pill of row.pills) {
        ctx.fillStyle = WHITE_PILL;
        roundRectPath(ctx, px, py, pill.w, pillH, pillH / 2);
        ctx.fill();
        ctx.fillStyle = ink;
        ctx.textBaseline = "middle";
        ctx.fillText(pill.text, px + 24, py + pillH / 2 + 1);
        ctx.textBaseline = "alphabetic";
        px += pill.w + 14;
      }
      py += pillH + 14;
    }
  }
  y += tagsH + gap;

  // desc box
  ctx.fillStyle = WHITE_BOX;
  roundRectPath(ctx, innerX, y, innerW, descH, 24);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.font = '400 31px "Noto Sans TC",sans-serif';
  descLines.forEach((l, i) => ctx.fillText(l, innerX + boxPad, y + boxPad + 34 + i * descLineH));
  y += descH + gap;

  // champion framed box
  {
    const top = y;
    ctx.fillStyle = WHITE_BOX;
    roundRectPath(ctx, innerX, top, innerW, champH, 24);
    ctx.fill();
    ctx.strokeStyle = frame;
    ctx.lineWidth = 4;
    roundRectPath(ctx, innerX + 2, top + 2, innerW - 4, champH - 4, 22);
    ctx.stroke();

    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.7;
    ctx.font = '500 26px "Noto Sans TC",sans-serif';
    ctx.fillText("天字第一號條件", innerX + boxPad, top + boxPad + 26);
    ctx.globalAlpha = 1;
    // champion title — shrink font if it would overflow
    let champFont = 50;
    const champText = `「${championTitle}」`;
    ctx.font = `800 ${champFont}px "Noto Serif TC","Noto Sans TC",serif`;
    while (ctx.measureText(champText).width > innerW - 2 * boxPad && champFont > 34) {
      champFont -= 2;
      ctx.font = `800 ${champFont}px "Noto Serif TC","Noto Sans TC",serif`;
    }
    ctx.fillText(champText, innerX + boxPad, top + boxPad + 26 + 20 + champFont);
    ctx.font = '400 26px "Noto Sans TC",sans-serif';
    ctx.globalAlpha = 0.85;
    const fourTop = top + boxPad + 26 + 20 + 62 + 16;
    fourLines.forEach((l, i) => ctx.fillText(l, innerX + boxPad, fourTop + i * fourLineH));
    ctx.globalAlpha = 1;
    y += champH + gap;
  }

  // 適合交往 / 適合交友
  {
    const half = (innerW - 20) / 2;
    const drawMatch = (bx: number, label: string, value: string) => {
      ctx.fillStyle = WHITE_BOX;
      roundRectPath(ctx, bx, y, half, matchH, 24);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.textAlign = "center";
      ctx.globalAlpha = 0.7;
      ctx.font = '500 25px "Noto Sans TC",sans-serif';
      ctx.fillText(label, bx + half / 2, y + 48);
      ctx.globalAlpha = 1;
      ctx.font = '800 36px "Noto Serif TC","Noto Sans TC",serif';
      ctx.fillText(value, bx + half / 2, y + 96);
      ctx.textAlign = "left";
    };
    drawMatch(innerX, "適合交往", dateFaction);
    drawMatch(innerX + half + 20, "適合交友", friendFaction);
    y += matchH + gap;
  }

  // 符合的請在留言區報到 🙋 你的又是哪型？
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.font = '700 32px "Noto Sans TC",sans-serif';
  ctx.fillText("符合的請在留言區報到 🙋 你的又是哪型？", W / 2, y + 34);
  ctx.textAlign = "left";

  // ---- Joysee logo on the night bg, below the card ----
  const logoY = topY + cardH + logoGap;
  if (logo && logo.complete && logo.naturalWidth > 0) {
    const lw = (logo.naturalWidth / logo.naturalHeight) * logoH;
    ctx.drawImage(logo, (W - lw) / 2, logoY, lw, logoH);
  } else {
    ctx.fillStyle = "#E8C468";
    ctx.textAlign = "center";
    ctx.font = '800 40px "Noto Serif TC",sans-serif';
    ctx.fillText("揪西歡玩 Joysee", W / 2, logoY + 50);
    ctx.textAlign = "left";
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

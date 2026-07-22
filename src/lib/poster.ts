import type { Persona } from "@/data/personas";

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
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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

/** Draws the shareable poster onto `canvas`, ported from the prototype's drawPoster(). */
export function drawPosterToCanvas(canvas: HTMLCanvasElement, data: PosterData): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { persona, nickname, mode, championTitle, finalFourTitles, dateFaction, friendFaction } = data;
  const W = canvas.width;
  const H = canvas.height;
  const M = 70;

  ctx.fillStyle = persona.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = persona.ink;
  ctx.textAlign = "left";

  ctx.font = '700 34px "Noto Sans TC",sans-serif';
  ctx.fillText("你是", M, 140);
  ctx.font = '900 78px "Noto Serif TC","Noto Sans TC",serif';
  ctx.fillText(persona.name, M, 235);
  ctx.font = '400 28px "Noto Sans TC",sans-serif';
  ctx.globalAlpha = 0.75;
  ctx.fillText(`@${nickname}｜${persona.faction}｜七夕理想型世界盃 ${mode} 強`, M, 290);
  ctx.globalAlpha = 1;

  let y = 340;
  ctx.fillStyle = "rgba(255,255,255,.55)";
  roundedRect(ctx, M, y, W - 2 * M, 150, 24);
  ctx.fill();
  ctx.fillStyle = persona.ink;
  ctx.globalAlpha = 0.7;
  ctx.font = '500 26px "Noto Sans TC",sans-serif';
  ctx.fillText("口頭禪", M + 34, y + 52);
  ctx.globalAlpha = 1;
  ctx.font = '500 30px "Noto Sans TC",sans-serif';
  ctx.fillText(persona.tags.slice(0, 2).join("  "), M + 34, y + 100);
  ctx.fillText(persona.tags.slice(2).join("  "), M + 34, y + 140);

  y += 180;
  ctx.font = '400 32px "Noto Sans TC",sans-serif';
  const descLines = wrapLines(ctx, persona.desc, W - 2 * M - 70);
  const descHeight = descLines.length * 52 + 60;
  ctx.fillStyle = "rgba(255,255,255,.55)";
  roundedRect(ctx, M, y, W - 2 * M, descHeight, 24);
  ctx.fill();
  ctx.fillStyle = persona.ink;
  descLines.forEach((line, i) => ctx.fillText(line, M + 34, y + 62 + i * 52));

  y += descHeight + 30;
  ctx.fillStyle = "rgba(255,255,255,.55)";
  roundedRect(ctx, M, y, W - 2 * M, 210, 24);
  ctx.fill();
  ctx.fillStyle = persona.ink;
  ctx.globalAlpha = 0.7;
  ctx.font = '500 26px "Noto Sans TC",sans-serif';
  ctx.fillText("天字第一號條件", M + 34, y + 52);
  ctx.globalAlpha = 1;
  ctx.font = '800 46px "Noto Serif TC","Noto Sans TC",serif';
  ctx.fillText(`「${championTitle}」`, M + 34, y + 115);
  ctx.font = '400 26px "Noto Sans TC",sans-serif';
  ctx.globalAlpha = 0.85;
  ctx.fillText(`四強：${finalFourTitles.join("｜")}`.slice(0, 32), M + 34, y + 170);
  ctx.globalAlpha = 1;

  y += 240;
  const half = (W - 2 * M - 24) / 2;
  ctx.fillStyle = "rgba(255,255,255,.55)";
  roundedRect(ctx, M, y, half, 130, 24);
  ctx.fill();
  roundedRect(ctx, M + half + 24, y, half, 130, 24);
  ctx.fill();
  ctx.fillStyle = persona.ink;
  ctx.textAlign = "center";
  ctx.globalAlpha = 0.7;
  ctx.font = '500 26px "Noto Sans TC",sans-serif';
  ctx.fillText("適合交往", M + half / 2, y + 50);
  ctx.fillText("適合交友", M + half + 24 + half / 2, y + 50);
  ctx.globalAlpha = 1;
  ctx.font = '800 36px "Noto Serif TC",serif';
  ctx.fillText(dateFaction, M + half / 2, y + 100);
  ctx.fillText(friendFaction, M + half + 24 + half / 2, y + 100);

  ctx.font = '700 32px "Noto Sans TC",sans-serif';
  ctx.fillText("符合的請在留言區報到 🙋", W / 2, H - 110);
  ctx.globalAlpha = 0.7;
  ctx.font = '500 26px "Noto Sans TC",sans-serif';
  ctx.fillText("— 七夕限定 · 理想型世界盃｜你的又是哪型？—", W / 2, H - 60);
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): void {
  const a = document.createElement("a");
  a.download = filename;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

export function buildShareText(data: PosterData): string {
  const { persona, mode, championTitle, finalFourTitles, dateFaction } = data;
  return (
    `這個七夕我單身，但我測出來了——我是「${persona.name}」（${persona.faction}）。\n` +
    `${mode} 個條件淘汰到最後，天字第一號：「${championTitle}」\n` +
    `四強：${finalFourTitles.join("、")}\n` +
    `適合跟我交往的是${dateFaction}，符合的請在留言區報到 🙋\n` +
    `你的單身人格又是哪型？來測測看！`
  );
}

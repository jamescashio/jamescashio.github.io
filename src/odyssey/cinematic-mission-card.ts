import { missionRecord } from "./mission-card";
import type { WorldInput } from "./sovereign-model";

export type MissionFormat = "portrait" | "landscape";
export const MISSION_SIZES = { portrait: [1080, 1440], landscape: [1600, 1000] } as const;

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, leading: number) {
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) {
      ctx.fillText(line, x, y);
      y += leading;
      line = word;
    } else line = next;
  }
  ctx.fillText(line, x, y);
  return y + leading;
}

/** Two compositions of one frozen scene and one scenario. No network or synthetic telemetry. */
export async function createCinematicMissionCard(
  still: HTMLCanvasElement,
  input: WorldInput,
  format: MissionFormat,
  baseUrl: string,
) {
  const record = missionRecord(input, baseUrl);
  const [width, height] = MISSION_SIZES[format];
  const portrait = format === "portrait";
  const card = document.createElement("canvas");
  card.width = width;
  card.height = height;
  const ctx = card.getContext("2d");
  if (!ctx) throw new Error("Image export is unavailable.");
  ctx.fillStyle = "#050608";
  ctx.fillRect(0, 0, width, height);
  const halo = ctx.createRadialGradient(width * 0.55, height * 0.46, 20, width * 0.55, height * 0.46, width * 0.7);
  halo.addColorStop(0, "#16252b");
  halo.addColorStop(0.6, "#0a1015");
  halo.addColorStop(1, "#050608");
  ctx.fillStyle = halo;
  ctx.fillRect(24, 24, width - 48, height - 48);
  ctx.strokeStyle = "#c4a36b66";
  ctx.lineWidth = 1;
  ctx.strokeRect(24.5, 24.5, width - 49, height - 49);
  // Fine orbital lines hold the same instrument language as the site.
  ctx.strokeStyle = "#72b5c21f";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.48, width * (0.28 + i * 0.1), height * 0.24, -0.25, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#e9b65c";
  ctx.font = "600 38px Orbitron, sans-serif";
  ctx.fillText("cAshIo", 64, 100);
  ctx.fillStyle = "#c4d2d6";
  ctx.font = '18px "JetBrains Mono", monospace';
  ctx.textAlign = "right";
  ctx.fillText("FIRST FLIGHT / YOUR RECORD", width - 64, 95);
  ctx.textAlign = "left";
  ctx.strokeStyle = "#d6b17666";
  ctx.beginPath();
  ctx.moveTo(64, 128);
  ctx.lineTo(width - 64, 128);
  ctx.stroke();

  const titleX = portrait ? 64 : 930;
  const titleY = portrait ? 210 : 230;
  const titleWidth = portrait ? 950 : 590;
  ctx.fillStyle = "#f1f4ef";
  ctx.font = `600 ${portrait ? 57 : 51}px Orbitron, sans-serif`;
  const titleBottom = wrap(ctx, record.title, titleX, titleY, titleWidth, portrait ? 76 : 68);
  ctx.fillStyle = "#e9b65c";
  ctx.font = '18px "JetBrains Mono", monospace';
  ctx.fillText("A HUMAN IN COMMAND.", titleX, titleBottom + 14);

  const area = portrait ? { x: 38, y: 410, w: 1004, h: 580 } : { x: 36, y: 160, w: 850, h: 570 };
  const scale = Math.min(area.w / still.width, area.h / still.height);
  ctx.globalCompositeOperation = "lighten";
  ctx.drawImage(
    still,
    area.x + (area.w - still.width * scale) / 2,
    area.y + (area.h - still.height * scale) / 2,
    still.width * scale,
    still.height * scale,
  );
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "#e9b65c99";
  ctx.lineWidth = 2;
  for (const [x, y, dx, dy] of [
    [area.x + 22, area.y + 20, 1, 1],
    [area.x + area.w - 22, area.y + 20, -1, 1],
    [area.x + 22, area.y + area.h - 20, 1, -1],
    [area.x + area.w - 22, area.y + area.h - 20, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * 28, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * 28);
    ctx.stroke();
  }
  ctx.fillStyle = "#bccbd1";
  ctx.font = '23px "Exo 2", sans-serif';
  if (!portrait) wrap(ctx, record.outcome.summary, titleX, titleBottom + 76, titleWidth, 34);
  const settingsY = portrait ? 1010 : 580;
  ctx.font = '17px "JetBrains Mono", monospace';
  [record.architecture + " / " + record.connection, record.sensitivity, record.permission].forEach((label, i) => {
    ctx.fillStyle = i === 0 ? "#81e3ed" : "#c9d0d1";
    ctx.fillText(label, portrait ? 64 : titleX, settingsY + i * 30);
  });
  const metricsY = portrait ? 1145 : 770;
  const column = (width - 128) / 3;
  [
    [record.outcome.local, "ONBOARD", "#81e3ed"],
    [record.outcome.cloud, "CLOUD", "#e9b65c"],
    [record.outcome.held, "HELD", "#ffb39e"],
  ].forEach(([value, label, color], i) => {
    const x = 64 + i * column;
    ctx.fillStyle = String(color);
    ctx.fillRect(x, metricsY, column - 26, 2);
    ctx.font = "600 66px Orbitron, sans-serif";
    ctx.fillText(String(value).padStart(2, "0"), x, metricsY + 83);
    ctx.font = '17px "JetBrains Mono", monospace';
    ctx.fillText(String(label), x + (portrait ? 0 : 150), metricsY + (portrait ? 116 : 70));
  });
  ctx.fillStyle = "#d3dadd";
  ctx.font = '16px "JetBrains Mono", monospace';
  // Long development origins must remain inside the exported record as well.
  wrap(ctx, record.url, 64, height - 102, width - 128, 24);
  ctx.fillStyle = "#aebfc6";
  ctx.font = '20px "Exo 2", sans-serif';
  ctx.fillText("Browser illustration · 12 synthetic requests · No AI requests sent", 64, height - 52);
  const blob = await new Promise<Blob>((resolve, reject) => {
    card.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("The card could not be prepared."))),
      "image/png",
    );
  });
  return { blob, record, filename: record.filename.replace(/\.png$/, `-${format}.png`) };
}

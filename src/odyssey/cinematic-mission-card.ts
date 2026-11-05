import { missionRecord, normalizeCallsign } from "./mission-card";
import type { WorldInput } from "./sovereign-model";

export type MissionFormat = "portrait" | "landscape";
export type MissionComposition = "cinematic" | "field-report";
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

/** Every layout uses the same captured scene and actual scenario. No network or synthetic telemetry. */
export async function createCinematicMissionCard(
  still: HTMLCanvasElement,
  input: WorldInput,
  format: MissionFormat,
  baseUrl: string,
  callsign = "",
  composition: MissionComposition = "cinematic",
) {
  const record = missionRecord(input, baseUrl);
  const label = normalizeCallsign(callsign);
  const [width, height] = MISSION_SIZES[format];
  const portrait = format === "portrait";
  const report = composition === "field-report";
  // Archived editions keep their original palette even though they share this exporter.
  const path = new URL(baseUrl, "https://cashio.us/").pathname;
  const platinum = path === "/" || path === "/index.html" || /^\/v40(?:\/|$)/.test(path);
  const ink = platinum
    ? {
        background: "#0D1017",
        halo: "#202633",
        middle: "#111217",
        frame: "#E2E6EE66",
        orbit: "#3578FF26",
        brand: "#E2E6EE",
        meta: "#B6BFCE",
        rule: "#E2E6EE55",
        identity: "#E2E6EE",
        title: "#F5F5F7",
        accent: "#E2E6EE",
        well: "#111217",
        imageEdge: "#3578FF99",
        reticle: "#E2E6EEB3",
        body: "#CDD3DE",
        text: "#E2E6EE",
        onboard: "#E2E6EE",
        cloud: "#3578FF",
        held: "#FF3D55",
        note: "#B6BFCE",
      }
    : {
        background: "#050608",
        halo: "#16252b",
        middle: "#0a1015",
        frame: "#c4a36b66",
        orbit: "#72b5c21f",
        brand: "#ddbd87",
        meta: "#c4d2d6",
        rule: "#d6b17666",
        identity: "#91d8df",
        title: "#f1f4ef",
        accent: "#e9b65c",
        well: "#081219",
        imageEdge: "#81e3ed77",
        reticle: "#e9b65c99",
        body: "#bccbd1",
        text: "#c9d0d1",
        onboard: "#81e3ed",
        cloud: "#e9b65c",
        held: "#ffb39e",
        note: "#aebfc6",
      };
  const card = document.createElement("canvas");
  card.width = width;
  card.height = height;
  const ctx = card.getContext("2d");
  if (!ctx) throw new Error("Image export is unavailable.");
  ctx.fillStyle = ink.background;
  ctx.fillRect(0, 0, width, height);
  const halo = ctx.createRadialGradient(width * 0.55, height * 0.46, 20, width * 0.55, height * 0.46, width * 0.7);
  halo.addColorStop(0, ink.halo);
  halo.addColorStop(0.6, ink.middle);
  halo.addColorStop(1, ink.background);
  ctx.fillStyle = halo;
  ctx.fillRect(24, 24, width - 48, height - 48);
  ctx.strokeStyle = ink.frame;
  ctx.lineWidth = 1;
  ctx.strokeRect(24.5, 24.5, width - 49, height - 49);
  // Fine orbital lines hold the same instrument language as the site.
  ctx.strokeStyle = ink.orbit;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.48, width * (0.28 + i * 0.1), height * 0.24, -0.25, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = ink.brand;
  ctx.font = "600 38px Orbitron, sans-serif";
  const signature = platinum
    ? document.querySelector<HTMLImageElement>('img[src="/brand/platinum/wordmark.svg"]')
    : null;
  if (signature?.complete && signature.naturalWidth) {
    // Reuse the displayed brand asset. Export never waits on another network request.
    const logoWidth = 215;
    const logoHeight = (logoWidth * signature.naturalHeight) / signature.naturalWidth;
    ctx.drawImage(signature, 64, 104 - logoHeight, logoWidth, logoHeight);
  } else {
    const wordmark = "cAshIo";
    if (platinum)
      for (let index = 0; index < wordmark.length; index++) {
        const glyph = wordmark[index];
        ctx.fillStyle = glyph === "A" ? "#3578FF" : glyph === "I" ? "#FF3D55" : ink.brand;
        ctx.fillText(glyph, 64 + ctx.measureText(wordmark.slice(0, index)).width, 100);
      }
    else ctx.fillText(wordmark, 64, 100);
    // Give the capital I its wordmark serifs so the signature cannot read as cAshlo.
    const glyph = ctx.measureText("I");
    const centre = 64 + ctx.measureText("cAsh").width + glyph.width / 2;
    ctx.fillStyle = platinum ? "#FF3D55" : ink.brand;
    ctx.fillRect(centre - 8.7, 100 - glyph.actualBoundingBoxAscent, 17.4, 3);
    ctx.fillRect(centre - 8.7, 97, 17.4, 3);
  }
  ctx.fillStyle = ink.meta;
  ctx.font = '18px "JetBrains Mono", monospace';
  ctx.textAlign = "right";
  ctx.fillText("FIRST FLIGHT / YOUR RECORD", width - 64, 95);
  ctx.textAlign = "left";
  ctx.strokeStyle = ink.rule;
  ctx.beginPath();
  ctx.moveTo(64, 128);
  ctx.lineTo(width - 64, 128);
  ctx.stroke();
  if (platinum) {
    // A small blue/red registration pair belongs to the frame, not to an outcome status.
    ctx.fillStyle = "#3578FF";
    ctx.fillRect(64, 126, 120, 4);
    ctx.fillStyle = "#FF3D55";
    ctx.fillRect(190, 126, 30, 4);
  }

  const titleX = portrait || report ? 64 : 930;
  const titleY = 230;
  const titleWidth = portrait ? 950 : report ? 1472 : 590;
  ctx.fillStyle = ink.identity;
  ctx.font = '18px "JetBrains Mono", monospace';
  const identity = label ? `CALLSIGN / ${label}` : "EXPLORER / FIRST FLIGHT";
  ctx.fillText(identity, titleX, portrait ? 172 : 174, titleWidth);
  ctx.fillStyle = ink.title;
  ctx.font = `600 ${portrait ? (report ? 52 : 57) : report ? 45 : 51}px Orbitron, sans-serif`;
  const titleBottom = wrap(ctx, record.title, titleX, titleY, titleWidth, portrait ? 76 : 68);
  ctx.fillStyle = ink.accent;
  ctx.font = '18px "JetBrains Mono", monospace';
  ctx.fillText(report ? "FIELD REPORT / A HUMAN IN COMMAND." : "A HUMAN IN COMMAND.", titleX, titleBottom + 14);

  const area = report
    ? portrait
      ? { x: 64, y: 430, w: 952, h: 360 }
      : { x: 64, y: 340, w: 800, h: 400 }
    : portrait
      ? { x: 38, y: 416, w: 1004, h: 470 }
      : { x: 36, y: 160, w: 850, h: 570 };
  if (report) {
    ctx.fillStyle = ink.well;
    ctx.fillRect(area.x, area.y, area.w, area.h);
    ctx.strokeStyle = ink.imageEdge;
    ctx.strokeRect(area.x + 0.5, area.y + 0.5, area.w - 1, area.h - 1);
  }
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
  ctx.strokeStyle = ink.reticle;
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
  ctx.fillStyle = ink.body;
  ctx.font = `${report ? 27 : 23}px "Exo 2", sans-serif`;
  const decisionX = report && !portrait ? 930 : titleX;
  const decisionY = report ? (portrait ? 842 : 360) : portrait ? 936 : titleBottom + 76;
  wrap(ctx, record.decision, decisionX, decisionY, report && !portrait ? 590 : titleWidth, report ? 38 : 34);
  const settingsY = portrait ? (report ? 990 : 1010) : report ? 550 : 580;
  ctx.font = '17px "JetBrains Mono", monospace';
  [record.architecture + " / " + record.connection, record.sensitivity, record.permission].forEach((label, i) => {
    ctx.fillStyle = i === 0 ? ink.identity : ink.text;
    ctx.fillText(label, portrait ? 64 : report ? 930 : titleX, settingsY + i * 30);
  });
  const metricsY = portrait ? 1145 : 770;
  const column = (width - 128) / 3;
  [
    [record.outcome.local, "ONBOARD", ink.onboard],
    [record.outcome.cloud, "CLOUD", ink.cloud],
    [record.outcome.held, "HELD", ink.held],
  ].forEach(([value, label, color], i) => {
    const x = 64 + i * column;
    ctx.fillStyle = String(color);
    ctx.fillRect(x, metricsY, column - 26, 2);
    ctx.font = "600 66px Orbitron, sans-serif";
    ctx.fillText(String(value).padStart(2, "0"), x, metricsY + 83);
    ctx.font = '17px "JetBrains Mono", monospace';
    if (platinum) ctx.fillStyle = ink.meta;
    ctx.fillText(String(label), x + (portrait ? 0 : 150), metricsY + (portrait ? 116 : 70));
  });
  ctx.fillStyle = platinum ? ink.text : "#d3dadd";
  ctx.font = '16px "JetBrains Mono", monospace';
  // Long development origins must remain inside the exported record as well.
  wrap(ctx, record.url, 64, height - 102, width - 128, 24);
  ctx.fillStyle = ink.note;
  ctx.font = '20px "Exo 2", sans-serif';
  ctx.fillText("Browser illustration · 12 synthetic requests · No AI requests sent", 64, height - 52);
  const blob = await new Promise<Blob>((resolve, reject) => {
    card.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("The card could not be prepared."))),
      "image/png",
    );
  });
  return {
    blob,
    record,
    filename: record.filename.replace(/\.png$/, `${report ? "-field-report" : ""}-${format}.png`),
  };
}

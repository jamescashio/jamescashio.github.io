import { missionHash } from "./flight-plan";
import { computeWorldOutcome, type WorldInput } from "./sovereign-model";

/** The same bounded scenario powers the live counters, saved card, and reopen link. */
export function missionRecord(input: WorldInput) {
  const outcome = computeWorldOutcome(input);
  const title =
    outcome.held === 12 && !input.connected
      ? "Cloud lost. Work is waiting."
      : outcome.held === 12
        ? "Twelve requests. Your decision."
        : outcome.local === 12
          ? "The work stayed aboard."
          : outcome.cloud === 12
            ? "A deliberate cloud crossing."
            : "One ship. A chosen boundary.";
  return {
    title,
    outcome,
    architecture: { sovereign: "SOVEREIGN / LOCAL", hybrid: "HYBRID", cloud: "CLOUD" }[input.architecture],
    connection: input.connected ? "RELAY CONNECTED" : "RELAY OFFLINE",
    sensitivity: `${outcome.privateCount} PRIVATE / ${outcome.publicCount} PUBLIC`,
    permission: input.allowPrivateEgress ? "PRIVATE CLOUD PERMISSION ON" : "PRIVATE CLOUD PERMISSION OFF",
    heldLabel: input.architecture === "cloud" && !input.connected ? "WAITING FOR CONNECTION" : "HELD FOR PERMISSION",
    url: `https://cashio.us/${missionHash(input)}`,
    filename: `cashio-mission-${input.architecture}-${input.connected ? "connected" : "offline"}-${outcome.local}-${outcome.cloud}-${outcome.held}.png`,
  };
}

function lines(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, leading: number) {
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > width) {
      context.fillText(line, x, y);
      y += leading;
      line = word;
    } else line = next;
  }
  if (line) context.fillText(line, x, y);
  return y + leading;
}

/** A local, bounded PNG. The scene was frozen synchronously before any asynchronous work. */
export async function createMissionCard(still: HTMLCanvasElement, input: WorldInput, chapter: string) {
  const record = missionRecord(input);
  const card = document.createElement("canvas");
  card.width = 1200;
  card.height = 800;
  const ctx = card.getContext("2d");
  if (!ctx) throw new Error("Image export is unavailable.");
  ctx.fillStyle = "#06121d";
  ctx.fillRect(0, 0, 1200, 800);
  const glow = ctx.createRadialGradient(530, 330, 10, 530, 330, 600);
  glow.addColorStop(0, "#153143");
  glow.addColorStop(1, "#06121d");
  ctx.fillStyle = glow;
  ctx.fillRect(24, 24, 1152, 752);
  ctx.strokeStyle = "#6b7e86";
  ctx.strokeRect(24.5, 24.5, 1151, 751);
  ctx.fillStyle = "#efd0a0";
  ctx.font = "600 30px Oxanium, sans-serif";
  const signature = document.querySelector<HTMLImageElement>(".o-header img");
  if (signature?.complete && signature.naturalWidth) {
    const height = (148 * signature.naturalHeight) / signature.naturalWidth;
    ctx.drawImage(signature, 56, 60 - height / 2, 148, height);
  } else ctx.fillText("CASHIO", 56, 78);
  ctx.font = "14px Jet, monospace";
  ctx.fillStyle = "#bdd6e2";
  ctx.fillText("YOUR FLIGHT RECORD", 220, 75);
  ctx.textAlign = "right";
  ctx.fillText("A HUMAN IN COMMAND", 1144, 75);
  ctx.textAlign = "left";
  ctx.strokeStyle = "#526d7c";
  ctx.beginPath();
  ctx.moveTo(56, 100);
  ctx.lineTo(1144, 100);
  ctx.stroke();

  // Contain, never crop: preserve the camera composition on every phone and desktop.
  const scale = Math.min(714 / still.width, 446 / still.height);
  const width = still.width * scale,
    height = still.height * scale;
  ctx.drawImage(still, 42 + (714 - width) / 2, 122 + (446 - height) / 2, width, height);
  ctx.fillStyle = "#a6ccd7";
  ctx.font = "13px Jet, monospace";
  ctx.fillText(chapter.toUpperCase(), 56, 590);

  ctx.fillStyle = "#efd0a0";
  ctx.font = "13px Jet, monospace";
  ctx.fillText(record.architecture, 788, 150);
  ctx.fillStyle = "#eef7fa";
  ctx.font = "500 38px Oxanium, sans-serif";
  const bottom = lines(ctx, record.title, 786, 198, 345, 45);
  ctx.font = "500 17px Exo, sans-serif";
  ctx.fillStyle = "#bed1dc";
  lines(ctx, record.outcome.summary, 788, bottom + 18, 344, 26);
  ctx.font = "12px Jet, monospace";
  [record.connection, record.sensitivity, record.permission].forEach((label, i) => {
    ctx.fillStyle = i === 0 ? "#91eded" : "#c4d4df";
    ctx.fillText(label, 788, 491 + i * 25);
  });

  const measures = [
    { label: "STAYED ABOARD", value: record.outcome.local, color: "#87eeea" },
    { label: "ROUTED TO CLOUD", value: record.outcome.cloud, color: "#f3d19b" },
    { label: record.heldLabel, value: record.outcome.held, color: "#ffbaa4" },
  ];
  measures.forEach((measure, i) => {
    const x = 56 + i * 365;
    ctx.fillStyle = measure.color;
    ctx.fillRect(x, 612, 332, 2);
    ctx.font = "500 49px Oxanium, sans-serif";
    ctx.fillText(String(measure.value).padStart(2, "0"), x, 674);
    ctx.font = "12px Jet, monospace";
    ctx.fillText(measure.label, x + 83, 660);
  });
  ctx.fillStyle = "#c7d9e1";
  ctx.font = "13px Jet, monospace";
  ctx.fillText(record.url, 56, 723);
  ctx.fillStyle = "#abc0cd";
  ctx.font = "14px Exo, sans-serif";
  ctx.fillText(
    "Browser illustration · 12 synthetic requests · No AI requests sent · Reopen the link to try these settings.",
    56,
    751,
  );
  const blob = await new Promise<Blob>((resolve, reject) => {
    card.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("The mission card could not be saved."))),
      "image/png",
    );
  });
  return { blob, record };
}

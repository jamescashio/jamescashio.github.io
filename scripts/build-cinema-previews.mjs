// Cut a silent three second loop from each short film for the screening room's hover previews.
// Originals and the full cinema player stay untouched. Run: node scripts/build-cinema-previews.mjs
import { execFileSync } from "node:child_process";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const source = "public/assets/zenith";
const output = "public/v42/previews";
await mkdir(output, { recursive: true });
for (const name of (await readdir(source)).filter((name) => name.endsWith(".mp4")).sort()) {
  const input = path.join(source, name);
  const destination = path.join(output, name);
  // The final 300 ms dissolve into the opening 300 ms, so the loop has no visible seam.
  const filter =
    "[0:v]fps=24,scale=960:-2:flags=lanczos,format=yuv420p,split[a][b];" +
    "[a]trim=0:3.3,setpts=PTS-STARTPTS[main];[b]trim=0:0.3,setpts=PTS-STARTPTS[head];" +
    "[main][head]xfade=transition=fade:duration=0.3:offset=3,trim=start=0.3:end=3.3,setpts=PTS-STARTPTS[out]";
  execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      input,
      "-filter_complex",
      filter,
      "-map",
      "[out]",
      "-an",
      "-t",
      "3",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "29",
      "-maxrate",
      "900k",
      "-bufsize",
      "900k",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-threads",
      "2",
      destination,
    ],
    { stdio: "pipe" },
  );
  const bytes = (await stat(destination)).size;
  if (bytes >= 400000) throw new Error(`${name}: ${bytes} bytes exceeds the 400 KB preview budget`);
  const probe = JSON.parse(
    execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", destination], {
      encoding: "utf8",
    }),
  );
  if (probe.streams.some((stream) => stream.codec_type === "audio")) throw new Error(`${name}: preview must be silent`);
  if (Math.abs(Number(probe.format.duration) - 3) > 0.05) throw new Error(`${name}: duration is not three seconds`);
  console.log(JSON.stringify({ name, bytes, duration: Number(probe.format.duration) }));
}

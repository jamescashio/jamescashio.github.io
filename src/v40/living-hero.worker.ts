import {
  ClampToEdgeWrapping,
  ImageBitmapLoader,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  Vector2,
  WebGLRenderer,
} from "three";
import { vertexShader, fragmentShader } from "./hero-shaders";
import type { HeroCommand, HeroReply, HeroSize } from "./hero-worker-model";

const channel = self as unknown as {
  onmessage: ((event: MessageEvent<HeroCommand>) => void) | null;
  postMessage: (message: HeroReply) => void;
};
let render: ((message: Extract<HeroCommand, { type: "frame" }>) => void) | undefined;
let resize: ((size: HeroSize) => void) | undefined;

async function initialize(message: Extract<HeroCommand, { type: "init" }>) {
  const context = message.canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!context) throw new Error("WebGL unavailable");
  const renderer = new WebGLRenderer({ canvas: message.canvas, context, antialias: false, alpha: false });
  const loader = new ImageBitmapLoader().setOptions({ imageOrientation: "flipY" });
  const images = await Promise.all([loader.loadAsync(message.artwork), loader.loadAsync(message.depth)]);
  const [artwork, depthMap] = images.map((image) => {
    const texture = new Texture(image);
    texture.minFilter = texture.magFilter = LinearFilter;
    texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  });
  artwork.colorSpace = SRGBColorSpace;
  const uniforms = {
    artwork: { value: artwork },
    depthMap: { value: depthMap },
    fit: { value: new Vector2(1, 1) },
    pointer: { value: new Vector2() },
    time: { value: 0 },
  };
  const scene = new Scene();
  const view = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false });
  const geometry = new PlaneGeometry(2, 2);
  scene.add(new Mesh(geometry, material));
  resize = ({ width, height, density }) => {
    if (!width || !height) return;
    const ratio = width / height;
    uniforms.fit.value.set(Math.min(1, ratio / (16 / 9)), Math.min(1, 16 / 9 / ratio));
    renderer.setPixelRatio(Math.min(density, 3, Math.sqrt(8_000_000 / (width * height))));
    renderer.setSize(width, height, false);
  };
  resize(message.size);
  renderer.initTexture(artwork);
  renderer.initTexture(depthMap);
  let failed = false;
  renderer.debug.onShaderError = () => {
    failed = true;
  };
  await renderer.compileAsync(scene, view);
  if (failed) throw new Error("Shader unavailable");
  render = ({ time, x, y }) => {
    uniforms.time.value = time;
    uniforms.pointer.value.set(x, y);
    renderer.render(scene, view);
    channel.postMessage({ type: "frame" });
  };
  message.canvas.addEventListener("webglcontextlost", () => {
    render = undefined;
    channel.postMessage({ type: "failed" });
  });
  renderer.render(scene, view);
  channel.postMessage({ type: "ready" });
}
channel.onmessage = ({ data }) => {
  if (data.type === "init") void initialize(data).catch(() => channel.postMessage({ type: "failed" }));
  else if (data.type === "resize") resize?.(data.size);
  else render?.(data);
};

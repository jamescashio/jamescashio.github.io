export interface ViewscreenStageElement extends HTMLElement {
  setProgress(v: number): void;
  setDeck(i: number): void;
  setCraft(i: number): void;
  setClearX(f: number): void;
  setClearRect(rx: number, by: number): void;
  warp(): void;
  craftIndex(): number;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "viewscreen-stage": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

declare module "@/lib/viewscreen-stage.js" {
  export class ViewscreenStage extends HTMLElement {}
  const value: unknown;
  export default value;
}

export {};

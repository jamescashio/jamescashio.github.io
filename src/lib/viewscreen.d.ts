export interface ViewscreenStageElement extends HTMLElement {
  setProgress(v: number): void;
  setDeck(i: number): void;
  setCraft(i: number): void;
  setClearX(f: number): void;
  setClearRect(rx: number, by: number): void;
  setReducedMotion(reduce: boolean): void;
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

export {};

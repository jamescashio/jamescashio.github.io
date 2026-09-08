import { Component, Suspense, useEffect, useId, useRef, type ReactNode } from "react";

function SceneNotice({ name, failed, onClose }: { name: string; failed: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="o-art-dialog o-scene-notice"
      style={{ maxWidth: 540, background: "#07131f" }}
      aria-labelledby={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div>
        <span className="o-kicker">{name}</span>
        <h2 id={title} style={{ fontSize: 26, lineHeight: 1.3, marginTop: 14 }}>
          {failed ? "This scene couldn’t open." : "Preparing your scene…"}
        </h2>
        <p>
          {failed
            ? "You can keep exploring the site, or reload the page to try again."
            : "The artwork is loading. You can return to the site at any time."}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginTop: 16 }}>
          <button className="o-button o-button-gold" onClick={onClose} autoFocus>
            {failed ? "Back to the site" : "Cancel opening"}
          </button>
          {failed && (
            <button className="o-text-button" onClick={() => location.reload()}>
              Reload page
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

/** Optional experiences can fail without taking the portfolio down with them. */
export class SceneBoundary extends Component<
  { name: string; onClose: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    const { name, onClose, children } = this.props;
    if (this.state.failed) return <SceneNotice name={name} failed onClose={onClose} />;
    return <Suspense fallback={<SceneNotice name={name} failed={false} onClose={onClose} />}>{children}</Suspense>;
  }
}

import { useId, useRef, useState } from "react";
import { ARTICLES } from "@/lib/content";
import { createProofCardSvg, publicBuildUrl, safeArticleIndex } from "@/lib/proof-card";

export function ProofCard({ article = 0, label = "SHARE THIS BUILD" }: { article?: number; label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const selected = safeArticleIndex(article);
  const url = publicBuildUrl(selected);
  const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createProofCardSvg(selected))}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Build link copied. Ready to share.");
    } catch {
      setStatus("Copy is unavailable. Select the build link below and copy it.");
    }
  };

  const save = async () => {
    setSaving(true);
    setStatus("");
    try {
      const source = new Image();
      source.src = image;
      await source.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(source, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Image unavailable"))), "image/png"),
      );
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `cashio-${ARTICLES[selected].name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setStatus("Proof card prepared. Check your downloads.");
    } catch {
      setStatus("The image could not be saved in this browser. You can still copy the build link.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        ref={opener}
        type="button"
        className="za-btn-ghost za-proof-trigger"
        onClick={() => {
          setStatus("");
          dialog.current?.showModal();
        }}
      >
        {label}
        <span aria-hidden>↗</span>
      </button>
      <dialog
        ref={dialog}
        className="za-proof-dialog"
        aria-labelledby={titleId}
        onKeyDown={(event) => event.stopPropagation()}
        onClose={() => opener.current?.focus()}
      >
        <div className="za-proof-dialog-head">
          <div>
            <span className="za-kicker">TAKE THE PROOF WITH YOU</span>
            <h2 id={titleId} className="za-display">
              YOUR BLACK BOX RECEIPT.
            </h2>
          </div>
          <button
            type="button"
            className="za-btn-ghost"
            onClick={() => dialog.current?.close()}
            aria-label="Close proof card"
          >
            ×
          </button>
        </div>
        <img
          className="za-proof-preview"
          src={image}
          width="1200"
          height="630"
          alt={`Share card for ${ARTICLES[selected].name}`}
        />
        <p className="za-proof-explanation">
          A card for the build you selected, with a direct link back to its demonstration.
        </p>
        <div className="za-proof-actions">
          <button type="button" className="za-btn" onClick={save} disabled={saving}>
            {saving ? "PREPARING…" : "SAVE IMAGE"}
          </button>
          <button type="button" className="za-btn-ghost" onClick={copy}>
            COPY BUILD LINK
          </button>
        </div>
        <label className="za-proof-url">
          BUILD LINK
          <input readOnly value={url} onFocus={(event) => event.currentTarget.select()} />
        </label>
        <p className="za-proof-status" role="status" aria-live="polite">
          {status}
        </p>
      </dialog>
    </>
  );
}

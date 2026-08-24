import { useState } from "react";
import { BLACK_BOX_RECEIPT_CLAIMS, canonicalReceiptUrl } from "@/lib/black-box-receipt";

function isShareCancellation(error: unknown) {
  return typeof error === "object" && error != null && "name" in error && error.name === "AbortError";
}

export function BlackBoxReceipt() {
  const [status, setStatus] = useState("");

  const copyOrShare = async () => {
    const url = canonicalReceiptUrl(window.location);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Cashio.us Black Box Receipt", url });
        setStatus("Receipt link shared.");
        return;
      } catch (error) {
        if (isShareCancellation(error)) {
          setStatus("Share cancelled.");
          return;
        }
      }
    }

    if (typeof navigator.clipboard?.writeText === "function") {
      try {
        await navigator.clipboard.writeText(url);
        setStatus("Receipt link copied.");
        return;
      } catch {
        setStatus("Unable to copy the receipt link. Select the address bar to copy it.");
        return;
      }
    }

    setStatus("Copy is unavailable in this browser. Select the address bar to copy the receipt link.");
  };

  return (
    <section className="za-panel mt-6 p-5" aria-labelledby="black-box-receipt-heading">
      <div className="za-kicker">EVIDENCE LOCKER</div>
      <h3 id="black-box-receipt-heading" className="za-display mt-2 text-xl text-cyan">
        BLACK BOX RECEIPT
      </h3>
      <ul className="mt-4 space-y-2">
        {BLACK_BOX_RECEIPT_CLAIMS.map((claim) => (
          <li key={claim} className="za-mono text-[10px] leading-relaxed text-dim">
            {claim}
          </li>
        ))}
      </ul>
      <button type="button" className="za-btn-ghost mt-5 min-h-11 px-4 py-3 text-[10px]" onClick={copyOrShare}>
        COPY / SHARE LINK
      </button>
      <p className="za-mono mt-3 min-h-4 text-[10px] text-dim" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}

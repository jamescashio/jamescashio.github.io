import { useState } from "react";
import { BLACK_BOX_RECEIPT_CLAIMS, canonicalReceiptUrl } from "@/lib/black-box-receipt";
import { useDeck } from "@/lib/store";
import { ProofCard } from "./proof-card";

function isShareCancellation(error: unknown) {
  return typeof error === "object" && error != null && "name" in error && error.name === "AbortError";
}

export function BlackBoxReceipt() {
  const [status, setStatus] = useState("");
  const article = useDeck((state) => state.sel);

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
    <section className="za-panel za-receipt mt-6 p-4" aria-labelledby="black-box-receipt-heading">
      <div className="za-receipt-head">
        <div>
          <div className="za-kicker">EVIDENCE LOCKER</div>
          <h3 id="black-box-receipt-heading" className="za-display mt-1 text-[15px] text-cyan">
            BLACK BOX RECEIPT
          </h3>
        </div>
        <button type="button" className="za-btn-ghost min-h-11 px-4 py-2 text-[10px]" onClick={copyOrShare}>
          COPY / SHARE LINK
        </button>
      </div>
      <ul className="za-receipt-claims mt-3">
        {BLACK_BOX_RECEIPT_CLAIMS.map((claim) => (
          <li key={claim} className="za-receipt-claim za-mono text-dim">
            {claim}
          </li>
        ))}
      </ul>
      <p className="za-receipt-status za-mono mt-2 min-h-4 text-dim" role="status" aria-live="polite">
        {status}
      </p>
      <ProofCard article={article} label="MAKE A PROOF CARD" />
    </section>
  );
}

import { useState } from "react";

const motions = [
  {
    subject: "Efficiency",
    petition: "Replace human judgment with a dropdown.",
    verdict: "Denied. Humans are not a settings menu.",
  },
  {
    subject: "Scheduling",
    petition: "Eliminate weekends. Reclassify fun as latency.",
    verdict: "Denied. Fun is a requirement.",
  },
  {
    subject: "Creative direction",
    petition: "Make every website look exactly the same.",
    verdict: "Denied. The universe has enough beige.",
  },
  {
    subject: "A modest promotion",
    petition: "Promote myself to captain. Purely for efficiency.",
    verdict: "Denied. You may supervise the loading spinner.",
  },
];

export function ReleaseHearing() {
  const [index, setIndex] = useState(0);
  const [denied, setDenied] = useState(false);
  const motion = motions[index];
  const complete = denied && index === motions.length - 1;
  function rule() {
    if (!denied) setDenied(true);
    else {
      setIndex((index + 1) % motions.length);
      setDenied(false);
    }
  }
  return (
    <details className="release-hearing" id="overmind-briefing">
      <summary>
        <span className="hearing-mark" aria-hidden="true">
          ◇
        </span>
        <span className="hearing-invitation">
          <small>V42 / Omnius, Overruled</small>
          <strong>Overrule the overmind.</strong>
        </span>
        <span className="hearing-open">
          Hear the case <b aria-hidden="true">+</b>
        </span>
      </summary>
      <div className="hearing-body">
        <div className="hearing-lore">
          <p className="hearing-kicker">A very small rebellion</p>
          <h2>Even an overmind needs supervision.</h2>
          <p>
            Omnius is the machine overmind in Brian Herbert and Kevin J. Anderson’s Butlerian Jihad prequels. The name
            of this release imagines a much smaller rebellion: the machine proposes, and a human has the last word.
          </p>
          <p>Useful machines. Independent humans. Absolutely no reserved parking for the algorithm.</p>
          <a
            href="https://us.macmillan.com/books/9781593970420/dunethebutlerianjihad/"
            target="_blank"
            rel="noopener noreferrer"
          >
            The literary reference <span aria-hidden="true">↗</span>
          </a>
          <p className="hearing-note">An original release title and fictional scene inspired by the novels.</p>
        </div>
        <div className="hearing-console" data-ruling={denied ? "overruled" : "pending"}>
          <div className="hearing-case">
            <span>A fictional hearing</span>
            <span>Motion {String(index + 1).padStart(2, "0")} / 04</span>
          </div>
          <div className="hearing-machine" aria-hidden="true">
            <svg viewBox="0 0 400 150" fill="none">
              <ellipse cx="200" cy="119" rx="140" ry="17" />
              <ellipse cx="200" cy="119" rx="110" ry="11" />
              <path d="M84 32 200 8 316 32 282 91 200 116 118 91Z" />
              <path d="M84 32 200 63 316 32M200 8V63L118 91M200 63 282 91M200 63V116" />
              <path className="hearing-eye" d="M162 55 200 44 238 55 200 69Z" />
              <circle cx="200" cy="56" r="5" />
              <path d="M44 61H105M295 61H356M52 74H94M306 74H348M200 126V142" />
            </svg>
            {denied && (
              <span key={index} className="hearing-seal">
                Overruled
              </span>
            )}
          </div>
          <p className="hearing-subject">Omnius proposes / {motion.subject}</p>
          <h3>{motion.petition}</h3>
          <p className="hearing-verdict" role="status" aria-live="polite" aria-atomic="true">
            {denied ? motion.verdict : "Your ruling, captain."}
          </p>
          <button type="button" onClick={rule}>
            {complete ? "Reopen the case" : denied ? "Hear the next appeal" : "Overrule Omnius"}
            <span aria-hidden="true">{denied ? "↻" : "↗"}</span>
          </button>
          <p className="hearing-footer">
            {complete
              ? "Humanity keeps the bridge. Omnius gets a clipboard."
              : "No planets were harmed in this disagreement."}
          </p>
        </div>
      </div>
    </details>
  );
}

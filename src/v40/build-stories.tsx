import { useState } from "react";
import { snapshot } from "./evidence.ts";

const stories = {
  evidence: {
    title: "Inside the backup receipt",
    premise: "A green job badge answers one question. Recovery asks several more.",
    lesson:
      "The useful result is a claim with a boundary. An integrity check is one piece of recovery evidence; a restore rehearsal and an independent recovery path still need their own proof.",
    steps: [
      {
        label: "Read",
        title: "Begin with the record",
        text: "The observation brings together a read only guest inventory and the backup service’s reported snapshot checks. The collection time travels with the figures, so a visitor can tell when they were observed.",
      },
      {
        label: "Reconcile",
        title: "Count the right things",
        text: "The integrity result concerns the latest reported snapshot for each guest checked. It is not a count of all stored snapshots, a claim that a new backup was just created, or a successful application health check.",
      },
      {
        label: "Publish",
        title: "Keep the claim small enough to trust",
        text: `${snapshot.backup.latestVerified} of ${snapshot.backup.latestChecked} latest reported snapshots passed their integrity check in that same dated observation. The public receipt keeps aggregate counts and explicit unknowns; private addresses and service details stay out.`,
      },
    ],
    link: "/status.json",
    action: "Inspect the observation JSON",
  },
  brief: {
    title: "Inside the decision brief",
    premise: "A confident paragraph can hide the very thing a decision depends on.",
    lesson:
      "Give the unknowns their own space. A useful brief separates an observation from a conclusion and makes the next human decision easy to find. The form organizes your words; it cannot certify that they are true.",
    steps: [
      {
        label: "Separate",
        title: "Four fields. Four different jobs.",
        text: "The brief separates what was observed, its source and date, what remains unknown, and who decides. Its starting example uses this site’s published observation, so you can inspect the source before changing the wording.",
      },
      {
        label: "Compose",
        title: "Make uncertainty visible",
        text: "Experiment 04 lets you edit each field and assemble a readable brief. Your writing stays in the current browser tab. There is no model call, automatic approval, or background submission.",
      },
      {
        label: "Keep",
        title: "A useful thing to take away",
        text: "Copy the finished brief or download a plain text file. The export retains the four headings and explains that its claims have not been independently verified by the tool. No account is needed.",
      },
    ],
    link: "#experiment=briefing",
    action: "Open the brief composer",
  },
};

function BuildDiagram({ selected, kind }: { selected: number; kind: keyof typeof stories }) {
  const trace = ["M36 114h76", "M112 114h135l53-30", "M300 84l53 30h135"][selected];
  return (
    <svg className="build-diagram" viewBox="0 0 600 220" fill="none" aria-hidden="true">
      <path
        className="build-floor"
        d="m0 152 184-96 416 84M0 177 184-96 416 84M80 200 184-96 336 68M0 120l390 79M60 88l474 96M140 46l460 93"
      />
      <ellipse className="build-orbit" cx="300" cy="107" rx="260" ry="72" />
      {[
        [112, 174],
        [300, 157],
        [488, 187],
      ].map(([x, y], i) => (
        <g
          key={x}
          className={selected === i ? "build-plinth is-selected" : "build-plinth"}
          transform={`translate(${x} ${y})`}
        >
          <ellipse rx="60" ry="18" className="build-ground-light" />
          <path d="m-56 0 56-29 56 29-56 29Z" />
          <path d="m-56 0v6l56 29 56-29V0M0 29v6" />
        </g>
      ))}
      <path className="build-route" d="M112 114h135l53-30 53 30h135" />
      <path key={selected} className="build-route-light" pathLength="1" d={trace} />
      <g className={selected === 0 ? "build-node is-selected" : "build-node"}>
        <path className="build-node-fill" d="m71 71 41-23 41 23v71l-41 24-41-24Z" />
        <path className="build-face-shadow" d="m112 95 41-24v71l-41 24Z" />
        <path className="build-face-top" d="m71 71 41-23 41 23-41 24Z" />
        <path d="m71 71 41 24 41-24M112 95v71M80 93l23 13m-23 8 23 13m-23 8 23 13" />
        <path d={kind === "evidence" ? "m122 106 20-12m-20 33 20-12m-20 33 20-12" : "m122 106 20-12m-20 33 13-8"} />
        <circle cx="112" cy="49" r="4" />
      </g>
      <g className={selected === 1 ? "build-node is-selected" : "build-node"}>
        <path className="build-node-fill" d="m300 40 48 27v54l-48 28-48-28V67Z" />
        <path className="build-face-shadow" d="m300 94 48-27v54l-48 28Z" />
        <path className="build-face-top" d="m252 67 48-27 48 27-48 27Z" />
        <path d="m252 67 48 27 48-27M300 94v55" />
        <ellipse cx="300" cy="67" rx="26" ry="15" />
        <path d={kind === "evidence" ? "m286 66 10 6 18-10" : "m283 67 17-10 17 10-17 10Z"} />
        <path d="M264 99v12l23 13m26-1 23-13V97" />
      </g>
      <g className={selected === 2 ? "build-node is-selected" : "build-node"}>
        <path className="build-node-fill" d="m456 54 44 9 24 30v70l-68-14Z" />
        <path className="build-face-shadow" d="m490 88 34 5v70l-34-7Z" />
        <path className="build-face-top" d="m500 63 24 30-24-5Z" />
        <path d="M500 63v25l24 5m-54 6 38 8m-38 8 38 8m-38 8 21 4" />
        <path d="m466 157-10 12 55 12 24-18-11-8" />
        <circle className="build-seal" cx="512" cy="146" r="15" />
        <path d="m505 146 5 5 9-10" />
      </g>
      {[112, 300, 488].map((x, i) => (
        <circle
          key={x}
          className={selected === i ? "build-beacon is-selected" : "build-beacon"}
          cx={x}
          cy="210"
          r="3"
        />
      ))}
    </svg>
  );
}

export function BuildStory({ kind }: { kind: keyof typeof stories }) {
  const [selected, select] = useState(0);
  const story = stories[kind];
  return (
    <div className={`build-story build-story-${kind}`}>
      <div className="build-illustration">
        <span className="build-illustration-label">
          {kind === "evidence" ? "READ → RECONCILE → PUBLISH" : "OBSERVE → QUESTION → DECIDE"}
        </span>
        <BuildDiagram kind={kind} selected={selected} />
        <span className="build-illustration-caption">
          {kind === "evidence" ? "The architecture of a modest claim." : "A little structure. Room for doubt."}
        </span>
      </div>
      <details className="build-notes" id={`build-${kind}`}>
        <summary>
          <span>
            {story.title}
            <small>Problem, decisions, result</small>
          </span>
          <span className="build-plus" aria-hidden="true">
            ＋
          </span>
        </summary>
        <div className="build-notes-body">
          <p className="build-premise">{story.premise}</p>
          <div className="build-steps" role="group" aria-label={`${story.title} steps`}>
            {story.steps.map((step, i) => (
              <button
                key={step.label}
                type="button"
                aria-pressed={i === selected}
                aria-controls={`build-${kind}-step-${i}`}
                onClick={() => select(i)}
              >
                <span aria-hidden="true">0{i + 1}</span>
                {step.label}
              </button>
            ))}
          </div>
          <div className="build-story-pages" aria-live="polite">
            {story.steps.map((step, i) => (
              <div
                key={step.label}
                id={`build-${kind}-step-${i}`}
                className="build-story-page"
                data-selected={i === selected}
              >
                <h4>{step.title}</h4>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
          <div className="build-lesson">
            <span>What I take from it</span>
            <p>{story.lesson}</p>
          </div>
          <a href={story.link} className="visitor-link">
            {story.action} ↗
          </a>
        </div>
      </details>
    </div>
  );
}

export function FirstOrbit() {
  // The same route the hero recommends: board, make one decision, then choose where to go next.
  return (
    <nav className="first-orbit" aria-label="Recommended first visit">
      <div>
        <span className="visitor-kicker">Your first orbit</span>
        <strong>Board. Decide. Explore.</strong>
        <p>Three stops, about two minutes. Sound stays off.</p>
      </div>
      <a href="#flight=board">
        <span className="first-orbit-number">01</span>
        <span>
          <strong>Board the starship</strong>
          <small>Your pace, or the 30 second tour</small>
        </span>
        <span aria-hidden="true">↗</span>
      </a>
      <a href="#flight=blackout">
        <span className="first-orbit-number">02</span>
        <span>
          <strong>Cut the cloud link</strong>
          <small>See which work stays aboard</small>
        </span>
        <span aria-hidden="true">↗</span>
      </a>
      <a href="#rooms">
        <span className="first-orbit-number">03</span>
        <span>
          <strong>Pick a world</strong>
          <small>Four worlds to fly, turn and watch</small>
        </span>
        <span aria-hidden="true">↓</span>
      </a>
    </nav>
  );
}

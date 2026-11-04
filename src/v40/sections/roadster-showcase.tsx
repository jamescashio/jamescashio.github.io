export function RoadsterShowcase() {
  return (
    <section id="roadster-studio" className="roadster-showcase" aria-labelledby="roadster-studio-title">
      <div className="roadster-intro">
        <p className="roadster-kicker">From the workshop / Independent design study</p>
        <div className="roadster-heading">
          <h2 id="roadster-studio-title">
            Roadster <em>Studio</em>
          </h2>
          <p>
            A roadster. Ten thrusters.
            <br />
            One unreasonable departure.
          </p>
        </div>
      </div>
      <div className="roadster-plate">
        <a
          className="roadster-stage"
          href="https://roadster-studio.hotsaucecashio.chatgpt.site/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Explore Roadster Studio, opens in a new tab"
        >
          <img
            src="/images/roadster-studio-960.webp"
            srcSet="/images/roadster-studio-640.webp 640w, /images/roadster-studio-960.webp 960w, /images/roadster-studio-1600.webp 1600w"
            sizes="(max-width: 760px) calc(100vw - 36px), (max-width: 1400px) calc(100vw - 160px), 1200px"
            width="1600"
            height="900"
            loading="lazy"
            decoding="async"
            alt="Pearl white Roadster concept with bronze glass and sculpted wheels, rendered from the interactive CAD model."
          />
          <span className="roadster-cta">
            Explore Roadster Studio <span aria-hidden="true">↗</span>
          </span>
        </a>
        <span className="roadster-stage-label" aria-hidden="true">
          DESIGN STUDY / 01
        </span>
        <span className="roadster-orbit" aria-hidden="true" />
      </div>
      <div className="roadster-caption">
        <p>Explore the independent 3D design study. Find your favorite angle and compose your own photograph.</p>
        <span>Interactive 3D · Opens a new tab</span>
      </div>
    </section>
  );
}

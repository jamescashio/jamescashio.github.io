export function Art({
  name,
  className = "",
  eager = false,
}: {
  name: "orbit" | "sanctuary";
  className?: string;
  eager?: boolean;
}) {
  const asset = name === "orbit" ? "orbit-aurora-v37" : "sanctuary-v37";
  // The 285px phone cover needs 507px of the 1672:941 artwork. Match the preload.
  const sizes = name === "orbit" ? "(max-width: 600px) max(100vw, 507px), 100vw" : "100vw";
  return (
    <picture className={className}>
      <source
        type="image/avif"
        srcSet={`/odyssey/${asset}-800.avif 800w, /odyssey/${asset}-1200.avif 1200w, /odyssey/${asset}-1672.avif 1672w`}
        sizes={sizes}
      />
      <img
        src={`/odyssey/${asset}-1672.webp`}
        srcSet={`/odyssey/${asset}-800.webp 800w, /odyssey/${asset}-1200.webp 1200w, /odyssey/${asset}-1672.webp 1672w`}
        sizes={sizes}
        width="1672"
        height="941"
        alt={
          name === "orbit"
            ? "Original concept art: a cyan-lit titanium orbital ring holds a faceted gold core above a blue planet and warm sunrise."
            : "Original concept art: twin graphite computing monoliths in a sunlit stone sanctuary, with a faceted amber core between them."
        }
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
      />
    </picture>
  );
}

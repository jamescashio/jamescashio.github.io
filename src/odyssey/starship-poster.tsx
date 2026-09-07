/** High-resolution stills rendered from the same local geometry as the interactive ship. */
export function StarshipPoster({
  className,
  imageClassName,
  eager = false,
}: {
  className?: string;
  imageClassName?: string;
  eager?: boolean;
}) {
  return (
    <picture className={className}>
      <source media="(max-width: 700px)" srcSet="/assets/continuum/carrier-mobile.webp" />
      <img
        className={imageClassName}
        src="/assets/continuum/carrier-desktop.webp"
        width="1600"
        height="900"
        alt="An original titanium and graphite exploration starship with recessed machinery, swept wings, cyan engines, a gold command core, and a separate orbital cloud relay."
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </picture>
  );
}

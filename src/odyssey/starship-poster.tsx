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
      <source type="image/avif" media="(max-width: 700px)" srcSet="/assets/sovereign-starship-v37-mobile.avif" />
      <source type="image/avif" srcSet="/assets/sovereign-starship-v37.avif" />
      <source media="(max-width: 700px)" srcSet="/assets/sovereign-starship-v37-mobile.webp" />
      <img
        className={imageClassName}
        src="/assets/sovereign-starship-v37.webp"
        width="1600"
        height="900"
        alt="An original pearl-titanium exploration starship with swept wings, cyan engines, a gold command core, and a separate orbital cloud relay."
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </picture>
  );
}

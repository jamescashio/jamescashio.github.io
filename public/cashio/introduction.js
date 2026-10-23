const films = [...document.querySelectorAll("video")];
for (const film of films) {
  film.addEventListener("play", () => {
    for (const other of films) if (other !== film) other.pause();
  });
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) for (const film of films) film.pause();
});
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (!entry.isIntersecting) entry.target.pause();
  });
  for (const film of films) observer.observe(film);
}

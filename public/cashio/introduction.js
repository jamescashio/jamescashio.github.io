const film = document.querySelector("video");
document.addEventListener("visibilitychange", () => {
  if (document.hidden) film.pause();
});
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) film.pause();
  }).observe(film);
}

import html from "./rooms/starship.html?raw";
import { setupSovereignLab } from "./sovereign-lab.js";
export { html };
export function mount(context) {
  const lab = setupSovereignLab(context);
  document.querySelector("#tg-net").addEventListener("click", () => {
    if (!lab.getState().net) context.say("BLACKOUT", "Cloud link is down. Watch what stays aboard.", "alert", 2200);
    else context.say("RELAY UP", "Connection restored. Public work may leave the ship again.", "yes", 1800);
  });
  return lab;
}

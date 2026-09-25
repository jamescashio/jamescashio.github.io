import { $, $$, press } from "./dom.js";
import { gsap } from "gsap";

export function setupHeritage({ motion, say }) {
  const PILOTS = {
    yeager: {
      title: "YEAGER · BELL X-1 · 1947",
      credit: "NASA / USAF photo by Lt. Robert A. Hoover",
      kick: "CHUCK YEAGER · BELL X-1 · OCTOBER 14, 1947",
      head: "Fly the card. Report what the machine did.",
      body: "Yeager flew the X-1 past the speed of sound in 1947. The lesson I bring to my workshop: define the test, record what happened, and keep the story within the evidence.",
      source: "https://www.nasa.gov/history/x1/",
      sourceLabel: "Explore the X-1 history at NASA",
      idx: "01 / 04",
      line: "Define the test. Record what happened. Let the evidence set the limits.",
    },
    johnson: {
      title: "JOHNSON · SR-71 · 1964",
      credit: "NASA photo by Jim Ross",
      kick: "KELLY JOHNSON · SKUNK WORKS · SR-71 · 1964",
      head: "Small team, few parts, short runway.",
      body: "Johnson's fourteen rules emphasize small teams, direct responsibility and thorough records of important work. My takeaway: keep the path short between finding a problem and being able to fix it.",
      source: "https://www.lockheedmartin.com/content/dam/lockheed-martin/aero/photo/skunkworks/kellys-14-rules.pdf",
      sourceLabel: "Read Kelly's fourteen rules",
      idx: "02 / 04",
      line: "Give the person closest to the problem a clear path to solve it.",
    },
    rutan: {
      title: "RUTAN · PROTEUS · 1998",
      credit: "NASA / ESPO photo",
      kick: "BURT RUTAN · SCALED COMPOSITES · PROTEUS · 1998",
      head: "Build the strange thing. Then prove it in the air.",
      body: "Proteus first flew in 1998, designed for high altitude, long duration work. Its unusual form reminds me to start with the job a system must do, then test whether the design serves it.",
      source: "https://airbornescience.nasa.gov/aircraft/Proteus",
      sourceLabel: "Explore Proteus at NASA",
      idx: "03 / 04",
      line: "Start with the job. Give an unusual design a fair test.",
    },
    hoover: {
      title: "HOOVER · P-51 MUSTANG",
      credit: "U.S. Air National Guard photo by Tech. Sgt. Hampton Stramler",
      kick: "BOB HOOVER · P-51 · ENERGY MANAGEMENT",
      head: "Smooth is fast. Manage the energy you have.",
      body: "Hoover's flying is my reminder to treat capacity as precious. In this workshop, that means choosing a capable route when the task calls for it and keeping the decision understandable to the person in command.",
      source: "https://airandspace.si.edu/stories/editorial/remembering-robert-bob-hoover",
      sourceLabel: "Remember Bob Hoover with the Smithsonian",
      idx: "04 / 04",
      line: "Treat capacity as precious. Keep a human in command.",
    },
  };
  $("#pilots").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pilot]");
    if (!b) return;
    const k = b.dataset.pilot,
      P = PILOTS[k];
    press($("#pilots"), "data-pilot", k);
    $$("#hangar img.hp").forEach((im) => im.classList.toggle("on", im.dataset.pilot === k));
    $("#hg-title").textContent = P.title;
    $("#hg-credit").textContent = P.credit;
    $("#hg-idx").textContent = P.idx;
    $("#hg-kick").textContent = P.kick;
    $("#hg-head").textContent = P.head;
    $("#hg-body").textContent = P.body;
    $("#hg-source").href = P.source;
    $("#hg-source").textContent = P.sourceLabel + " ↗";
    if (motion())
      gsap.fromTo(
        "#hg-card > *",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "expo.out", overwrite: true },
      );
    say("FLIGHT HERITAGE", P.line, "think", 1800);
  });
}

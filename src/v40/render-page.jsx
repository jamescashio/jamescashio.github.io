import { ContinuumPrinciples } from "./continuum-hero.tsx";
import { ReleaseHearing } from "./release-hearing.tsx";
import { JourneyDock } from "./journey-dock.tsx";

import { ImmersiveHero as HeroSection } from "./immersive-hero.tsx";
import { DiscoveryConsole } from "./discovery-console.tsx";
import { EagleFilmSection } from "./sections/eagle-film.jsx";
import { WorkshopSection } from "./sections/workshop.jsx";
import { WorldsSection } from "./sections/worlds.jsx";
import { ShowcaseSection } from "./sections/showcase.jsx";
import { FilmsSection } from "./sections/films.jsx";
import { DecisionsSection } from "./sections/decisions.jsx";
import { ExperimentsSection } from "./sections/experiments.jsx";
import { MachinesSection } from "./sections/machines.jsx";
import { EvidenceSection } from "./sections/evidence.jsx";
import { OperatorSection } from "./sections/operator.jsx";
import { ContactSection } from "./sections/contact.jsx";
import { JourneyDisclosure } from "./sections/journey-disclosure.jsx";

import React from "react";

import { classFor } from "./style-variants.ts";
const h = React.createElement;
import { renderRail } from "./render-rail.jsx";
import { renderHeader } from "./render-header.jsx";
import { renderFooter } from "./render-footer.jsx";
import { renderCinema } from "./render-cinema.jsx";
export function renderPage(v) {
  return h(
    React.Fragment,
    null,
    " ",
    h(
      "div",
      {
        key: 2,
        className: classFor(
          [
            "position:relative;min-height:100vh;padding-left:",
            v.padL ?? "",
            "px;transition:padding-left .45s cubic-bezier(.23,1,.32,1)",
          ].join(""),
        ),
      },
      // The skip link is the first stop for keyboard visitors, ahead of the section rail.
      h(
        "a",
        { key: 41, className: "skip-link", href: "#main-content" },
        h(React.Fragment, { key: 42 }, "Skip to content"),
      ),
      " ",
      v.wide ? h(React.Fragment, { key: 5 }, " ", renderRail(v), " ") : null,
      " ",
      " ",
      " ",
      renderHeader(v),
      " ",
      h(DiscoveryConsole, { key: "discovery-console", routeId: v.discovery, onClose: v.closeDiscovery }),
      h(JourneyDock, { key: "journey-dock", active: v.activeSection }),
      h(
        "main",
        { key: 107, id: "main-content", tabIndex: "-1" },
        " ",
        " ",
        h(HeroSection, { v, key: "top" }),
        " ",
        " ",
        h(ContinuumPrinciples, { key: "principles-strip" }),
        h(EagleFilmSection, { v, key: "eagle-film" }),
        h(ReleaseHearing, { key: "release-hearing" }),
        // Creative work leads; the workshop's receipts and evidence follow for visitors who want the detail.
        h(WorldsSection, { v, key: "rooms" }),
        h(ShowcaseSection, { key: "showcase" }),
        " ",
        " ",
        h(
          JourneyDisclosure,
          {
            key: "films-collection",
            id: "films-collection",
            image: "/v40/thumbs/room-studios-threshold-320.webp",
            title: "Enter the screening room.",
            description: "The Sovereign, Roadster Studio, and the complete short film collection. Films start muted.",
          },
          h(FilmsSection, { v, key: "films" }),
        ),
        " ",
        " ",
        h(WorkshopSection, { v, key: "workshop" }),
        " ",
        " ",
        h(
          JourneyDisclosure,
          {
            key: "decision-story",
            id: "decision-story",
            image: "/v40/thumbs/room-principles-320.webp",
            title: "One document. A different boundary.",
            description: "Try a quick privacy decision and see the principle behind it.",
          },
          h(DecisionsSection, { v, key: "work" }),
        ),
        " ",
        " ",
        h(ExperimentsSection, { v, key: "studies" }),
        " ",
        " ",
        h(
          JourneyDisclosure,
          {
            key: "system-story",
            id: "system-story",
            image: "/v40/thumbs/room-starship-320.webp",
            title: "Follow a request through the lab.",
            description: "Explore the system map, from human intent to human review.",
          },
          h(MachinesSection, { v, key: "universe" }),
        ),
        " ",
        " ",
        h(EvidenceSection, { v, key: "evidence" }),
        " ",
        " ",
        h(OperatorSection, { v, key: "operator" }),
        " ",
        " ",
        h(ContactSection, { v, key: "contact" }),
        " ",
      ),
      " ",
      " ",
      renderFooter(v),
      " ",
      " ",
      v.cinemaOpen ? h(React.Fragment, { key: 1972 }, " ", renderCinema(v), " ") : null,
      " ",
      " ",
      v.alert
        ? h(
            React.Fragment,
            { key: 2017 },
            " ",
            h("div", {
              key: 2019,
              "aria-hidden": "true",
              className: "v41-ab7029070b",
            }),
            " ",
            h(
              "div",
              {
                key: 2021,
                role: "status",
                className: "v41-efe344152b",
              },
              " ",
              h(
                "span",
                {
                  key: 2023,
                  className: "v41-f78856783d",
                },
                h(React.Fragment, { key: 2024 }, "RED ALERT · AUTHORIZATION ACCEPTED"),
              ),
              " ",
              h(
                "span",
                {
                  key: 2026,
                  className: "v41-48ce9adfac",
                },
                h(React.Fragment, { key: 2027 }, "DEFIANT"),
              ),
              " ",
              h(
                "span",
                {
                  key: 2029,
                  className: "v41-fbe7d8490f",
                },
                h(React.Fragment, { key: 2030 }, "Admiral Cashio · gloves off · all hands to stations"),
              ),
              " ",
            ),
            " ",
          )
        : null,
      " ",
      v.warp
        ? h(
            React.Fragment,
            { key: 2034 },
            " ",
            h("div", {
              key: 2036,
              "aria-hidden": "true",
              className: "v41-c11f17ab63",
            }),
            " ",
          )
        : null,
      " ",
    ),
    " ",
  );
}

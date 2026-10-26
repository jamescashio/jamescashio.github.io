import React from "react";
import designSystem from "../design-system.js";
const h = React.createElement;

export function WorkshopSection({ v }) {
  return h(
    "section",
    {
      key: 295,
      id: "workshop",
      "data-screen-label": "Workshop",
      className: "v41-666dcca5e4",
    },
    " ",
    h(
      "div",
      { key: 297, className: "v41-022625b12b" },
      " ",
      h(
        "span",
        {
          key: 299,
          className: "v41-c904563b29",
        },
        h("span", { key: 300, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 301 }, "02")),
        h("span", { key: 302, "data-scramble": "" }, h(React.Fragment, { key: 303 }, "From the workshop")),
      ),
      " ",
      h(
        "h2",
        {
          key: 305,
          className: "v41-ebe245028e",
        },
        h(React.Fragment, { key: 306 }, "Built at home. Open to inspect."),
      ),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 309,
        "data-reveal": "",
        className: "v41-7f9ee20c68",
      },
      " ",
      h(
        designSystem.Panel,
        { key: 311, color: "cyan", title: "A BACKUP WITH A RECEIPT", icon: "▸" },
        " ",
        h(
          "div",
          { key: 313, className: "v41-84e5cd0cb2" },
          " ",
          h(
            "span",
            {
              key: 315,
              className: "v41-8f81cfc173",
            },
            h(React.Fragment, { key: 316 }, "Observed " + v.observedDate),
          ),
          " ",
          h(
            "h3",
            {
              key: 318,
              className: "v41-ceea826ff0",
            },
            h(React.Fragment, { key: 319 }, "A backup needs evidence."),
          ),
          " ",
          h(
            "p",
            {
              key: 321,
              className: "v41-23ab518947",
            },
            h(
              React.Fragment,
              { key: 322 },
              "A backup only counts if you can get your files back. This observation checks the integrity of the latest reported snapshots. A recovery rehearsal is a separate test.",
            ),
          ),
          " ",
          h(
            "div",
            {
              key: 324,
              className: "v41-34ba9fac5c",
            },
            " ",
            h(
              "span",
              {
                key: 326,
                className: "v41-ef07b9457a",
              },
              h(React.Fragment, { key: 327 }, String(v.snapshot.backup.latestVerified)),
            ),
            " ",
            h(
              "span",
              {
                key: 329,
                className: "v41-3c61ba9aa4",
              },
              h(React.Fragment, { key: 330 }, "latest reported snapshots passed their integrity check"),
            ),
            " ",
          ),
          " ",
          h(
            "ol",
            {
              key: 333,
              "aria-label": "The verification sequence",
              className: "v41-162ff373ab",
            },
            " ",
            h(
              "li",
              {
                key: 335,
                className: "v41-2f1ad2d9b8",
              },
              h("span", { key: 336, className: "v41-aab9b2719f" }, h(React.Fragment, { key: 337 }, "01")),
              h(React.Fragment, { key: 338 }, "Capture"),
            ),
            " ",
            h(
              "li",
              {
                key: 340,
                className: "v41-2f1ad2d9b8",
              },
              h("span", { key: 341, className: "v41-aab9b2719f" }, h(React.Fragment, { key: 342 }, "02")),
              h(React.Fragment, { key: 343 }, "Decrypt"),
            ),
            " ",
            h(
              "li",
              {
                key: 345,
                className: "v41-2f1ad2d9b8",
              },
              h("span", { key: 346, className: "v41-7608acb292" }, h(React.Fragment, { key: 347 }, "03")),
              h(React.Fragment, { key: 348 }, "Verify"),
            ),
            " ",
          ),
          " ",
          h(
            "p",
            {
              key: 351,
              className: "v41-d778e0c2b3",
            },
            h(
              React.Fragment,
              { key: 352 },
              "Observed " + v.observedDate + ". A new restore rehearsal was not performed.",
            ),
          ),
          " ",
          v.tech
            ? h(
                React.Fragment,
                { key: 354 },
                " ",
                h(
                  "p",
                  {
                    key: 356,
                    className: "v41-cb72f7ea66",
                  },
                  h(
                    "span",
                    {
                      key: 357,
                      className: "v41-c5c887fb10",
                    },
                    h(React.Fragment, { key: 358 }, "FOR ENGINEERS"),
                  ),
                  h(
                    React.Fragment,
                    { key: 359 },
                    "The encrypted archive was decrypted on a second host, 990 files were compared with the originals and the archive hash matched. This is file level verification, not a full system restore.",
                  ),
                ),
                " ",
              )
            : null,
          " ",
          h(
            "a",
            { key: 362, href: "#evidence", className: "v41-1f435cd084" },
            h(React.Fragment, { key: 363 }, "Read the repair and receipt →"),
          ),
          " ",
        ),
        " ",
      ),
      " ",
      h(
        designSystem.Panel,
        { key: 367, color: "accent", title: "A TOOL TO TAKE WITH YOU", icon: "▸" },
        " ",
        h(
          "div",
          { key: 369, className: "v41-84e5cd0cb2" },
          " ",
          h(
            "span",
            {
              key: 371,
              className: "v41-8f81cfc173",
            },
            h(React.Fragment, { key: 372 }, "Built October 3, 2026"),
          ),
          " ",
          h(
            "h3",
            {
              key: 374,
              className: "v41-ceea826ff0",
            },
            h(React.Fragment, { key: 375 }, "A brief worth keeping."),
          ),
          " ",
          h(
            "p",
            {
              key: 377,
              className: "v41-23ab518947",
            },
            h(
              React.Fragment,
              { key: 378 },
              "Choose what matters. Keep the sources and the unknowns attached. Take the decision brief with you.",
            ),
          ),
          " ",
          h(
            "div",
            {
              key: 380,
              role: "group",
              "aria-label": "The three parts of the example decision brief",
              className: "v41-d1d7b3db69",
            },
            " ",
            h(
              "span",
              {
                key: 382,
                className: "v41-2f2cda502f",
              },
              h(React.Fragment, { key: 383 }, "A DECISION BRIEF"),
            ),
            " ",
            h(
              "ol",
              {
                key: 385,
                className: "v41-9b0620f3ec",
              },
              " ",
              h(
                "li",
                {
                  key: 387,
                  className: "v41-2757805c22",
                },
                h("span", { key: 388, className: "v41-0bf2ff1a21" }, h(React.Fragment, { key: 389 }, "01")),
                h(
                  "span",
                  { key: 390 },
                  h(
                    "strong",
                    {
                      key: 391,
                      className: "v41-f209df4646",
                    },
                    h(React.Fragment, { key: 392 }, "What we observed"),
                  ),
                  h("br", { key: 393 }),
                  h(
                    "small",
                    { key: 394, className: "v41-ac93146db5" },
                    h(React.Fragment, { key: 395 }, "A source and a date."),
                  ),
                ),
              ),
              " ",
              h(
                "li",
                {
                  key: 397,
                  className: "v41-2757805c22",
                },
                h("span", { key: 398, className: "v41-0bf2ff1a21" }, h(React.Fragment, { key: 399 }, "02")),
                h(
                  "span",
                  { key: 400 },
                  h(
                    "strong",
                    {
                      key: 401,
                      className: "v41-f209df4646",
                    },
                    h(React.Fragment, { key: 402 }, "What we don’t know"),
                  ),
                  h("br", { key: 403 }),
                  h(
                    "small",
                    { key: 404, className: "v41-ac93146db5" },
                    h(React.Fragment, { key: 405 }, "The unknown stays visible."),
                  ),
                ),
              ),
              " ",
              h(
                "li",
                {
                  key: 407,
                  className: "v41-2757805c22",
                },
                h("span", { key: 408, className: "v41-0bf2ff1a21" }, h(React.Fragment, { key: 409 }, "03")),
                h(
                  "span",
                  { key: 410 },
                  h(
                    "strong",
                    {
                      key: 411,
                      className: "v41-f209df4646",
                    },
                    h(React.Fragment, { key: 412 }, "Who decides"),
                  ),
                  h("br", { key: 413 }),
                  h(
                    "small",
                    { key: 414, className: "v41-ac93146db5" },
                    h(React.Fragment, { key: 415 }, "A person keeps the final say."),
                  ),
                ),
              ),
              " ",
            ),
            " ",
            h(
              "span",
              {
                key: 418,
                className: "v41-0ff86a6e0f",
              },
              h(React.Fragment, { key: 419 }, "EXAMPLE · YOURS TO ASSEMBLE"),
            ),
            " ",
          ),
          " ",
          v.tech
            ? h(
                React.Fragment,
                { key: 422 },
                " ",
                h(
                  "p",
                  {
                    key: 424,
                    className: "v41-cb72f7ea66",
                  },
                  h(
                    "span",
                    {
                      key: 425,
                      className: "v41-c5c887fb10",
                    },
                    h(React.Fragment, { key: 426 }, "FOR ENGINEERS"),
                  ),
                  h(
                    React.Fragment,
                    { key: 427 },
                    "The brief is assembled in your browser from the choices you make. Each claim keeps its source and date, and open questions stay listed instead of being smoothed over.",
                  ),
                ),
                " ",
              )
            : null,
          " ",
          h(
            "div",
            { key: 430, className: "v41-822cce1f9a" },
            " ",
            h("a", { key: 432, href: "#experiment=briefing" }, h(React.Fragment, { key: 433 }, "Make your brief →")),
            " ",
            h(
              "a",
              { key: 435, href: "https://cashio.us/artifacts/decision-brief.txt" },
              h(React.Fragment, { key: 436 }, "Download an example ↓"),
            ),
            " ",
          ),
          " ",
        ),
        " ",
      ),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 442,
        "data-reveal": "",
        className: "v41-04194c311a",
      },
      " ",
      h(
        "div",
        {
          key: 444,
          className: "v41-f5f49d338b",
        },
        " ",
        h(
          "span",
          {
            key: 446,
            className: "v41-c904563b29",
          },
          h(React.Fragment, { key: 447 }, "At a glance"),
        ),
        " ",
        h(
          "span",
          { key: 449, className: "v41-de30e42b19" },
          h(
            React.Fragment,
            { key: 450 },
            "A hobby lab and proof of work. A technology career since 1996, with more than twenty years in cybersecurity.",
          ),
        ),
        " ",
      ),
      " ",
      h(
        "div",
        {
          key: 453,
          className: ["za-card-hover", "v41-cc5d1d2bb4"].filter(Boolean).join(" "),
          "data-tilt": "6",
        },
        " ",
        h(
          "span",
          {
            key: 455,
            className: "v41-27ebdcc213",
          },
          h(React.Fragment, { key: 456 }, "By day"),
        ),
        " ",
        h(
          "strong",
          { key: 458, className: "v41-0f4196dcd0" },
          h(React.Fragment, { key: 459 }, "Security for the MSP channel"),
        ),
        " ",
        h(
          "span",
          { key: 461, className: "v41-0d1ee44b60" },
          h(
            React.Fragment,
            { key: 462 },
            "Principal Solutions Consultant, helping managed service providers deliver security and cloud services.",
          ),
        ),
        " ",
        h(
          "a",
          {
            key: 464,
            href: "https://www.linkedin.com/in/dougcashio/",
            className: "v41-69ee90bfb1",
          },
          h(React.Fragment, { key: 465 }, "Career history on LinkedIn ↗"),
        ),
        " ",
      ),
      " ",
      h(
        "div",
        {
          key: 468,
          className: ["za-card-hover", "v41-cc5d1d2bb4"].filter(Boolean).join(" "),
          "data-tilt": "6",
        },
        " ",
        h(
          "span",
          {
            key: 470,
            className: "v41-27ebdcc213",
          },
          h(React.Fragment, { key: 471 }, "By night"),
        ),
        " ",
        h("strong", { key: 473, className: "v41-0f4196dcd0" }, h(React.Fragment, { key: 474 }, "My lab after hours")),
        " ",
        h(
          "span",
          { key: 476, className: "v41-0d1ee44b60" },
          h(React.Fragment, { key: 477 }, "Two servers I own, a job scheduler, and the experiments you can try here."),
        ),
        " ",
        h(
          "a",
          { key: 479, href: "#evidence", className: "v41-69ee90bfb1" },
          h(React.Fragment, { key: 480 }, "See the dated record ↓"),
        ),
        " ",
      ),
      " ",
      h(
        "div",
        {
          key: 483,
          className: ["za-card-hover", "v41-cc5d1d2bb4"].filter(Boolean).join(" "),
          "data-tilt": "6",
        },
        " ",
        h(
          "span",
          {
            key: 485,
            className: "v41-27ebdcc213",
          },
          h(React.Fragment, { key: 486 }, "In the open"),
        ),
        " ",
        h("strong", { key: 488, className: "v41-0f4196dcd0" }, h(React.Fragment, { key: 489 }, "Work you can inspect")),
        " ",
        h(
          "span",
          { key: 491, className: "v41-0d1ee44b60" },
          h(React.Fragment, { key: 492 }, "Change the inputs, explore the worlds, and see what happens."),
        ),
        " ",
        h(
          "div",
          {
            key: 494,
            className: "v41-aa27d53b57",
          },
          h(
            "a",
            { key: 495, href: "https://github.com/jamescashio/jamescashio.github.io" },
            h(React.Fragment, { key: 496 }, "Read the source ↗"),
          ),
          h("a", { key: 497, href: "#rooms" }, h(React.Fragment, { key: 498 }, "Explore the Studios →")),
        ),
        " ",
      ),
      " ",
      h(
        "div",
        {
          key: 501,
          className: "v41-898d7bef31",
        },
        " ",
        h(
          "div",
          { key: 503, className: "v41-0fbf9e859f" },
          " ",
          h(
            "span",
            {
              key: 505,
              className: "v41-27ebdcc213",
            },
            h(React.Fragment, { key: 506 }, "What runs here"),
          ),
          " ",
          h(
            "p",
            {
              key: 508,
              className: "v41-a830b81bea",
            },
            h(
              React.Fragment,
              { key: 509 },
              "Zeus and Apollo are my two servers. Hermes schedules jobs; Atlas is a local model. The experiments below illustrate the routing rules. The dated evidence shows what was actually observed.",
            ),
          ),
          " ",
          h(
            "p",
            {
              key: 511,
              className: "v41-a830b81bea",
            },
            h(
              React.Fragment,
              { key: 512 },
              "Everything you try here runs in your browser; nothing reaches my servers. The evidence section answers from a dated record, and a small copilot marks where a person holds authority.",
            ),
          ),
          " ",
        ),
        " ",
        h(
          "details",
          { key: 515, className: "v41-89086d4ee3" },
          " ",
          h(
            "summary",
            {
              key: 517,
              className: "v41-dd838bc87b",
            },
            h(React.Fragment, { key: 518 }, "Every name on this page, in plain English "),
            h("span", { key: 519 }, h(React.Fragment, { key: 520 }, "▾")),
          ),
          " ",
          h(
            "dl",
            {
              key: 522,
              className: "v41-df1691d0d7",
            },
            " ",
            h(
              "dt",
              {
                key: 524,
                className: "v41-e32bffc290",
              },
              h(React.Fragment, { key: 525 }, "Bit"),
            ),
            h(
              "dd",
              { key: 526, className: "v41-55ebc647f3" },
              h(React.Fragment, { key: 527 }, "The gold copilot. It marks where a person holds authority."),
            ),
            " ",
            h(
              "dt",
              {
                key: 529,
                className: "v41-e32bffc290",
              },
              h(React.Fragment, { key: 530 }, "E.V.E."),
            ),
            h(
              "dd",
              { key: 531, className: "v41-55ebc647f3" },
              h(
                React.Fragment,
                { key: 532 },
                "The Evaluation Verification Engine. A console for dated observations and clearly labeled lore.",
              ),
            ),
            " ",
            h(
              "dt",
              {
                key: 534,
                className: "v41-e32bffc290",
              },
              h(React.Fragment, { key: 535 }, "HERMES"),
            ),
            h(
              "dd",
              { key: 536, className: "v41-55ebc647f3" },
              h(
                React.Fragment,
                { key: 537 },
                "My job scheduler. The first experiment below shows how a routing policy chooses where work goes.",
              ),
            ),
            " ",
            h(
              "dt",
              {
                key: 539,
                className: "v41-e32bffc290",
              },
              h(React.Fragment, { key: 540 }, "DSH"),
            ),
            h(
              "dd",
              { key: 541, className: "v41-55ebc647f3" },
              h(React.Fragment, { key: 542 }, "My operator console, where I run everything from."),
            ),
            " ",
            h(
              "dt",
              {
                key: 544,
                className: "v41-e32bffc290",
              },
              h(React.Fragment, { key: 545 }, "Zeus and Apollo"),
            ),
            h("dd", { key: 546, className: "v41-55ebc647f3" }, h(React.Fragment, { key: 547 }, "My two servers.")),
            " ",
            h(
              "dt",
              {
                key: 549,
                className: "v41-e32bffc290",
              },
              h(React.Fragment, { key: 550 }, "Atlas"),
            ),
            h(
              "dd",
              { key: 551, className: "v41-55ebc647f3" },
              h(React.Fragment, { key: 552 }, "The local model that handles recurring work."),
            ),
            " ",
            h(
              "dt",
              {
                key: 554,
                className: "v41-e32bffc290",
              },
              h(React.Fragment, { key: 555 }, "cAshIo"),
            ),
            h(
              "dd",
              { key: 556, className: "v41-55ebc647f3" },
              h(
                React.Fragment,
                { key: 557 },
                "Cashio, with the AI in capitals. My personal AI workspace, and the name on this site. Its page is linked in the footer.",
              ),
            ),
            " ",
            h(
              "dt",
              {
                key: 559,
                className: "v41-e32bffc290",
              },
              h(React.Fragment, { key: 560 }, "Mostly Harmless"),
            ),
            h(
              "dd",
              { key: 561, className: "v41-55ebc647f3" },
              h(
                React.Fragment,
                { key: 562 },
                "The name of this site’s visual edition. Each evidence record keeps its own date.",
              ),
            ),
            " ",
            h(
              "dt",
              {
                key: 564,
                className: "v41-e32bffc290",
              },
              h(React.Fragment, { key: 565 }, "Workhorse, Research, Synthesis"),
            ),
            h(
              "dd",
              { key: 566, className: "v41-55ebc647f3" },
              h(
                React.Fragment,
                { key: 567 },
                "Routes for everyday drafting, sourced research and combining information.",
              ),
            ),
            " ",
          ),
          " ",
        ),
        " ",
      ),
      " ",
      h(
        "p",
        {
          key: 572,
          className: "v41-a50df42006",
        },
        h("span", { key: 573 }, h(React.Fragment, { key: 574 }, "Open to speaking, mentoring and comparing notes.")),
        h(
          "a",
          { key: 575, href: "#contact", className: "v41-6e8bcfac8d" },
          h(React.Fragment, { key: 576 }, "Say hello →"),
        ),
        h(
          "a",
          {
            key: 577,
            href: "https://www.credly.com/users/james-cashio/badges/credly",
            className: "v41-6e8bcfac8d",
          },
          h(React.Fragment, { key: 578 }, "Certifications on Credly ↗"),
        ),
      ),
      " ",
    ),
    " ",
  );
}

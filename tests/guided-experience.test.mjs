import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { ARTICLES } from "../src/lib/content.ts";
import { BUILD_STORIES, ROUTE_EXAMPLES } from "../src/lib/build-stories.ts";
import { parseDeckHash } from "../src/lib/deck-navigation.ts";
import { createProofCardSvg, publicBuildUrl, safeArticleIndex } from "../src/lib/proof-card.ts";

test("proof cards always link to the correct public build, including invalid selections", () => {
  for (const index of [NaN, Infinity, -12, 0, 1, 2, 3, 4, 5, 6, 100, 3.9]) {
    const url = new URL(publicBuildUrl(index));
    assert.equal(url.origin, "https://cashio.us");
    assert.equal(url.search, "");
    assert.deepEqual(parseDeckHash(url.hash), { deck: 5, article: safeArticleIndex(index) });
  }
});

test("all seven share cards are self-contained, parseable SVGs with truthful provenance", () => {
  assert.equal(BUILD_STORIES.length, ARTICLES.length);
  for (const [index, article] of ARTICLES.entries()) {
    const dom = new JSDOM(createProofCardSvg(index), { contentType: "image/svg+xml" });
    const doc = dom.window.document;
    assert.equal(doc.documentElement.getAttribute("viewBox"), "0 0 1200 630");
    assert.ok(doc.querySelector("title").textContent.includes(article.name));
    assert.ok(doc.querySelector("desc").textContent.includes(BUILD_STORIES[index].outcome));
    assert.equal(doc.querySelectorAll("script, foreignObject, image").length, 0);
    assert.equal(doc.querySelectorAll("[href], [onload], [onclick]").length, 0);
    assert.match(doc.documentElement.textContent, /DATED, NOT LIVE/);
    assert.match(doc.documentElement.textContent, /OWNER-DESCRIBED BUILD/);
    dom.window.close();
  }
});

test("illustrative requests exercise distinct outcomes and hold confidential input for review", () => {
  assert.equal(new Set(ROUTE_EXAMPLES.map((example) => example.lane)).size, 3);
  for (const example of ROUTE_EXAMPLES) {
    assert.equal(example.checks.length, 5);
    assert.ok(example.reason.length > 25);
  }
  const privateRequest = ROUTE_EXAMPLES.find((example) => example.name === "Handle private data");
  assert.equal(privateRequest.lane, "HUMAN REVIEW");
  assert.match(privateRequest.checks[1], /stops egress/);
  assert.match(privateRequest.response, /Request held/);
});

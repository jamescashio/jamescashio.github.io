# Cashio mission refinement

This preservation pass brings the flight invitation forward on phones, improves the existing ship's materials and lighting, and lets visitors download an illustrated mission card containing their actual demonstration settings and twelve-request outcome. It retains the original art, Bit, typefaces, palette, studies and legacy routes.

The HERMES operating note describes a recorded decision: replace older presentation claims with the reviewed 7 September inventory while leaving unverified routing claims explicit. Its numbers come from a frozen public snapshot so future observations cannot silently rewrite the case. The original model citations now point to the V37.11 commit they describe.

Utility labels are larger throughout the opening, flight, films and Observatory. Scene controls have their own space, and text over the mobile artwork has a dark backing. The mission-card button retains keyboard focus during export. A failed clipboard action reveals a selectable scene link.

## Privacy and delivery

On 8 September 2026 the owner explicitly requested disabling Cloudflare's injected Web Analytics for cashio.us. The setting changed from “Enable, excluding visitor data in the EU” to “Disable.” The selected setting persisted after reloading the authenticated dashboard; a fresh public page contained no analytics beacon or analytics request. The site's Content Security Policy remains unchanged.

The privacy notice describes browser-local scene downloads and is linked from the footer. The site does not upload mission cards or send AI requests from its demonstrations.

## Release and rollback

The owner approved publishing the reviewed preview as V37.12 on 8 September 2026. Its source baseline is V37.11 commit `0c509286ed9329b897741e1afe505376deb443ce`. The preserved local preview remains separate; [release validation and rollback](polished-release.md) describe the production promotion.

The isolated source patch can be reversed to restore the baseline; the earlier preview is preserved separately. The analytics setting has its own rollback: restore “Enable, excluding visitor data in the EU” under Web Analytics → cashio.us → Manage site, then update. That would restore the previous policy conflict and should only be done intentionally.

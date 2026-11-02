
export const resources = {
  r_public_assets_zenith_celestial_signature_poster_webp: "/v40/assets/zenith-celestial-signature-poster.webp",
  r_public_assets_zenith_armillary_nocturne_poster_webp: "/v40/assets/zenith-armillary-nocturne-poster.webp",
  r_public_assets_zenith_armillary_detail_poster_webp: "/v40/assets/zenith-armillary-detail-poster.webp",
  r_public_assets_zenith_starship_blue_hour_poster_webp: "/v40/assets/zenith-starship-blue-hour-poster.webp",
  r_public_v38_assets_room_heritage_webp: "/v40/assets/room-heritage.webp",
  r_public_assets_zenith_orbital_dust_poster_webp: "/v40/assets/zenith-orbital-dust-poster.webp",
  r_public_assets_zenith_quiet_intelligence_poster_webp: "/v40/assets/zenith-quiet-intelligence-poster.webp",
  r_public_assets_zenith_the_long_view_poster_webp: "/v40/assets/zenith-the-long-view-poster.webp",
  r_public_assets_zenith_lamplight_prototype_poster_webp: "/v40/assets/zenith-lamplight-prototype-poster.webp",
  r_public_assets_zenith_portal_arrival_poster_webp: "/v40/assets/zenith-portal-arrival-poster.webp",
  r_public_v38_assets_room_starship_webp: "/v40/assets/room-starship.webp",
  r_public_assets_zenith_starship_flyby_poster_webp: "/v40/assets/zenith-starship-flyby-poster.webp",
  r_public_v38_assets_room_studios_threshold_webp: "/v40/assets/room-studios-threshold.webp",
  r_public_assets_zenith_starship_dockside_poster_webp: "/v40/assets/zenith-starship-dockside-poster.webp",
  r_public_assets_zenith_threshold_poster_webp: "/v40/assets/zenith-threshold-poster.webp",
  r_public_assets_zenith_ringed_horizon_poster_webp: "/v40/assets/zenith-ringed-horizon-poster.webp",
  r_public_v38_assets_room_principles_webp: "/v40/assets/room-principles.webp",
  r_public_assets_zenith_workshop_after_hours_poster_webp: "/v40/assets/zenith-workshop-after-hours-poster.webp",
  r_public_assets_zenith_orbital_instrument_poster_webp: "/v40/assets/zenith-orbital-instrument-poster.webp",
  r_public_assets_celestial_helios_arrival_poster_jpg: "/v40/assets/celestial-arrival-poster.webp",
};
export const thumbnailSources = (path) =>
  [320, 640, 1280]
    .map(
      (width) =>
        `/v40/thumbs/${path
          .split("/")
          .pop()
          .replace(/\.webp$/, "")}-${width}.webp ${width}w`,
    )
    .join(", ");

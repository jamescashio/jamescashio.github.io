import type { MeshStandardMaterial, Vector3 } from "three";

/** Analytic occlusion for a radius-three world centered in the Observatory. */
export function applyPlanetShadow(material: MeshStandardMaterial, sunDirection: { value: Vector3 }) {
  const finish = material.onBeforeCompile;
  const cacheKey = material.customProgramCacheKey();
  material.onBeforeCompile = function (shader, renderer) {
    finish.call(this, shader, renderer);
    shader.uniforms.planetSunDirection = sunDirection;
    shader.vertexShader =
      "varying vec3 vPlanetShadowWorld;\n" +
      shader.vertexShader.replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
      vec4 shadowPoint = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        shadowPoint = instanceMatrix * shadowPoint;
      #endif
      vPlanetShadowWorld = (modelMatrix * shadowPoint).xyz;`,
      );
    shader.fragmentShader =
      "varying vec3 vPlanetShadowWorld; uniform vec3 planetSunDirection;\n" +
      shader.fragmentShader.replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
      vec3 ray = normalize(planetSunDirection);
      float ahead = max(0.0, -dot(vPlanetShadowWorld, ray));
      float clearance = length(vPlanetShadowWorld + ray * ahead);
      float penumbra = 0.055 + ahead * 0.025;
      float sunlightVisibility = smoothstep(3.0-penumbra, 3.0+penumbra, clearance);
      reflectedLight.directDiffuse *= mix(0.20, 1.0, sunlightVisibility);
      reflectedLight.directSpecular *= mix(0.10, 1.0, sunlightVisibility);`,
      );
  };
  material.customProgramCacheKey = () => `${cacheKey}:perspective-planet-shadow-v1`;
}

export const planetVertex = `
  varying vec3 vSurface; varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv;
  void main() {
    vUv = uv;
    vSurface = normalize(position);
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const planetFragment = `
  uniform vec3 sunDirection; uniform vec3 atmosphereColor;
  uniform float eclipse; uniform float ion; uniform float phase; uniform float cloudAmount;
  uniform sampler2D surfaceAtlas;
  varying vec3 vSurface; varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv;
  float cloudCover(float value) {
    return pow(value,1.5-cloudAmount*0.5)*min(cloudAmount,1.0);
  }
  void main() {
    vec3 p = normalize(vSurface), normal = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorld);
    vec4 surface = texture2D(surfaceAtlas, vUv);
    float altitude = surface.r;
    float land = smoothstep(0.509, 0.517, altitude);
    float coast = smoothstep(0.488, 0.514, altitude);
    float latitude = abs(p.y);
    vec3 ocean = mix(vec3(0.003,0.011,0.027), vec3(0.009,0.078,0.095), coast);
    vec3 ground = mix(vec3(0.040,0.090,0.055), vec3(0.23,0.16,0.075), smoothstep(0.514,0.67,altitude));
    ground = mix(ground, vec3(0.33,0.25,0.14), smoothstep(0.65,0.78,altitude));
    ground *= 0.69 + surface.g * 0.49;
    float ice = smoothstep(0.88,0.985,latitude + (altitude - 0.5) * 0.08);
    ground = mix(ground, vec3(0.46,0.53,0.55), ice * 0.82);
    vec3 albedo = mix(ocean, ground, land);
    float clouds = cloudCover(texture2D(surfaceAtlas, vUv + vec2(phase * 0.00065,0.0)).b);
    // Derivative relief responds to the actual light and camera. The ocean stays
    // smooth while mountain ranges break the terminator into minute lit ridges.
    float relief = (max(altitude - 0.512,0.0) * 0.10 + surface.g * 0.004) * land;
    vec3 dx = dFdx(vWorld), dy = dFdy(vWorld);
    vec3 rx = cross(dy,normal), ry = cross(normal,dx);
    float determinant = dot(dx,rx);
    vec3 gradient = sign(determinant) * (dFdx(relief) * rx + dFdy(relief) * ry);
    vec3 terrainNormal = normalize(normal - gradient / max(abs(determinant), 0.000001));
    vec3 light = normalize(sunDirection);
    float incidence = dot(normal,light);
    float day = smoothstep(-0.085,0.14,incidence);
    float diffuse = max(dot(terrainNormal,light),0.0);
    vec3 sunlight = mix(vec3(1.15,0.97,0.78),vec3(0.70,1.03,1.22),ion);
    vec3 color = albedo * (vec3(0.018,0.032,0.052) + sunlight * diffuse * 1.35);
    float cloudShadow = cloudCover(texture2D(surfaceAtlas,vUv + vec2(phase * 0.00065 - 0.0018,0.0012)).b);
    color *= 1.0 - cloudShadow * day * 0.23;
    // Cloud relief uses the already sampled cloud field. No new texture lookup
    // or rendering pass: the illuminated folds now follow the sun direction.
    vec3 cloudGradient = sign(determinant) * (dFdx(clouds) * rx + dFdy(clouds) * ry) * 0.016;
    vec3 cloudNormal = normalize(normal - cloudGradient / max(abs(determinant), 0.000001));
    float cloudLight = max(dot(cloudNormal,light),0.0);
    vec3 cloudColor = mix(vec3(0.35,0.48,0.61),vec3(0.86,0.88,0.83),day);
    color = mix(color,cloudColor * (0.018 + cloudLight * 1.2),clouds * 0.76);
    float specular = pow(max(dot(reflect(-light,normal),view),0.0),92.0);
    color += vec3(0.65,0.85,1.0) * specular * (1.0-land) * (1.0-clouds) * day * 0.48;
    float rim = pow(1.0-max(dot(normal,view),0.0),5.4);
    float airMass = pow(1.0-max(dot(normal,view),0.0),2.4) * day;
    color = mix(color,atmosphereColor * (0.12 + max(incidence,0.0) * 0.24),airMass * 0.19);
    color += atmosphereColor * rim * (0.035 + day * 0.4 + eclipse * 0.09);
    float dusk = exp(-abs(incidence) * 14.0) * (1.0-eclipse);
    color += vec3(0.56,0.18,0.055) * dusk * rim * 0.2;
    color += mix(vec3(0.9,0.43,0.11),vec3(0.1,0.74,1.0),ion) * surface.a * land * (1.0-day) * (1.0-clouds) * 0.7;
    gl_FragColor = vec4(color,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const atmosphereFragment = `
  uniform vec3 sunDirection; uniform vec3 atmosphereColor; uniform float eclipse; uniform float resonance;
  varying vec3 vWorld; varying vec3 vNormal;
  void main() {
    vec3 normal=normalize(vNormal), view=normalize(cameraPosition-vWorld);
    float incidence=dot(normal,normalize(sunDirection));
    float grazing=1.0-abs(dot(normal,view));
    float rim=pow(grazing,5.8);
    float day=smoothstep(-0.12,0.55,incidence);
    float twilight=exp(-abs(incidence)*9.0);
    vec3 color=mix(atmosphereColor,vec3(1.0,0.44,0.13),twilight*(0.4+eclipse*0.25));
    float highAir=pow(grazing,12.0)*(0.055+day*0.17);
    float energized=smoothstep(0.4,0.95,resonance)*smoothstep(0.54,0.9,abs(normal.y));
    color=mix(color,vec3(0.20,1.0,0.79),energized*0.42);
    gl_FragColor=vec4(color,rim*(0.035+day*0.34+eclipse*0.12+energized*0.24)+highAir);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const exosphereFragment = `
  uniform vec3 sunDirection; uniform vec3 atmosphereColor;
  uniform float eclipse; uniform float ion; uniform float resonance;
  varying vec3 vWorld; varying vec3 vNormal;
  void main() {
    vec3 normal=normalize(vNormal), view=normalize(cameraPosition-vWorld);
    float incidence=dot(normal,normalize(sunDirection));
    float grazing=1.0-abs(dot(normal,view));
    float day=smoothstep(-0.18,0.65,incidence);
    float sunset=exp(-abs(incidence+0.07)*10.0);
    float thinAir=pow(grazing,9.0);
    float polar=smoothstep(0.57,0.94,abs(normal.y));
    float charged=smoothstep(0.48,1.0,resonance);
    vec3 color=mix(atmosphereColor,vec3(0.30,0.48,1.0),0.32);
    color=mix(color,vec3(0.98,0.51,0.20),sunset*(0.35+eclipse*0.25));
    color=mix(color,mix(vec3(0.10,0.90,0.76),vec3(0.13,0.70,1.0),ion),polar*charged*0.5);
    gl_FragColor=vec4(color,thinAir*(0.012+day*0.13+eclipse*0.07+polar*charged*0.13));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const resonanceTrackFragment = `
  uniform float resonance; uniform float phase; uniform float ion;
  varying vec2 vUv;
  void main() {
    float charge=smoothstep(0.0,0.46,resonance);
    float angle=fract(vUv.x+0.25);
    float filled=1.0-smoothstep(charge-0.012,charge+0.005,angle);
    filled*=smoothstep(0.0,0.035,charge);
    float leader=exp(-abs(angle-charge)*160.0)*(1.0-smoothstep(0.93,1.0,charge));
    float inlay=0.68+0.32*pow(0.5+0.5*cos(angle*301.5929),3.0);
    // Once the finite charge closes, two separated currents circulate along
    // the actual inlay. Time is the renderer's existing pause-aware clock.
    float settled=smoothstep(0.48,0.9,resonance);
    float wave=fract(angle*2.0-phase*0.045);
    float current=pow(1.0-wave,12.0)*settled;
    float wake=pow(1.0-wave,2.5)*settled;
    vec3 color=mix(vec3(0.16,0.78,1.0),vec3(0.31,1.0,0.83),ion);
    color=mix(color,vec3(1.0,0.84,0.53),min(1.0,leader*0.9+current*0.7));
    gl_FragColor=vec4(color*(0.78+leader*0.65+current*0.42),filled*inlay*(0.47+wake*0.28+current*0.24)+leader*0.7);
    #include <colorspace_fragment>
  }
`;

export const auroraVertex = `
  uniform float phase;
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal;
  void main() {
    vUv=uv;
    vec3 normal=normalize(position);
    float drift=sin(uv.x*37.6991+phase*0.24)*0.028+sin(uv.x*81.6814-phase*0.17)*0.013;
    vec3 displaced=position+normal*drift*uv.y;
    vec4 world=modelMatrix*vec4(displaced,1.0);
    vWorld=world.xyz;
    vNormal=normalize(mat3(modelMatrix)*normal);
    gl_Position=projectionMatrix*viewMatrix*world;
  }
`;

export const auroraFragment = `
  uniform float resonance; uniform float phase; uniform float ion; uniform float eclipse;
  uniform float auroraStrength;
  uniform vec3 sunDirection;
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal;
  void main() {
    float reveal=smoothstep(0.34,0.98,resonance);
    float longitude=vUv.x*6.283185;
    float fold=longitude+sin(longitude*5.0+phase*0.14)*0.06+vUv.y*0.06;
    float broad=0.5+0.5*sin(fold*13.0+sin(fold*7.0)*1.4-phase*0.16);
    float fine=0.5+0.5*sin(fold*137.0+sin(fold*31.0)*2.0+vUv.y*1.6);
    float foldedHeight=clamp(vUv.y/(0.6+broad*0.4),0.0,1.0);
    float filaments=0.12+pow(broad,1.7)*0.39+pow(fine,5.0)*0.49;
    float edge=pow(1.0-foldedHeight,1.25)*smoothstep(0.0,0.035,vUv.y);
    float crown=exp(-abs(vUv.y-0.075)*34.0);
    float traveling=pow(0.5+0.5*cos(longitude*2.0-phase*0.28-vUv.y*1.2),6.0);
    float light=dot(normalize(vNormal),normalize(sunDirection));
    float night=1.0-smoothstep(-0.35,0.7,light);
    vec3 base=mix(vec3(0.09,0.92,0.76),vec3(0.12,0.71,1.0),ion);
    vec3 color=mix(base,vec3(0.37,0.46,0.95),smoothstep(0.18,0.85,foldedHeight)*0.72);
    color+=vec3(0.72,0.52,0.20)*crown*(0.34+traveling*0.32);
    float alpha=(filaments*edge*(0.46+night*0.25+eclipse*0.06+traveling*0.18)+crown*0.18)*reveal;
    gl_FragColor=vec4(color,clamp(alpha*auroraStrength,0.0,0.95));
    #include <colorspace_fragment>
  }
`;

export const propulsionVertex = `
  varying vec2 vUv;
  void main() {
    vUv=uv;
    gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);
  }
`;

export const propulsionFragment = `
  uniform float phase; uniform float ion; varying vec2 vUv;
  void main() {
    float throat=pow(vUv.y,1.6);
    float compression=0.84+0.16*cos(vUv.y*24.0-phase*2.8);
    vec3 color=mix(vec3(0.04,0.42,1.0),vec3(0.13,0.97,1.0),vUv.y+ion*0.14);
    color=mix(color,vec3(0.87,0.98,1.0),pow(vUv.y,7.0));
    gl_FragColor=vec4(color,throat*compression*0.72);
    #include <colorspace_fragment>
  }
`;

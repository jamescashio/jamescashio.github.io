const canvas = document.createElement('canvas');
canvas.id = 'webgl-starfield';
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100vw';
canvas.style.height = '100vh';
canvas.style.zIndex = '0';
canvas.style.pointerEvents = 'none';

const existingStarfield = document.querySelector('.starfield');
if (existingStarfield) {
  existingStarfield.parentNode.replaceChild(canvas, existingStarfield);
} else {
  document.body.insertBefore(canvas, document.body.firstChild);
}

const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
  console.error('WebGL not supported, falling back to CSS starfield.');
  const div = document.createElement('div');
  div.className = 'starfield';
  canvas.parentNode.replaceChild(div, canvas);
} else {
  const vertexShaderSource = `
    attribute vec3 a_position;
    attribute float a_size;
    attribute float a_alpha;
    varying float v_alpha;
    uniform mat4 u_matrix;
    void main() {
      gl_Position = u_matrix * vec4(a_position, 1.0);
      gl_PointSize = a_size;
      v_alpha = a_alpha;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    varying float v_alpha;
    void main() {
      float r = 0.0, delta = 0.0, alpha = 1.0;
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      r = dot(cxy, cxy);
      if (r > 1.0) discard;
      delta = exp(-10.0 * r);
      gl_FragColor = vec4(0.8, 0.9, 1.0, delta * v_alpha);
    }
  `;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const numStars = 2800;
  const positions = new Float32Array(numStars * 3);
  const sizes = new Float32Array(numStars);
  const alphas = new Float32Array(numStars);
  const phases = new Float32Array(numStars);

  for (let i = 0; i < numStars; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 4.0;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 4.0;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
    sizes[i] = Math.random() * 2.5 + 0.5;
    alphas[i] = Math.random() * 0.5 + 0.3;
    phases[i] = Math.random() * Math.PI * 2.0;
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const sizeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);

  const alphaBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.DYNAMIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const sizeLocation = gl.getAttribLocation(program, 'a_size');
  const alphaLocation = gl.getAttribLocation(program, 'a_alpha');
  const matrixLocation = gl.getUniformLocation(program, 'u_matrix');

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(sizeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
  gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(alphaLocation);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let time = 0;
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function render() {
    time += 0.01;
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const aspect = canvas.width / canvas.height;
    const matrix = new Float32Array([
      1.0/aspect, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      mouseX * 0.1, mouseY * 0.1, 0, 1
    ]);

    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    for (let i = 0; i < numStars; i++) {
      alphas[i] = Math.sin(time + phases[i]) * 0.3 + 0.5;

      // Drift
      positions[i * 3] -= 0.0005;
      positions[i * 3 + 1] -= 0.0005;

      if (positions[i * 3] < -2.0) positions[i * 3] = 2.0;
      if (positions[i * 3 + 1] < -2.0) positions[i * 3 + 1] = 2.0;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);

    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, numStars);

    if (Math.random() < 0.005) { const starX = Math.random(); const starY = Math.random(); if (typeof playLCARSSound !== "undefined") { playLCARSSound("whoosh", starX, starY); } }

    requestAnimationFrame(render);
  }

  render();
}

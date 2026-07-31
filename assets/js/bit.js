/* Bit — ported from the cashio.us deck-guide canvas renderer
   (index.html: bitBaseVertices / bitBaseFaces / bitYesGeometry / buildBitStellation /
   bitPalette / drawBitCanvas). Constants match the source. window.ZABit */
(function () {
  var PHI = (1 + Math.sqrt(5)) / 2;

  function norm(v) {
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }

  var bitBaseVertices = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
  ].map(norm);

  var bitBaseFaces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];

  var bitYesGeometry = {
    vertices: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
    faces: [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]]
  };

  function buildBitStellation(spike) {
    var vertices = bitBaseVertices.map(function (vertex) { return vertex.slice(); });
    var faces = [];
    bitBaseFaces.forEach(function (face) {
      var a = bitBaseVertices[face[0]];
      var b = bitBaseVertices[face[1]];
      var c = bitBaseVertices[face[2]];
      var apex = norm([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]);
      var apexIndex = vertices.length;
      vertices.push([apex[0] * spike, apex[1] * spike, apex[2] * spike]);
      faces.push([face[0], face[1], apexIndex], [face[1], face[2], apexIndex], [face[2], face[0], apexIndex]);
    });
    return { vertices: vertices, faces: faces };
  }

  var bitNoGeometry = buildBitStellation(1.78);

  function bitPalette(state) {
    if (state === 'yes') return { base: [255, 204, 24], edge: [255, 248, 176], glow: 'rgba(255,204,0,0.5)' };
    if (state === 'no') return { base: [255, 24, 58], edge: [255, 154, 170], glow: 'rgba(255,0,51,0.52)' };
    return { base: [38, 205, 236], edge: [200, 252, 255], glow: 'rgba(0,249,255,0.46)' };
  }

  function rotateBitVertex(vertex, rotateX, rotateY) {
    var cosY = Math.cos(rotateY), sinY = Math.sin(rotateY);
    var cosX = Math.cos(rotateX), sinX = Math.sin(rotateX);
    var x = vertex[0] * cosY + vertex[2] * sinY;
    var z1 = vertex[2] * cosY - vertex[0] * sinY;
    var y = vertex[1] * cosX - z1 * sinX;
    var z = vertex[1] * sinX + z1 * cosX;
    return [x, y, z];
  }

  var canvas = null, ctx = null, size = 0, center = 0, baseRadius = 0;
  var state = 'idle', bitAngle = 0, lastTs = 0, raf = 0, still = false;

  function resize() {
    if (!ctx || !canvas) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    size = Math.max(1, canvas.clientWidth || 96);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    center = size / 2;
    baseRadius = size * 0.24;
  }

  function draw(now, advance) {
    if (!ctx || !canvas) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var want = Math.round((canvas.clientWidth || 96) * dpr);
    if (!size || (want && Math.abs(canvas.width - want) > 1)) resize();

    if (advance) {
      var elapsed = lastTs ? Math.min(80, Math.max(0, now - lastTs)) : 42;
      bitAngle += elapsed * (state === 'no' ? 0.0027 : state === 'yes' ? 0.0014 : 0.00105);
    }
    lastTs = now;

    var pulse = 0.5 + 0.5 * Math.sin(now * 0.0022);
    var palette = bitPalette(state);
    var geometry = state === 'yes' ? bitYesGeometry
      : state === 'no' ? bitNoGeometry
      : buildBitStellation(1.08 + pulse * 0.24);

    var rotateX = -0.52 + Math.sin(bitAngle * 0.72) * 0.13;
    if (state === 'no') rotateX += Math.sin(bitAngle * 9) * 0.1;
    var radius = baseRadius * (state === 'yes' ? 1.3 : state === 'no' ? 0.96 : 1);
    var focal = 5.2;

    var points3d = geometry.vertices.map(function (vertex) { return rotateBitVertex(vertex, rotateX, bitAngle); });
    var project = function (point) {
      var scale = focal / (focal + point[2]);
      return [center + point[0] * radius * scale, center + point[1] * radius * scale];
    };

    ctx.clearRect(0, 0, size, size);
    var halo = ctx.createRadialGradient(center, center, 1, center, center, size * 0.5);
    halo.addColorStop(0, palette.glow);
    halo.addColorStop(0.3, 'rgba(' + palette.edge[0] + ',' + palette.edge[1] + ',' + palette.edge[2] + ',' + (0.1 + pulse * 0.07).toFixed(3) + ')');
    halo.addColorStop(0.58, 'rgba(' + palette.edge[0] + ',' + palette.edge[1] + ',' + palette.edge[2] + ',' + (0.03 + pulse * 0.03).toFixed(3) + ')');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, size, size);

    var lightX = 0.42, lightY = -0.5, lightZ = 0.76;
    var lightLength = Math.sqrt(lightX * lightX + lightY * lightY + lightZ * lightZ) || 1;
    lightX /= lightLength; lightY /= lightLength; lightZ /= lightLength;

    var orderedFaces = geometry.faces.map(function (face, index) {
      return [index, (points3d[face[0]][2] + points3d[face[1]][2] + points3d[face[2]][2]) / 3];
    }).sort(function (a, b) { return a[1] - b[1]; });

    orderedFaces.forEach(function (entry) {
      var face = geometry.faces[entry[0]];
      var a = points3d[face[0]], b = points3d[face[1]], c = points3d[face[2]];
      var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      var vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      var nx = uy * vz - uz * vy;
      var ny = uz * vx - ux * vz;
      var nz = ux * vy - uy * vx;
      var normalLength = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      var light = nx / normalLength * lightX + ny / normalLength * lightY + nz / normalLength * lightZ;
      var shade = 0.2 + 0.8 * Math.max(0, light);
      var a2 = project(a), b2 = project(b), c2 = project(c);
      ctx.beginPath();
      ctx.moveTo(a2[0], a2[1]);
      ctx.lineTo(b2[0], b2[1]);
      ctx.lineTo(c2[0], c2[1]);
      ctx.closePath();
      ctx.fillStyle = 'rgba(' + Math.round(palette.base[0] * shade) + ',' + Math.round(palette.base[1] * shade) + ',' + Math.round(palette.base[2] * shade) + ',0.94)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(' + palette.edge[0] + ',' + palette.edge[1] + ',' + palette.edge[2] + ',' + (state === 'yes' ? '0.82' : '0.54') + ')';
      ctx.lineWidth = state === 'yes' ? 0.9 : 0.62;
      ctx.stroke();
    });

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 0.55;
    ctx.strokeStyle = 'rgba(' + palette.edge[0] + ',' + palette.edge[1] + ',' + palette.edge[2] + ',0.4)';
    orderedFaces.forEach(function (entry) {
      var face = geometry.faces[entry[0]];
      var a2 = project(points3d[face[0]]), b2 = project(points3d[face[1]]), c2 = project(points3d[face[2]]);
      ctx.beginPath();
      ctx.moveTo(a2[0], a2[1]);
      ctx.lineTo(b2[0], b2[1]);
      ctx.lineTo(c2[0], c2[1]);
      ctx.closePath();
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.arc(center, center, state === 'yes' ? 2.1 : 1.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + palette.edge[0] + ',' + palette.edge[1] + ',' + palette.edge[2] + ',0.9)';
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }

  function loop(now) {
    draw(now || 0, !still);
    raf = window.requestAnimationFrame(loop);
  }

  window.ZABit = {
    mount: function (el) {
      if (!el || !el.getContext) return false;
      canvas = el;
      ctx = el.getContext('2d');
      resize();
      draw(window.performance ? window.performance.now() : 0, false);
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(loop);
      if (!this._bound) {
        this._bound = true;
        window.addEventListener('resize', function () { resize(); }, { passive: true });
      }
      return true;
    },
    palette: bitPalette,
    setState: function (s) {
      state = (s === 'yes' || s === 'no') ? s : 'idle';
      draw(window.performance ? window.performance.now() : 0, false);
    },
    setStill: function (v) { still = !!v; },
    stop: function () { window.cancelAnimationFrame(raf); }
  };
})();

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "./vendor/three.module.min.js";

const TAU = Math.PI * 2;
// Glow (additive) only reads on a dark page; light mode draws solid, darker particles.
const THEMES = {
  dark: { a: "#9ca3af", b: "#3b82f6", spark: "#ffffff", blending: AdditiveBlending, strength: 1 },
  light: { a: "#6b7280", b: "#2563eb", spark: "#111827", blending: NormalBlending, strength: 0.85 },
};
const MORPH_SECONDS = 1.8;
// Shapes are authored to fit roughly a 4.2-unit-wide box.
const SHAPE_SPAN = 4.2;

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spread(rand) {
  return (rand() + rand() + rand() - 1.5) / 1.5;
}

function rotate(out, rx, ry) {
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  for (let i = 0; i < out.length; i += 3) {
    const x = out[i];
    let y = out[i + 1];
    let z = out[i + 2];
    const y1 = y * cx - z * sx;
    z = y * sx + z * cx;
    y = y1;
    out[i] = x * cy + z * sy;
    out[i + 1] = y;
    out[i + 2] = -x * sy + z * cy;
  }
  return out;
}

const shapes = {
  network(n, rand) {
    const out = new Float32Array(n * 3);
    const layers = [3, 4, 4, 3, 2];
    const gap = 0.5;
    const nodes = layers.map((side, li) => {
      const x = (li - (layers.length - 1) / 2) * 0.95;
      const list = [];
      for (let a = 0; a < side; a++) {
        for (let b = 0; b < side; b++) {
          list.push([x, (a - (side - 1) / 2) * gap, (b - (side - 1) / 2) * gap]);
        }
      }
      return list;
    });
    for (let i = 0; i < n; i++) {
      const li = Math.floor(rand() * (layers.length - 1));
      let p;
      if (rand() < 0.55) {
        const layer = nodes[li + (rand() < 0.5 ? 0 : 1)];
        const c = layer[Math.floor(rand() * layer.length)];
        const r = 0.055;
        p = [c[0] + spread(rand) * r, c[1] + spread(rand) * r, c[2] + spread(rand) * r];
      } else {
        const a = nodes[li][Math.floor(rand() * nodes[li].length)];
        const b = nodes[li + 1][Math.floor(rand() * nodes[li + 1].length)];
        const t = rand();
        p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      }
      out.set(p, i * 3);
    }
    return rotate(out, 0.35, -0.55);
  },

  distill(n, rand) {
    const out = new Float32Array(n * 3);
    const arms = 7;
    for (let i = 0; i < n; i++) {
      let x;
      let y;
      let z;
      if (rand() < 0.16) {
        const r = 0.32 * Math.cbrt(rand());
        const th = rand() * TAU;
        const ph = Math.acos(2 * rand() - 1);
        x = 1.95 + r * Math.sin(ph) * Math.cos(th);
        y = r * Math.cos(ph);
        z = r * Math.sin(ph) * Math.sin(th);
      } else {
        const u = rand();
        const radius = 1.45 * Math.pow(1 - u, 1.5) + 0.12;
        const arm = Math.floor(rand() * arms);
        const angle = u * TAU * 1.6 + (arm / arms) * TAU + spread(rand) * 0.08;
        const r = radius * (rand() < 0.75 ? 1 : rand());
        x = -2 + u * 3.6;
        y = Math.cos(angle) * r;
        z = Math.sin(angle) * r;
      }
      out.set([x, y, z], i * 3);
    }
    return rotate(out, 0.15, -0.35);
  },

  document(n, rand) {
    const out = new Float32Array(n * 3);
    const pages = [
      [-0.55, 0.3, -0.7],
      [0, 0, 0],
      [0.55, -0.3, 0.7],
    ];
    const w = 0.85;
    const h = 1.1;
    const boxes = [
      [-0.65, 0.68, 0.6, 0.22],
      [-0.65, -0.05, 1.3, 0.5],
      [0.1, -0.78, 0.55, 0.2],
    ];
    for (let i = 0; i < n; i++) {
      const pi = Math.floor(rand() * pages.length);
      const kind = rand();
      let u;
      let v;
      if (kind < 0.18) {
        const t = rand() * 4;
        const side = Math.floor(t);
        const f = t - side;
        u = side === 0 ? -w + f * 2 * w : side === 2 ? w - f * 2 * w : side === 1 ? w : -w;
        v = side === 1 ? h - f * 2 * h : side === 3 ? -h + f * 2 * h : side === 0 ? h : -h;
      } else if (kind < 0.82 || pi !== 2) {
        const row = Math.floor(rand() * 15);
        v = h - 0.18 - row * 0.135;
        const len = 0.55 + ((row * 7919) % 10) / 10 * 0.95;
        u = -w + 0.15 + rand() * len;
        v += spread(rand) * 0.01;
      } else {
        const [bx, by, bw, bh] = boxes[Math.floor(rand() * boxes.length)];
        const t = rand() * 4;
        const side = Math.floor(t);
        const f = t - side;
        u = bx + (side === 0 || side === 2 ? f * bw : side === 1 ? bw : 0);
        v = by - (side === 1 || side === 3 ? f * bh : side === 2 ? bh : 0);
      }
      const [ox, oy, oz] = pages[pi];
      out.set([ox + u, oy + v, oz + spread(rand) * 0.01], i * 3);
    }
    return rotate(out, 0.1, -0.6);
  },

  globe(n, rand) {
    const out = new Float32Array(n * 3);
    const rings = [
      [0.4, 0.2],
      [-0.5, 0.9],
      [1.2, -0.4],
    ];
    for (let i = 0; i < n; i++) {
      if (rand() < 0.72) {
        const y = 1 - (2 * (i + 0.5)) / n;
        const ring = Math.sqrt(1 - y * y);
        const theta = i * 2.399963;
        const r = 1.35 + spread(rand) * 0.015;
        out.set([r * ring * Math.cos(theta), r * y, r * ring * Math.sin(theta)], i * 3);
      } else {
        const [rx, ry] = rings[Math.floor(rand() * rings.length)];
        const a = rand() * TAU;
        const r = 1.85 + spread(rand) * 0.02;
        const p = new Float32Array([Math.cos(a) * r, 0, Math.sin(a) * r]);
        rotate(p, rx, ry);
        out.set(p, i * 3);
      }
    }
    return out;
  },

  chip(n, rand) {
    const out = new Float32Array(n * 3);
    const half = 0.8;
    const pins = 9;
    for (let i = 0; i < n; i++) {
      const kind = rand();
      let x;
      let y;
      const side = Math.floor(rand() * 4);
      const slot = (Math.floor(rand() * pins) + 0.5) / pins;
      const along = -half + slot * 2 * half;
      if (kind < 0.42) {
        const g = 14;
        x = -half + (Math.floor(rand() * g) + 0.5) * ((2 * half) / g) + spread(rand) * 0.012;
        y = -half + (Math.floor(rand() * g) + 0.5) * ((2 * half) / g) + spread(rand) * 0.012;
        if (Math.abs(x) < 0.3 && Math.abs(y) < 0.3) {
          x *= 0.5;
          y *= 0.5;
        }
      } else if (kind < 0.62) {
        const t = rand() * 4;
        const s = Math.floor(t);
        const f = t - s;
        x = s === 0 ? -half + f * 2 * half : s === 2 ? half - f * 2 * half : s === 1 ? half : -half;
        y = s === 1 ? half - f * 2 * half : s === 3 ? -half + f * 2 * half : s === 0 ? half : -half;
      } else {
        // Traces leave each pin straight out, then bend once.
        const out1 = half + rand() * 0.9;
        const bendAt = half + 0.35 + ((slot * 13) % 1) * 0.3;
        const dir = slot < 0.5 ? -1 : 1;
        let a = Math.min(out1, bendAt);
        let b = along;
        if (out1 > bendAt) b = along + dir * (out1 - bendAt) * 0.8;
        if (side === 0) [x, y] = [b, a];
        else if (side === 1) [x, y] = [a, b];
        else if (side === 2) [x, y] = [b, -a];
        else [x, y] = [-a, b];
      }
      out.set([x, y, spread(rand) * 0.02], i * 3);
    }
    return rotate(out, -0.55, 0.35);
  },

  wave(n, rand) {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const x = (rand() - 0.5) * 4.2;
      const z = (rand() - 0.5) * 3.2;
      const r1 = Math.hypot(x + 0.9, z);
      const r2 = Math.hypot(x - 0.9, z);
      const y = 0.32 * (Math.sin(r1 * 5) / (1 + r1) + Math.sin(r2 * 5) / (1 + r2));
      out.set([x, y, z], i * 3);
    }
    return rotate(out, 0.7, -0.3);
  },
};

const vertexShader = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aDir;
  attribute float aSeed;
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uSpark;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float t = clamp(uProgress * 1.4 - aSeed * 0.4, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 p = mix(aFrom, position, t);
    p += aDir * sin(t * 3.14159) * 0.55;
    p += 0.018 * vec3(
      sin(uTime * 0.9 + aSeed * 40.0),
      cos(uTime * 0.7 + aSeed * 31.0),
      sin(uTime * 0.8 + aSeed * 23.0)
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.55 + aSeed * 0.9) / -mv.z;

    float g = smoothstep(-2.2, 2.2, p.x + p.y * 0.4);
    vColor = mix(uColorA, uColorB, g);
    if (aSeed > 0.93) vColor = mix(vColor, uSpark, 0.6);
    vAlpha = 0.55 + 0.45 * fract(aSeed * 13.7);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vAlpha * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smooth01(x) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

export function createScene(canvas, { reducedMotion = false, theme = "dark", edge = () => 0 } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);

  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const count = small ? 4200 : 9000;
  const rand = mulberry32(7);
  const cache = new Map();
  const shapeFor = (name) => {
    if (!cache.has(name)) cache.set(name, shapes[name](count, mulberry32(name.length * 97 + 11)));
    return cache.get(name);
  };

  const seeds = new Float32Array(count);
  const dirs = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seeds[i] = rand();
    dirs.set([spread(rand), spread(rand), spread(rand)], i * 3);
  }

  const start = shapeFor("network");
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(start.slice(), 3));
  geometry.setAttribute("aFrom", new BufferAttribute(start.slice(), 3));
  geometry.setAttribute("aDir", new BufferAttribute(dirs, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));

  const uniforms = {
    uProgress: { value: 1 },
    uTime: { value: 0 },
    uSize: { value: small ? 34 : 30 },
    uPixelRatio: { value: 1 },
    uOpacity: { value: 0 },
    uColorA: { value: new Color() },
    uColorB: { value: new Color() },
    uSpark: { value: new Color() },
  };

  // The fragment shader outputs premultiplied colour, for both blend modes.
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    premultipliedAlpha: true,
  });
  let strength = 1;

  function applyTheme(name) {
    const t = THEMES[name] || THEMES.dark;
    uniforms.uColorA.value.set(t.a);
    uniforms.uColorB.value.set(t.b);
    uniforms.uSpark.value.set(t.spark);
    material.blending = t.blending;
    material.needsUpdate = true;
    strength = t.strength;
  }
  applyTheme(theme);

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const spin = new Group();
  spin.add(points);
  const rig = new Group();
  rig.add(spin);
  const scene = new Scene();
  scene.add(rig);
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 9;

  let shape = "network";
  let morphStart = -Infinity;
  let time = 0;
  let last = performance.now();
  let frame = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const layout = { x: 0, y: 0, s: 1, o: 0 };
  const target = { x: 0, y: 0, s: 1, o: 1 };

  function computeTarget() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const worldH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const worldW = worldH * (w / h);
    const hero = shape === "network" && window.scrollY < h * 0.6;
    if (w >= 960) {
      const span = Math.min(worldW * 0.36, worldH * 0.8, (700 * worldW) / w);
      const s = span / SHAPE_SPAN;
      // In the hero, the network's right side lines up with the page column's right edge.
      const heroX = worldW / 2 - (edge() * worldW) / w - span / 2;
      Object.assign(target, hero
        ? { x: heroX, y: 0, s, o: 1 }
        : { x: worldW * 0.3, y: 0, s: s * 0.95, o: 0.42 });
    } else {
      const s = Math.min(worldW * 0.92, worldH * 0.42) / SHAPE_SPAN;
      Object.assign(target, hero
        ? { x: 0, y: worldH * 0.24, s, o: 0.95 }
        : { x: 0, y: worldH * 0.05, s: (worldW * 0.95) / SHAPE_SPAN, o: 0.22 });
    }
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    uniforms.uPixelRatio.value = ratio;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    computeTarget();
    if (reducedMotion) {
      Object.assign(layout, target);
      render();
    }
  }

  // Snapshot what is on screen so an interrupted morph continues from there.
  function snapshot(progress) {
    const from = geometry.attributes.aFrom.array;
    const to = geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const t = smooth01(progress * 1.4 - seeds[i] * 0.4);
      const bump = Math.sin(t * Math.PI) * 0.55;
      for (let k = 0; k < 3; k++) {
        const j = i * 3 + k;
        from[j] = from[j] + (to[j] - from[j]) * t + dirs[j] * bump;
      }
    }
    geometry.attributes.aFrom.needsUpdate = true;
  }

  function setShape(name) {
    if (!shapes[name]) return;
    computeTarget();
    if (name === shape) return;
    shape = name;
    computeTarget();
    if (reducedMotion) {
      geometry.attributes.position.array.set(shapeFor(name));
      geometry.attributes.aFrom.array.set(shapeFor(name));
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aFrom.needsUpdate = true;
      Object.assign(layout, target);
      render();
      return;
    }
    snapshot(uniforms.uProgress.value);
    geometry.attributes.position.array.set(shapeFor(name));
    geometry.attributes.position.needsUpdate = true;
    morphStart = time;
    uniforms.uProgress.value = 0;
  }

  function render() {
    rig.position.set(layout.x, layout.y, 0);
    rig.scale.setScalar(layout.s);
    uniforms.uOpacity.value = layout.o * strength;
    renderer.render(scene, camera);
  }

  function setTheme(name) {
    applyTheme(name);
    if (reducedMotion) render();
  }

  function tick(now) {
    frame = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;
    uniforms.uTime.value = time;
    uniforms.uProgress.value = ease(Math.min(1, (time - morphStart) / MORPH_SECONDS));

    const k = 1 - Math.exp(-dt * 2.6);
    layout.x += (target.x - layout.x) * k;
    layout.y += (target.y - layout.y) * k;
    layout.s += (target.s - layout.s) * k;
    layout.o += (target.o - layout.o) * k;

    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.y += (pointer.ty - pointer.y) * k;
    // Sway rather than spin, so flat shapes (chip, wave, pages) never turn edge-on.
    spin.rotation.y = Math.sin(time * 0.16) * 0.45;
    spin.rotation.x = Math.sin(time * 0.11) * 0.12;
    rig.rotation.y = pointer.x * 0.35;
    rig.rotation.x = pointer.y * 0.2;
    render();
  }

  function onPointer(event) {
    if (event.pointerType !== "mouse") return;
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
  }

  function onVisibility() {
    cancelAnimationFrame(frame);
    if (!document.hidden && !reducedMotion) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  new ResizeObserver(resize).observe(canvas);
  window.addEventListener("scroll", computeTarget, { passive: true });
  resize();
  if (reducedMotion) {
    Object.assign(layout, target);
    render();
  } else {
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(tick);
  }

  return { setShape, setTheme };
}

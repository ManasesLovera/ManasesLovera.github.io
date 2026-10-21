const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const systemLight = window.matchMedia("(prefers-color-scheme: light)");
const themeListeners = [];

function currentTheme() {
  return root.dataset.theme || (systemLight.matches ? "light" : "dark");
}

function applyTheme(theme, remember) {
  root.dataset.theme = theme;
  if (remember) {
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Storage blocked: the choice lasts for this page view only.
    }
  }
  const toggle = document.querySelector(".theme-toggle");
  toggle?.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  themeListeners.forEach((listener) => listener(theme));
}

function storedTheme() {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

applyTheme(currentTheme(), false);
const toggle = document.querySelector(".theme-toggle");
if (toggle) {
  toggle.hidden = false;
  toggle.addEventListener("click", () => applyTheme(currentTheme() === "dark" ? "light" : "dark", true));
}
systemLight.addEventListener("change", (event) => {
  if (!storedTheme()) applyTheme(event.matches ? "light" : "dark", false);
});

const menu = document.querySelector(".menu");
if (menu) {
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) menu.open = false;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
}

// Only hide what is still below the fold, so nothing already painted flashes out.
if (!reducedMotion && "IntersectionObserver" in window) {
  const below = [...document.querySelectorAll(".reveal")].filter(
    (el) => el.getBoundingClientRect().top > window.innerHeight,
  );
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove("pending");
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  below.forEach((el) => {
    el.classList.add("pending");
    io.observe(el);
  });
}

// Approach: elbow arrows between the staggered boxes, drawn in order once the section is in view.
const path = document.querySelector(".path");
if (path) {
  const steps = [...path.querySelectorAll(".step")];
  const svg = path.querySelector(".path-line");
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const stacked = window.matchMedia("(max-width: 959px)");
  const arrows = steps.slice(1).map((_, i) => {
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrow.setAttribute("pathLength", "1");
    arrow.style.setProperty("--i", i);
    svg.append(arrow);
    return arrow;
  });
  steps.forEach((step, i) => step.style.setProperty("--i", i));
  path.classList.add("on");

  const setOpen = (open) => {
    for (const step of steps) {
      step.classList.toggle("open", step === open);
      step.querySelector(".step-head").setAttribute("aria-expanded", String(step === open));
    }
  };

  const layout = () => {
    const vertical = stacked.matches;
    path.style.minHeight = "";
    const box = path.getBoundingClientRect();
    const rects = steps.map((step) => {
      const r = step.getBoundingClientRect();
      return { left: r.left - box.left, right: r.right - box.left, top: r.top - box.top, bottom: r.bottom - box.top };
    });
    // Boxes open in place; reserve their open height up front so nothing below jumps.
    if (!vertical) {
      const reserve = Math.max(
        ...steps.map((step, i) => {
          const more = step.querySelector(".step-more");
          return rects[i].bottom - more.getBoundingClientRect().height + more.firstElementChild.scrollHeight;
        }),
      );
      path.style.minHeight = `${Math.ceil(reserve)}px`;
    }
    arrows.forEach((arrow, i) => {
      const a = rects[i];
      const b = rects[i + 1];
      let d;
      if (vertical) {
        const x1 = (a.left + a.right) / 2;
        const x2 = (b.left + b.right) / 2;
        const y1 = a.bottom + 3;
        const y2 = b.top - 3;
        const ym = (y1 + y2) / 2;
        const r = Math.min(8, Math.abs(x2 - x1) / 2, (y2 - y1) / 2);
        const s = Math.sign(x2 - x1);
        d = `M${x1} ${y1}V${ym - r}Q${x1} ${ym} ${x1 + s * r} ${ym}H${x2 - s * r}Q${x2} ${ym} ${x2} ${ym + r}V${y2}`;
        d += `M${x2 - 5} ${y2 - 7}L${x2} ${y2}L${x2 + 5} ${y2 - 7}`;
      } else {
        const x1 = a.right + 3;
        const x2 = b.left - 3;
        const y1 = a.top + 36;
        const y2 = b.top + 36;
        const xm = (x1 + x2) / 2;
        const r = Math.min(8, Math.abs(y2 - y1) / 2, (x2 - x1) / 2);
        const s = Math.sign(y2 - y1);
        d = `M${x1} ${y1}H${xm - r}Q${xm} ${y1} ${xm} ${y1 + s * r}V${y2 - s * r}Q${xm} ${y2} ${xm + r} ${y2}H${x2}`;
        d += `M${x2 - 7} ${y2 - 5}L${x2} ${y2}L${x2 - 7} ${y2 + 5}`;
      }
      arrow.setAttribute("d", d);
    });
  };

  for (const step of steps) {
    const head = step.querySelector(".step-head");
    head.addEventListener("click", () => {
      // Mouse users already opened it by hovering; a click there should not close it.
      setOpen(canHover.matches || !step.classList.contains("open") ? step : null);
    });
    head.addEventListener("focus", () => head.matches(":focus-visible") && setOpen(step));
    step.addEventListener("mouseenter", () => canHover.matches && setOpen(step));
  }
  path.addEventListener("mouseleave", () => canHover.matches && setOpen(null));
  path.addEventListener("focusout", (event) => !path.contains(event.relatedTarget) && setOpen(null));
  document.addEventListener("click", (event) => !path.contains(event.target) && setOpen(null));
  document.addEventListener("keydown", (event) => event.key === "Escape" && setOpen(null));

  const resize = new ResizeObserver(() => requestAnimationFrame(layout));
  steps.forEach((step) => resize.observe(step));
  resize.observe(path.querySelector(".steps"));
  document.fonts?.ready.then(layout);

  if (reducedMotion || !("IntersectionObserver" in window)) {
    path.classList.add("go");
  } else {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        path.classList.add("go");
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    io.observe(path);
  }
}

// Project cards: invoker commands where the browser lacks them, and a click on the backdrop
// closes, for browsers without closedby.
if (!("command" in HTMLButtonElement.prototype)) {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button[commandfor]");
    const dialog = button && document.getElementById(button.getAttribute("commandfor"));
    if (!dialog) return;
    if (button.getAttribute("command") === "show-modal") dialog.showModal();
    else dialog.close();
  });
}
for (const dialog of document.querySelectorAll("dialog.modal")) {
  dialog.addEventListener("click", (event) => event.target === dialog && dialog.close());
}
// On small screens the hero has no network, so the scene stays hidden while it is in view.
const hero = document.getElementById("top");
if (hero && "IntersectionObserver" in window) {
  root.classList.toggle("at-hero", window.scrollY < hero.offsetHeight * 0.6);
  new IntersectionObserver(([entry]) => root.classList.toggle("at-hero", entry.isIntersecting), {
    rootMargin: "0px 0px -40% 0px",
  }).observe(hero);
}

const labels = {
  network: "Neural network",
  distill: "Distillation",
  document: "Document AI",
  globe: "Scale",
  chip: "Silicon",
  wave: "Interference",
};

function webglAvailable() {
  try {
    const probe = document.createElement("canvas");
    return Boolean(probe.getContext("webgl2") || probe.getContext("webgl"));
  } catch {
    return false;
  }
}

async function startScene() {
  const canvas = document.getElementById("scene");
  if (!canvas || !webglAvailable()) return;
  let scene;
  try {
    const { createScene } = await import("./scene.js");
    const column = document.querySelector(".site-header .wrap");
    const edge = () => {
      if (!column) return 0;
      const rect = column.getBoundingClientRect();
      return window.innerWidth - rect.right + parseFloat(getComputedStyle(column).paddingRight);
    };
    scene = createScene(canvas, { reducedMotion, theme: currentTheme(), edge });
  } catch (error) {
    console.warn("Scene disabled:", error);
    return;
  }
  themeListeners.push((theme) => scene.setTheme(theme));
  canvas.classList.add("ready");
  root.classList.add("scene-on");

  const hud = document.querySelector(".hud");
  const hudIndex = hud?.querySelector("[data-hud-index]");
  const hudLabel = hud?.querySelector("[data-hud-label]");
  const sections = [...document.querySelectorAll("[data-scene]")];

  // A thin band across the middle of the viewport decides the active section.
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const name = entry.target.dataset.scene;
        scene.setShape(name);
        // The hero carries its own figures, so the HUD only labels later sections.
        hud?.classList.toggle("on", entry.target.id !== "top");
        if (hudIndex && hudLabel) {
          hudIndex.textContent = `Fig. ${String(sections.indexOf(entry.target) + 1).padStart(2, "0")}`;
          hudLabel.textContent = labels[name];
        }
      }
    },
    { rootMargin: "-48% 0px -48% 0px" },
  );
  sections.forEach((section) => io.observe(section));
}

if ("requestIdleCallback" in window) {
  requestIdleCallback(startScene, { timeout: 1200 });
} else {
  setTimeout(startScene, 200);
}

/* =========================================================
   animaciones.js — Smeke & Zarazua
   Incluye:
   1) Menú responsive (open/close, ESC, click backdrop, lock scroll)
   2) Tabs "Áreas de práctica"
   3) Carrusel horizontal (botones + drag)
   4) Scroll reveal (IntersectionObserver + stagger)
   5) Hero transición (white->dark: fade/translate + spotlight parallax)
   6) Header invert automático según sección (data-theme="dark"/"light")
   7) Año dinámico en footer
========================================================= */

(() => {
  "use strict";

  /* -----------------------------
     Helpers
  ----------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  /* -----------------------------
     Footer year
  ----------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* =========================================================
     1) MENÚ RESPONSIVE
  ========================================================= */
  const menu = $("#sideMenu");
  const openBtn = $("[data-menu-open]");
  const closeBtns = $$("[data-menu-close]");
  const menuLinks = $$("[data-menu-link]");

  const openMenu = () => {
    if (!menu) return;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    openBtn?.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("no-scroll");
  };

  const closeMenu = () => {
    if (!menu) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    openBtn?.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("no-scroll");
  };

  openBtn?.addEventListener("click", openMenu);
  closeBtns.forEach((b) => b.addEventListener("click", closeMenu));
  menuLinks.forEach((a) => a.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu?.classList.contains("is-open")) closeMenu();
  });

  /* =========================================================
     2) SCROLL SUAVE para el botón del hero
  ========================================================= */
  $$("[data-scroll-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sel = btn.getAttribute("data-scroll-next");
      const target = sel ? $(sel) : null;
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* =========================================================
     3) TABS (Áreas)
  ========================================================= */
  const tabButtons = $$(".area-link[data-tab]");
  const panels = $$(".area-panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-tab");
      if (!id) return;

      tabButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });

      panels.forEach((p) => {
        const active = p.id === id;
        p.classList.toggle("is-active", active);
        p.hidden = !active;
      });
    });
  });

  /* =========================================================
     4) CARRUSEL (botones + drag)
  ========================================================= */
  const track = $("[data-carousel-track]");
  const prev = $("[data-carousel-prev]");
  const next = $("[data-carousel-next]");

  const scrollAmount = () => {
    const vw = window.innerWidth;
    return vw < 520 ? Math.round(vw * 0.88) : 520;
  };

  prev?.addEventListener("click", () => {
    track?.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
  });

  next?.addEventListener("click", () => {
    track?.scrollBy({ left: scrollAmount(), behavior: "smooth" });
  });

  // Drag (mouse)
  if (track) {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    track.addEventListener("mousedown", (e) => {
      isDown = true;
      track.classList.add("is-dragging");
      startX = e.pageX;
      scrollLeft = track.scrollLeft;
    });

    window.addEventListener("mouseup", () => {
      isDown = false;
      track.classList.remove("is-dragging");
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const walk = (e.pageX - startX) * 1.2;
      track.scrollLeft = scrollLeft - walk;
    });

    // Touch
    let tStart = 0;
    let tScroll = 0;

    track.addEventListener("touchstart", (e) => {
      tStart = e.touches[0].pageX;
      tScroll = track.scrollLeft;
    }, { passive: true });

    track.addEventListener("touchmove", (e) => {
      const walk = (e.touches[0].pageX - tStart) * 1.2;
      track.scrollLeft = tScroll - walk;
    }, { passive: true });
  }

  /* =========================================================
     5) SCROLL REVEAL (IntersectionObserver)
     Auto-etiqueta elementos comunes + stagger por grupo
  ========================================================= */
  const autoRevealSelectors = [
    ".section .h2",
    ".section .h3",
    ".section .p",
    ".glass-card",
    ".callout",
    ".texture-card",
    ".person-card",
    ".partner-card",
    ".news-card",
    ".quote",
    ".areas",
    ".partners",
    ".news-grid"
  ];

  autoRevealSelectors.forEach((sel) => {
    $$(sel).forEach((el) => {
      if (!el.classList.contains("reveal")) el.classList.add("reveal");
    });
  });

  // Stagger common grids
  [".partners .partner-card", ".news-grid .news-card", ".people-preview .person-card"].forEach((sel) => {
    $$(sel).forEach((el) => el.classList.add("reveal", "reveal--stagger"));
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;

        // Stagger delay using CSS var --d
        if (el.classList.contains("reveal--stagger")) {
          const siblings = Array.from(el.parentElement?.children || []);
          const idx = siblings.indexOf(el);
          el.style.setProperty("--d", `${idx * 90}ms`);
        }

        el.classList.add("is-visible");
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -12% 0px" }
  );

  $$(".reveal").forEach((el) => revealObserver.observe(el));

  /* =========================================================
     6) HERO TRANSITION (white->dark)
     (Para parecerse a tus capturas: el bloque blanco se va,
      y el dark toma protagonismo + spotlight parallax)
  ========================================================= */
  const hero = $(".hero");
  const heroWhite = $(".hero__white");
  const heroDark = $(".hero__dark");
  const spotlight = $(".hero__spotlight");
  const heroTitle = $(".hero__title");
  const heroRight = $(".hero__right");

  const getHeroProgress = () => {
    if (!hero) return 0;
    const rect = hero.getBoundingClientRect();
    const vh = window.innerHeight || 1;

    // 0 cuando el hero top está a 0
    // 1 cuando sube ~1 viewport
    const raw = (-rect.top) / vh;
    return clamp(raw, 0, 1.2);
  };

  let ticking = false;
  const updateHero = () => {
    ticking = false;
    if (!heroWhite || !heroDark) return;

    const p = getHeroProgress(); // 0..1.2

    // White panel slides up and fades out
    const whiteY = p * -140;           // px
    const whiteOpacity = clamp(1 - p * 1.25, 0, 1);

    heroWhite.style.transform = `translateY(${whiteY}px)`;
    heroWhite.style.opacity = String(whiteOpacity);

    // Dark fade in slightly (keeps stable)
    heroDark.style.opacity = String(clamp(0.55 + p * 0.55, 0.55, 1));

    // Spotlight parallax
    if (spotlight) {
      const spY = p * -60;
      const spScale = 1 + p * 0.06;
      spotlight.style.transform = `translateY(${spY}px) scale(${spScale})`;
      spotlight.style.opacity = String(clamp(0.75 + p * 0.25, 0.75, 1));
    }

    // Title subtle shrink
    if (heroTitle) {
      const s = 1 - clamp(p, 0, 1) * 0.06;
      heroTitle.style.transformOrigin = "left center";
      heroTitle.style.transform = `scale(${s})`;
    }

    // Right content subtle lift
    if (heroRight) {
      const lift = (1 - clamp(p, 0, 1)) * 18;
      heroRight.style.transform = `translateY(${lift}px)`;
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateHero);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(updateHero));
  requestAnimationFrame(updateHero);

  /* =========================================================
     7) HEADER INVERT AUTOMÁTICO POR SECCIÓN
     - Usa data-theme="dark" en secciones oscuras
     - Cambia topbar a .is-invert cuando sección visible es dark
     - Esto logra: "el color de texto se vuelva a la inversa"
  ========================================================= */
  const header = $("[data-header]");
  const themedSections = $$("[data-theme]");
  const menuNavLinks = $$("#sideMenu .menu__nav a[href^='#']");

  if (header && themedSections.length) {
    const themeObserver = new IntersectionObserver(
      (entries) => {
        // Buscar la más visible de las que intersectan
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const theme = visible.target.getAttribute("data-theme");
        header.classList.toggle("is-invert", theme === "dark");

        // Active link highlight en menú (opcional)
        const id = visible.target.id;
        if (id && menuNavLinks.length) {
          menuNavLinks.forEach((a) => {
            const match = a.getAttribute("href") === `#${id}`;
            a.classList.toggle("is-current", match);
          });
        }
      },
      {
        threshold: [0.20, 0.35, 0.50, 0.65],
        rootMargin: "-10% 0px -70% 0px" // ayuda a detectar "sección actual" desde arriba
      }
    );

    themedSections.forEach((sec) => themeObserver.observe(sec));
  }

})();

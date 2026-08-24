(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => document.body.classList.add("is-loaded"));
  });

  const year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  const header = $("[data-header]");
  let headerTicking = false;

  const updateHeader = () => {
    headerTicking = false;
    header?.classList.toggle("is-scrolled", window.scrollY > 36);
  };

  window.addEventListener("scroll", () => {
    if (headerTicking) return;
    headerTicking = true;
    requestAnimationFrame(updateHeader);
  }, { passive: true });
  updateHeader();

  const menu = $("[data-mobile-menu]");
  const menuPanel = $("[data-menu-panel]");
  const menuOpen = $("[data-menu-open]");
  const menuClose = $$("[data-menu-close]");
  const menuLinks = $$("[data-menu-link]");
  const desktopQuery = window.matchMedia("(min-width: 861px)");
  let previousFocus = null;

  const getFocusable = () => {
    if (!menuPanel) return [];
    return $$("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])", menuPanel)
      .filter((element) => element.offsetParent !== null);
  };

  const closeMenu = (restoreFocus = true) => {
    if (!menu || !menuOpen) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    menuOpen.setAttribute("aria-expanded", "false");
    menuOpen.setAttribute("aria-label", "Abrir menú");
    document.documentElement.classList.remove("no-scroll");

    if (restoreFocus && previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
  };

  const openMenu = () => {
    if (!menu || !menuOpen || desktopQuery.matches) return;
    previousFocus = document.activeElement;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    menuOpen.setAttribute("aria-expanded", "true");
    menuOpen.setAttribute("aria-label", "Cerrar menú");
    document.documentElement.classList.add("no-scroll");
    getFocusable()[0]?.focus();
  };

  menuOpen?.addEventListener("click", openMenu);
  menuClose.forEach((button) => button.addEventListener("click", () => closeMenu()));
  menuLinks.forEach((link) => link.addEventListener("click", () => closeMenu()));

  document.addEventListener("keydown", (event) => {
    if (!menu?.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      closeMenu();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = getFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  desktopQuery.addEventListener("change", (event) => {
    if (event.matches) closeMenu(false);
  });

  const revealItems = $$(".reveal");

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: .1, rootMargin: "0px 0px -10% 0px" });

    revealItems.forEach((element) => revealObserver.observe(element));
  }

  const mainSections = ["inicio", "firma", "servicios", "contacto"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const trackedLinks = $$(".desktop-nav a[href^='#'], .mobile-menu nav a[href^='#']");

  if ("IntersectionObserver" in window && mainSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const activeHref = `#${visible.target.id}`;

      trackedLinks.forEach((link) => {
        if (link.getAttribute("href") === activeHref) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }, { threshold: [0, .2, .45], rootMargin: "-28% 0px -58% 0px" });

    mainSections.forEach((section) => sectionObserver.observe(section));
  }

  const serviceItems = $$(".service-item");
  serviceItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      serviceItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  const contactForm = $("[data-contact-form]");
  const formStatus = $("[data-form-status]");

  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const data = new FormData(contactForm);
    if (String(data.get("website") || "").trim()) return;

    const serviceLabels = {
      consultoria: "Consultoría fiscal",
      impuestos: "Impuestos y seguridad social",
      controversia: "Controversia",
      otro: "Otro asunto fiscal"
    };
    const service = String(data.get("servicio") || "");
    const phone = contactForm.dataset.whatsappNumber || "528131426548";
    const message = [
      "Hola, quiero solicitar información a Smeke Zarazúa Asociados, S.C.",
      "",
      `Nombre: ${String(data.get("nombre") || "").trim()}`,
      `Correo: ${String(data.get("email") || "").trim()}`,
      `Teléfono: ${String(data.get("telefono") || "No proporcionado").trim() || "No proporcionado"}`,
      `Área de interés: ${serviceLabels[service] || "Otro asunto fiscal"}`,
      "",
      "Mensaje:",
      String(data.get("mensaje") || "").trim()
    ].join("\n");
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    if (formStatus) {
      formStatus.textContent = "Abriendo WhatsApp con su mensaje preparado…";
      formStatus.className = "form-status is-success";
    }

    const whatsappWindow = window.open(whatsappUrl, "_blank");
    if (whatsappWindow) {
      whatsappWindow.opener = null;
    } else {
      window.location.assign(whatsappUrl);
    }
  });
})();

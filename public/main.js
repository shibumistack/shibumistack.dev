(() => {
  const parser = new DOMParser();
  const cache = new Map();
  let navigationId = 0;

  function initTheme() {
    const stored = localStorage.getItem("shibumi-theme");
    if (stored) {
      document.documentElement.setAttribute("data-theme", stored);
    } else {
      const pref = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", pref);
    }
  }

  initTheme();

  function closeMenu() {
    document.querySelector("header")?.classList.remove("menu-open");
    const btn = document.querySelector(".menu-toggle");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    const header = document.querySelector("header");
    if (header?.classList.contains("menu-open")) {
      closeMenu();
    } else {
      header?.classList.add("menu-open");
      const btn = document.querySelector(".menu-toggle");
      if (btn) btn.setAttribute("aria-expanded", "true");
    }
  }

  function shouldIntercept(event, link) {
    if (event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (!link || link.hasAttribute("download")) return false;
    if (link.target && link.target !== "_self") return false;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname) return false;
    return true;
  }

  async function fetchPage(path) {
    let text = cache.get(path);
    if (text) return parser.parseFromString(text, "text/html");

    const res = await fetch(path, { headers: { accept: "text/html" } });
    if (!res.ok) throw new Error(res.status);
    text = await res.text();
    cache.set(path, text);
    return parser.parseFromString(text, "text/html");
  }

  function loadStyles(nextDoc) {
    const current = new Set(
      Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map((l) => l.getAttribute("href"))
    );
    const pending = [];
    for (const link of nextDoc.querySelectorAll('link[rel="stylesheet"]')) {
      const href = link.getAttribute("href");
      if (!current.has(href)) {
        pending.push(new Promise((resolve) => {
          const el = document.createElement("link");
          el.rel = "stylesheet";
          el.href = href;
          el.onload = resolve;
          el.onerror = resolve;
          document.head.appendChild(el);
        }));
      }
    }
    return Promise.all(pending);
  }

  function swap(nextDoc) {
    document.title = nextDoc.title;

    const oldStyle = document.head.querySelector("style[data-page]");
    const newStyle = nextDoc.head.querySelector("style[data-page]");
    if (oldStyle) oldStyle.remove();
    if (newStyle) document.head.appendChild(newStyle);

    const oldMain = document.querySelector("main");
    const newMain = nextDoc.querySelector("main");
    if (oldMain && newMain) oldMain.replaceWith(newMain);

    const oldNav = document.querySelector("nav");
    const newNav = nextDoc.querySelector("nav");
    if (oldNav && newNav) {
      for (const a of oldNav.querySelectorAll("a[aria-current]")) {
        a.removeAttribute("aria-current");
      }
      for (const a of newNav.querySelectorAll("a[aria-current]")) {
        const match = oldNav.querySelector(`a[href="${a.getAttribute("href")}"]`);
        if (match) match.setAttribute("aria-current", "page");
      }
    }

    const oldFooter = document.querySelector(".site-footer");
    const newFooter = nextDoc.querySelector(".site-footer");
    if (oldFooter && newFooter) oldFooter.replaceWith(newFooter);

    for (const script of document.querySelectorAll("script[data-page-script]")) {
      script.remove();
    }
    const newScript = nextDoc.querySelector("script[data-page-script]");
    if (newScript) {
      const script = document.createElement("script");
      script.setAttribute("data-page-script", "");
      script.textContent = newScript.textContent;
      document.body.appendChild(script);
    }
  }

  async function navigate(path, push) {
    const id = ++navigationId;
    let nextDoc;
    try {
      nextDoc = await fetchPage(path);
    } catch {
      if (id !== navigationId) return;
      location.href = path;
      return;
    }

    await loadStyles(nextDoc);
    if (id !== navigationId) return;

    const doSwap = () => {
      if (id !== navigationId) return;
      closeMenu();
      swap(nextDoc);
      if (push) history.pushState({ path }, "", path);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };

    if (document.startViewTransition) {
      await document.startViewTransition(doSwap).finished;
    } else {
      doSwap();
    }
  }

  document.addEventListener("click", (event) => {
    const menuToggle = event.target.closest(".menu-toggle");
    if (menuToggle) {
      toggleMenu();
      return;
    }

    if (document.querySelector("header")?.classList.contains("menu-open")) {
      if (!event.target.closest(".menu-toggle")) {
        closeMenu();
      }
    }

    const toggle = event.target.closest(".theme-toggle");
    if (toggle) {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("shibumi-theme", next);
      return;
    }

    const installBtn = event.target.closest(".nav-install");
    if (installBtn) {
      const dialog = document.getElementById("install-dialog");
      if (dialog) dialog.showModal();
      return;
    }

    const dialog = event.target.closest(".install-dialog");
    if (dialog && event.target === dialog) {
      dialog.close();
      return;
    }

    const copyButton = event.target.closest("[data-copy]");
    if (copyButton) {
      const value = copyButton.getAttribute("data-copy") || "";
      navigator.clipboard.writeText(value);
      copyButton.classList.add("copied");
      setTimeout(() => { copyButton.classList.remove("copied"); }, 1400);
      return;
    }

    const link = event.target.closest("a[href]");
    if (!shouldIntercept(event, link)) return;
    event.preventDefault();
    navigate(new URL(link.href, location.href).pathname, true);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const dialog = document.getElementById("install-dialog");
      if (dialog && dialog.open) {
        dialog.close();
        return;
      }
      if (document.querySelector("header")?.classList.contains("menu-open")) {
        closeMenu();
      }
    }
  });

  window.addEventListener("popstate", (event) => {
    navigate(location.pathname, false);
  });
})();

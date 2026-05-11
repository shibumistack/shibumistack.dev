(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsViewTransition = typeof document.startViewTransition === "function";
  const parser = new DOMParser();

  function samePage(url) {
    return url.pathname === window.location.pathname && url.search === window.location.search;
  }

  function shouldHandleLink(event, link) {
    if (event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (!link) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download")) return false;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (samePage(url)) return false;

    return true;
  }

  async function fetchPage(url) {
    const response = await fetch(url.href, {
      headers: { accept: "text/html" },
    });

    if (!response.ok) throw new Error(`Page request failed: ${response.status}`);

    const html = await response.text();
    return parser.parseFromString(html, "text/html");
  }

  function swapPage(nextDocument, url) {
    document.head.replaceWith(nextDocument.head);
    document.body.replaceWith(nextDocument.body);
    history.pushState({}, "", url.href);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }

  async function navigate(url) {
    document.documentElement.classList.add("is-page-blurring");

    const pagePromise = fetchPage(url);
    await new Promise((resolve) => window.setTimeout(resolve, 500));

    let nextDocument;
    try {
      nextDocument = await pagePromise;
    } catch {
      window.location.href = url.href;
      return;
    }

    if (!supportsViewTransition) {
      swapPage(nextDocument, url);
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("is-page-blurring");
      });
      return;
    }

    const transition = document.startViewTransition(() => {
      swapPage(nextDocument, url);
    });

    await transition.finished;
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("is-page-blurring");
    });
  }

  async function restore(url) {
    document.documentElement.classList.add("is-page-blurring");

    let nextDocument;
    try {
      nextDocument = await fetchPage(url);
    } catch {
      window.location.href = url.href;
      return;
    }

    if (supportsViewTransition) {
      const transition = document.startViewTransition(() => {
        document.head.replaceWith(nextDocument.head);
        document.body.replaceWith(nextDocument.body);
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      });
      await transition.finished;
    } else {
      document.head.replaceWith(nextDocument.head);
      document.body.replaceWith(nextDocument.body);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    requestAnimationFrame(() => {
      document.documentElement.classList.remove("is-page-blurring");
    });
  }

  document.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy]");
    if (copyButton) {
      const value = copyButton.getAttribute("data-copy") || "";
      await navigator.clipboard.writeText(value);
      const original = copyButton.innerHTML;
      copyButton.textContent = "Copied";
      window.setTimeout(() => { copyButton.innerHTML = original; }, 1400);
      return;
    }

    if (reduceMotion) return;

    const link = event.target.closest("a[href]");
    if (!shouldHandleLink(event, link)) return;

    event.preventDefault();
    navigate(new URL(link.href, window.location.href));
  });

  window.addEventListener("popstate", () => {
    if (reduceMotion) return;
    restore(new URL(window.location.href));
  });
})();

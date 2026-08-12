(() => {
  const frame = document.querySelector(".docs-frame");
  if (!frame) return;
  const menu = frame.querySelector(".docs-menu");
  const close = frame.querySelector(".docs-close");
  const sidebar = frame.querySelector(".docs-sidebar");
  const outline = frame.querySelector("[data-docs-outline]");
  const headings = [...frame.querySelectorAll(".docs-prose h2[id], .docs-prose h3[id]")];

  function setMenu(open) {
    frame.classList.toggle("docs-open", open);
    menu?.setAttribute("aria-expanded", String(open));
  }

  frame.addEventListener("click", (event) => {
    const button = event.target.closest(".docs-return");
    if (!button) return;
    const terminal = button.closest(".docs-clack-collapsible");
    const expanded = !terminal.classList.contains("is-expanded");
    terminal.classList.toggle("is-expanded", expanded);
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = expanded ? "Close" : "Output";
  });

  menu?.addEventListener("click", () => setMenu(true));
  close?.addEventListener("click", () => setMenu(false));
  sidebar?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  frame.addEventListener("click", (event) => {
    if (frame.classList.contains("docs-open") && !event.target.closest(".docs-sidebar") && !event.target.closest(".docs-menu")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  }, { once: false });

  if (!outline || headings.length === 0) {
    frame.querySelector(".docs-outline")?.remove();
    return;
  }
  outline.innerHTML = headings.map((heading) => `<a href="#${heading.id}" data-level="${heading.tagName.slice(1)}">${heading.textContent.replace(/#$/, "")}</a>`).join("");
  const links = new Map([...outline.querySelectorAll("a")].map((link) => [link.hash.slice(1), link]));
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!visible) return;
    links.forEach((link) => link.classList.remove("active"));
    links.get(visible.target.id)?.classList.add("active");
  }, { rootMargin: "-15% 0px -70% 0px" });
  headings.forEach((heading) => observer.observe(heading));
})();

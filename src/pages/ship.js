(() => {
  const details = document.querySelector("[data-ship-source]");
  const summary = details?.querySelector("summary");
  const code = details?.querySelector("[data-ship-code]");
  const lines = details?.querySelector("[data-ship-lines]");
  if (!details || !summary || !code) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tokenPattern = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(import|from|export|function|async|await|const|let|interface|type|return|if|else|for|of|while|try|catch|throw|new|class|extends|implements|public|private|readonly|typeof|instanceof|in|as|satisfies)\b|\b(true|false|null|undefined|\d+(?:\.\d+)?)\b/g;
  let loaded = false;
  let busy = false;
  let animation = null;

  function appendToken(text, className) {
    if (!className) {
      code.append(document.createTextNode(text));
      return;
    }
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    code.append(span);
  }

  function highlight(source) {
    code.textContent = "";
    let cursor = 0;
    for (const match of source.matchAll(tokenPattern)) {
      appendToken(source.slice(cursor, match.index));
      appendToken(match[0], match[1] ? "syntax-comment" : match[2] ? "syntax-string" : match[3] ? "syntax-keyword" : "syntax-literal");
      cursor = (match.index ?? 0) + match[0].length;
    }
    appendToken(source.slice(cursor));
  }

  async function loadSource() {
    if (loaded) return;
    try {
      const response = await fetch("/ship/v41.ts");
      if (!response.ok) throw new Error(String(response.status));
      const source = await response.text();
      highlight(source);
      if (lines) lines.textContent = `${source.trimEnd().split("\n").length} lines`;
      loaded = true;
    } catch {
      code.textContent = "Source failed to load. Download it with the command above.";
    }
  }

  function setOpen(open) {
    if (reducedMotion) {
      details.open = open;
      return Promise.resolve();
    }

    if (animation) animation.cancel();
    const startHeight = details.getBoundingClientRect().height;
    details.open = true;
    const endHeight = open ? details.scrollHeight : summary.getBoundingClientRect().height + 2;
    details.style.height = `${startHeight}px`;
    details.style.overflow = "hidden";
    animation = details.animate(
      { height: [`${startHeight}px`, `${endHeight}px`] },
      { duration: 260, easing: "cubic-bezier(.4, 0, .2, 1)" },
    );

    return new Promise((resolve) => {
      animation.onfinish = () => {
        details.open = open;
        details.style.height = "";
        details.style.overflow = "";
        animation = null;
        resolve();
      };
    });
  }

  summary.addEventListener("click", async (event) => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    const open = !details.open;
    if (open) await loadSource();
    await setOpen(open);
    busy = false;
  });
})();

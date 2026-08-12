(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const details = document.querySelector(".deploy-details");
  const detailsSummary = details?.querySelector("summary");

  if (details && detailsSummary && !reducedMotion) {
    let animation = null;
    let targetOpen = details.open;

    detailsSummary.addEventListener("click", (event) => {
      event.preventDefault();
      targetOpen = !targetOpen;

      const startHeight = details.getBoundingClientRect().height;
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
      }
      details.style.height = "";

      let endHeight;
      if (targetOpen) {
        details.open = true;
        endHeight = details.getBoundingClientRect().height;
      } else {
        details.open = false;
        endHeight = details.getBoundingClientRect().height;
        details.open = true;
      }

      details.style.height = `${startHeight}px`;
      details.style.overflow = "hidden";
      animation = details.animate(
        { height: [`${startHeight}px`, `${endHeight}px`] },
        { duration: 320, easing: "cubic-bezier(.4, 0, .2, 1)" },
      );
      animation.onfinish = () => {
        details.open = targetOpen;
        details.style.height = "";
        details.style.overflow = "";
        animation = null;
      };
    });
  }

  function typingDelay() {
    return 55 + (Math.random() * 30 - 15);
  }

  function spin(button) {
    button.classList.remove("is-spinning");
    void button.offsetWidth;
    button.classList.add("is-spinning");
    button.addEventListener("animationend", () => button.classList.remove("is-spinning"), { once: true });
  }

  function railTo(terminal, row) {
    const output = terminal.querySelector(".clack-output");
    const rail = output?.querySelector(".clack-rail");
    const glyph = row?.querySelector(".clack-glyph");
    if (!output || !rail || !glyph) return;
    const glyphHeight = glyph.getBoundingClientRect().height;
    rail.style.height = `${row.offsetTop + glyphHeight / 2 - parseFloat(getComputedStyle(rail).top)}px`;
  }

  function resetRail(terminal) {
    const rail = terminal.querySelector(".clack-rail");
    if (rail) rail.style.height = "0px";
  }

  function completeRail(terminal, steps) {
    railTo(terminal, steps[steps.length - 1]);
  }

  function keepRailMeasured(terminal, steps) {
    const update = () => {
      const visible = [...steps].filter((step) => step.classList.contains("visible"));
      if (visible.length) railTo(terminal, visible[visible.length - 1]);
    };
    window.addEventListener("resize", update);
  }

  function animateDeploy() {
    const terminal = document.querySelector("[data-server-cli]");
    const typed = terminal?.querySelector("[data-server-typed]");
    const cursor = terminal?.querySelector("[data-server-cursor]");
    const steps = terminal?.querySelectorAll(".deploy-step");
    const replay = terminal?.querySelector(".terminal-replay");
    if (!terminal || !typed || !cursor || !steps) return;

    const command = "git push origin main";
    let generation = 0;

    function run(delay = 0) {
      const current = ++generation;
      typed.textContent = "";
      cursor.classList.remove("done");
      replay?.classList.remove("is-ready");
      steps.forEach((step) => step.classList.remove("visible", "complete"));
      resetRail(terminal);

      if (reducedMotion) {
        typed.textContent = command;
        cursor.classList.add("done");
        steps.forEach((step) => step.classList.add("visible", "complete"));
        completeRail(terminal, steps);
        replay?.classList.add("is-ready");
        return;
      }

      terminal.classList.add("is-animated");

      function reveal(step) {
        if (current !== generation || step >= steps.length) return;
        const row = steps[step];
        row.classList.add("visible");
        railTo(terminal, row);
        setTimeout(() => {
          if (current !== generation) return;
          row.classList.add("complete");
          if (step === steps.length - 1) replay?.classList.add("is-ready");
          else setTimeout(() => reveal(step + 1), 200);
        }, 300);
      }

      function type(character) {
        if (current !== generation) return;
        if (character < command.length) {
          typed.textContent += command[character];
          setTimeout(() => type(character + 1), typingDelay());
          return;
        }
        cursor.classList.add("done");
        setTimeout(() => reveal(0), 350);
      }

      setTimeout(() => type(0), delay);
    }

    replay?.addEventListener("click", () => {
      spin(replay);
      run(80);
    });
    keepRailMeasured(terminal, steps);
    run(600);
  }

  function animatePromptTerminal(terminal, command) {
    const typed = terminal?.querySelector("[data-setup-typed]");
    const cursor = terminal?.querySelector("[data-setup-cursor]");
    const steps = terminal?.querySelectorAll(".setup-step");
    const replay = terminal?.querySelector(".terminal-replay");
    if (!terminal || !typed || !cursor || !steps) return;

    let generation = 0;
    let observer = null;
    if (!reducedMotion) terminal.classList.add("is-animated");

    function run(delay = 0) {
      const current = ++generation;
      typed.textContent = "";
      cursor.classList.remove("done");
      replay?.classList.remove("is-ready");
      steps.forEach((step) => step.classList.remove("visible"));
      resetRail(terminal);

      if (reducedMotion) {
        typed.textContent = command;
        cursor.classList.add("done");
        steps.forEach((step) => step.classList.add("visible"));
        completeRail(terminal, steps);
        replay?.classList.add("is-ready");
        return;
      }

      terminal.classList.add("is-animated");

      function reveal(step) {
        if (current !== generation) return;
        if (step >= steps.length) {
          replay?.classList.add("is-ready");
          return;
        }
        steps[step].classList.add("visible");
        railTo(terminal, steps[step]);
        setTimeout(() => reveal(step + 1), 500);
      }

      function type(character) {
        if (current !== generation) return;
        if (character < command.length) {
          typed.textContent += command[character];
          setTimeout(() => type(character + 1), typingDelay());
          return;
        }
        cursor.classList.add("done");
        setTimeout(() => reveal(0), 350);
      }

      setTimeout(() => type(0), delay);
    }

    replay?.addEventListener("click", () => {
      observer?.disconnect();
      spin(replay);
      run(80);
    });

    keepRailMeasured(terminal, steps);
    if (reducedMotion) {
      run();
    } else if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        run();
      }, { threshold: 0.25 });
      observer.observe(terminal);
    } else {
      run();
    }
  }

  animateDeploy();
  animatePromptTerminal(document.querySelector("[data-setup-cli]"), "curl -fsSL https://shibumistack.dev/install/server | bash");
  animatePromptTerminal(document.querySelector("[data-app-cli]"), "shis add sub.example.com");
})();

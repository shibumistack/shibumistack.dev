(() => {
  const terminal = document.querySelector("[data-server-cli]");
  const typed = terminal?.querySelector("[data-server-typed]");
  const cursor = terminal?.querySelector("[data-server-cursor]");
  const steps = terminal?.querySelectorAll(".deploy-step");
  if (!terminal || !typed || !cursor || !steps) return;

  const command = "git push origin main";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    typed.textContent = command;
    cursor.classList.add("done");
    return;
  }

  terminal.classList.add("is-animated");
  let character = 0;

  function reveal(step) {
    if (step >= steps.length) return;
    steps[step].classList.add("visible");
    setTimeout(() => reveal(step + 1), 420);
  }

  function type() {
    if (character < command.length) {
      typed.textContent += command[character];
      character += 1;
      setTimeout(type, 48);
      return;
    }
    cursor.classList.add("done");
    setTimeout(() => reveal(0), 280);
  }

  setTimeout(type, 400);
})();

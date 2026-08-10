(() => {
    const command = "bun create shibumi@latest";
    const terminal = document.querySelector(".cli");
    const typed = document.getElementById("typed");
    const cursor = document.getElementById("cursor");
    const steps = terminal?.querySelectorAll(".cli-step");
    const replay = terminal?.querySelector(".terminal-replay");
    if (!terminal || !typed || !cursor || !steps) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let generation = 0;

    function run(delay = 0) {
        const current = ++generation;
        typed.textContent = "";
        cursor.classList.remove("done");
        replay?.classList.remove("is-ready");
        steps.forEach((step) => step.classList.remove("visible"));

        if (reducedMotion) {
            typed.textContent = command;
            cursor.classList.add("done");
            steps.forEach((step) => step.classList.add("visible"));
            replay?.classList.add("is-ready");
            return;
        }

        function reveal(step) {
            if (current !== generation) return;
            if (step >= steps.length) {
                replay?.classList.add("is-ready");
                return;
            }
            steps[step].classList.add("visible");
            setTimeout(() => reveal(step + 1), 500);
        }

        function type(character) {
            if (current !== generation) return;
            if (character < command.length) {
                typed.textContent += command[character];
                setTimeout(() => type(character + 1), 55 + (Math.random() * 30 - 15));
                return;
            }
            cursor.classList.add("done");
            setTimeout(() => reveal(0), 350);
        }

        setTimeout(() => type(0), delay);
    }

    replay?.addEventListener("click", () => {
        replay.classList.remove("is-spinning");
        void replay.offsetWidth;
        replay.classList.add("is-spinning");
        replay.addEventListener("animationend", () => replay.classList.remove("is-spinning"), { once: true });
        run(80);
    });

    run(600);
})();

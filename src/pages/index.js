(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function typingDelay() {
        return 55 + (Math.random() * 30 - 15);
    }

    function spin(button) {
        button.classList.remove("is-spinning");
        void button.offsetWidth;
        button.classList.add("is-spinning");
        button.addEventListener("animationend", () => button.classList.remove("is-spinning"), { once: true });
    }

    function animateTerminal(terminal, command, startAboveFold = false) {
        const typed = terminal.querySelector("[data-home-typed], #typed");
        const cursor = terminal.querySelector("[data-home-cursor], #cursor");
        const steps = terminal.querySelectorAll(".cli-step");
        const replay = terminal.querySelector(".terminal-replay");
        const rail = terminal.querySelector(".home-clack-rail");
        if (!typed || !cursor || !steps.length || !rail) return;

        let generation = 0;
        let observer = null;

        function railTo(row) {
            const glyph = row?.querySelector(".home-clack-glyph");
            if (!glyph) return;
            rail.style.height = `${row.offsetTop + glyph.getBoundingClientRect().height / 2 - parseFloat(getComputedStyle(rail).top)}px`;
        }

        function run(delay = 0) {
            const current = ++generation;
            typed.textContent = "";
            cursor.classList.remove("done");
            replay?.classList.remove("is-ready");
            rail.style.height = "0px";
            steps.forEach((step) => step.classList.remove("visible"));

            if (reducedMotion) {
                typed.textContent = command;
                cursor.classList.add("done");
                steps.forEach((step) => step.classList.add("visible"));
                railTo(steps[steps.length - 1]);
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
                railTo(steps[step]);
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
        window.addEventListener("resize", () => {
            const visible = [...steps].filter((step) => step.classList.contains("visible"));
            if (visible.length) railTo(visible[visible.length - 1]);
        });

        if (reducedMotion) run();
        else if (startAboveFold) run(600);
        else if ("IntersectionObserver" in window) {
            observer = new IntersectionObserver((entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                observer.disconnect();
                run();
            }, { threshold: .25 });
            observer.observe(terminal);
        } else run();
    }

    const hero = document.querySelector(".cli");
    if (hero) animateTerminal(hero, "bun create shibumi@latest", true);
    document.querySelectorAll("[data-home-terminal]").forEach((terminal) => {
        animateTerminal(terminal, terminal.dataset.command ?? "");
    });
})();

(() => {
        const text = "bun create shibumi@latest";
        const typed = document.getElementById("typed");
        const cursor = document.getElementById("cursor");
        const steps = document.querySelectorAll(".cli-step");
        if (!typed || !cursor) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            typed.textContent = text;
            cursor.classList.add("done");
            steps.forEach((s) => s.classList.add("visible"));
            return;
        }

        // ms to wait after each step appears before showing the next
        const delays = [
            400,   // header → dir
            700,   // dir → theme
            900,   // theme → done
            250,   // done → next
            250,   // next → docs
        ];

        let i = 0;

        function type() {
            if (i < text.length) {
                typed.textContent += text[i];
                i++;
                setTimeout(type, 55 + (Math.random() * 30 - 15));
                return;
            }
            cursor.classList.add("done");
            setTimeout(() => revealSteps(0), 350);
        }

        function revealSteps(idx) {
            if (idx >= steps.length) return;
            steps[idx].classList.add("visible");
            const delay = delays[idx] ?? 250;
            setTimeout(() => revealSteps(idx + 1), delay);
        }

        setTimeout(type, 600);
    })();

# Design.md — Shibumi Stack

The design has to embody the name. Anything visually loud or trend-chasing fights the brand. The page itself should be the first proof that the philosophy works.

## Core principle

**The page is the manifesto.** A visitor should understand what Shibumi means before they finish reading. Not because the copy explains it (though it does), but because the design feels like it.

If the landing page looks like every other dev tool landing page from 2025 (gradient hero, animated background, six-card feature grid, glassmorphism), the brand is dead on arrival.

---

## Typography

**Treat type as the primary visual element.** No big illustrations, no hero screenshots, no animations. Type carries everything.

- **Body / UI:** A high-quality serif for body text. Recommended: **Source Serif 4**, **Newsreader**, or **EB Garamond**. Serif signals: this is meant to be read, not skimmed. It's old-feeling on purpose.
- **Display / headings:** Same serif at larger sizes, or a quiet sans like **Inter** or **IBM Plex Sans** at controlled weights (400 and 500 only, never 700+).
- **Mono:** **JetBrains Mono**, **IBM Plex Mono**, or **Berkeley Mono** for code blocks. One mono only. No decorative monos.
- **Japanese character (渋み):** Should appear once, prominently, large. Probably under or beside the wordmark. Use a thoughtful Japanese typeface (Noto Serif JP or a system fallback). It's a visual anchor, not decoration.

**Type scale:** Modular, tight. Prefer fewer sizes. Recommended scale: 14, 16, 20, 28, 48, 72px. That's it.

**Line length:** 60-70 characters max for body. The page should breathe.

---

## Color

**Off-white background, warm dark text. That's the palette.**

- **Background:** `#FAF8F4` (warm off-white, like aged paper) or `#F5F2EB` (slightly more warmth)
- **Text primary:** `#1A1A1A` or `#23201C` (warm near-black)
- **Text secondary:** `#5C5852` (warm gray for de-emphasized text)
- **Accent:** **One** accent color. Recommended: a deep persimmon `#A14B2C` (the literal color of the ripe persimmon that gives Shibumi its name). Used sparingly: links, the Japanese character, maybe a single underline somewhere.
- **Borders/dividers:** `#E5E0D8` (barely-there warm gray)
- **Code background:** `#F0EBE0` (slightly darker than page bg, no syntax highlighting needed)

**Dark mode:** `#1A1A1A` background, `#E8E2D6` text, same persimmon accent (`#C76647` in dark mode for visibility). Implement it, but the light mode is the canonical experience.

**No gradients. No shadows beyond a single 1px hairline. No glow effects.**

---

## Layout

**Single column. Centered. ~640px max content width.**

- The whole page should feel like a well-set book page, not a marketing site
- No sidebar, no nav bar (or a nearly invisible one), no footer with 40 links
- Sections separated by space, not by colored panels or cards
- One hairline divider style (`1px solid var(--border)`) used sparingly

**Vertical rhythm:** Generous. 4-6rem of space between major sections. The page should feel calm to scroll through.

**No grid of feature cards.** That's the most overused pattern in dev tooling and it directly contradicts Shibumi. Use prose with bold lead-ins instead.

---

## Imagery

**Almost none.** The temptation will be to add diagrams, illustrations, dashboards. Resist.

If anything visual appears beyond type, it should be:

1. **A single ink-style mark** as a logo or section divider. A simple persimmon shape, or an enso (zen circle), or just the 渋み character treated as a visual element. One mark, used once or twice.
2. **A single code block** showing the install command. Plain, no syntax highlighting needed (or extremely subtle).
3. Optional: a small ASCII-style diagram of the stack architecture, set in mono. Text-as-image.

**No screenshots. No illustrations of happy developers. No isometric 3D anything.**

---

## Motion

**Almost none.**

- No scroll-triggered animations
- No parallax
- No fade-in-on-load for sections
- No animated typing effects
- Smooth scroll on anchor links is acceptable
- Single subtle hover state on links (color change, no transform)

If something moves, it should be because the user moved it (a link hover, a button click). The page itself is still.

---

## Components

**Minimum viable component set:**

- Body text (the serif)
- Headings (h1, h2, h3 — and that's enough)
- Links (persimmon, no underline by default, underline on hover)
- Inline code (mono, slight background tint)
- Code block (mono, slightly darker background, no border)
- Hairline divider
- One button style (only used for the install command "copy" affordance, if any)

That's the entire design system. If you find yourself adding a ninth component, the brand is slipping.

---

## The hero

**No hero image. No animation. No CTA-pair-with-secondary-button.**

Just:
1. The wordmark "Shibumi Stack" in the display serif
2. The 渋み character, large, beneath or beside it
3. A single sentence in body type explaining what it is
4. One link to the GitHub repo
5. Whitespace

If a visitor's first scroll feels too plain, the design is correct. The whole point is that nothing screams for attention. The substance does.

---

## Tone of voice in copy

- Short sentences. Active voice.
- No "delightful," "blazing fast," "developer experience," "next-generation," or any other industry filler.
- Honest about tradeoffs. Say what it's not, not just what it is.
- One opinion per sentence. Don't hedge.
- No exclamation points anywhere.

---

## Inspiration (look at these, not at typical dev tool sites)

- **htmx.org** — for the "boring as a feature" tone
- **bun.sh** — for warm minimalism with a cute mascot (optional element to consider)
- **iA Writer's website** — for serif-driven typography
- **A book of poetry** — for layout and pacing
- **Kinfolk magazine** — for editorial calm
- **Old MoMA exhibition catalogs** — for restrained typography with one accent color

**Avoid looking at:** Vercel, Next.js, any AI startup landing page from the last two years, any site with "the modern way to build X" in the hero.

---

## Implementation notes

- Static HTML or Astro single page (yes, you removed Astro from the stack, but for a marketing page it's fine — eat your own cooking elsewhere)
- Or build it in the stack itself: Bun + Hono serving static HTML with Alpine for the dark mode toggle. That's actually the strongest move: the landing page is built in the stack it's selling.
- Lighthouse 100 across the board. The page itself should demonstrate the values: fast, small, no bloat, ages well.
- View source should be readable. Inline the CSS. Single file if possible. Someone curious enough to inspect the page should find the same restraint there.

---

## What to actively avoid

- Cards
- Gradients
- Drop shadows beyond hairlines
- Any animation that wasn't requested by the user
- More than one accent color
- Sans-serif body type
- Marketing copy adjectives ("blazing," "delightful," "modern")
- A pricing section (it's open source)
- Testimonials block
- "Trusted by" logo wall
- Newsletter signup
- Live chat widget
- Any chrome that exists to "increase engagement"

The site should feel like reading a thoughtful essay, not visiting a SaaS landing page. Every design decision should pass this test: *does this announce itself, or does it stay quiet?*

If it announces itself, cut it.

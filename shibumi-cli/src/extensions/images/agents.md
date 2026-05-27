
## Images (added via shibumi add images)

- Middleware: `src/middleware/images.ts` — intercepts image requests, converts to WebP
- Usage: `app.use("/images/*", imageMiddleware())` in your Hono app
- Originals stay in `public/images/` — never modified or deleted
- WebP cache goes to `public/images/optimized/` — add to `.gitignore`
- No HTML changes needed — `<img src="/images/hero.png">` just works
- To revert: delete `public/images/optimized/` and remove the middleware line

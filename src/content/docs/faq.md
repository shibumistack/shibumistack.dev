# FAQ

Every question here came from a real deploy hitting a real wall. The answers explain what the tooling did and why it was right to do it.

## Why do I need to push if Ship uploads the image?

The server refuses to run anything it cannot verify. Every image carries labels naming the commit and Git tree it was built from. Before starting anything, the server fetches that commit from GitHub, resolves the tree itself, and compares both against the labels. No match, no deploy. The push exists so the server can see the commit it is checking against.

You don't push manually. `bun ship` builds from committed HEAD, uploads the image, then pushes, then asks the server to deploy. The one manual push is the first one, when the repository is new and setup clones it server-side.

## Why did Ship stop with "working tree has uncommitted changes"?

Ship builds with `git archive`, which packs committed HEAD and nothing else. Your uncommitted edits would not be in the deployed app, and you would not find out until production disagreed with your editor. Ship stops instead. Commit or stash, run `bun ship` again.

## Does `bun dev` work before I set up a server?

Yes. Without `shibumi-server.json` the app runs on port 9000. After setup it runs on the port the server assigned, which is also the first free port above 9000, so the number in your terminal is the number in production.

## Where does my data live, and does rollback touch it?

SQLite sits on a volume at `/data`, outside the image. Deploys and rollbacks swap images; the database never moves. The scaffold's counter is the proof: increment it, deploy, roll back, and the count is still there. Each migration also writes a backup before it runs.

## Where do secrets and per-deploy config go?

On the server. `bun ship:env set KEY=value` stores them there and injects them into the container at the next deploy. They survive rollback, never enter the repository, and `list` prints names without values. Non-secret tunables (upload limits, rate windows) belong in committed `src/config/*.yaml` files instead. Details in [Environment and secrets](https://server.shibumistack.dev/docs/app-env).

## Why do my form POSTs return 403 in production?

The CSRF check compares the browser's `Origin` header against `APP_ORIGIN`. Unset or wrong, and every form submission is refused, while JSON API calls keep working, which makes this one confusing to debug. Fix: `bun ship:env set APP_ORIGIN=https://your-domain`, then redeploy.

## Why can't I register the admin email?

Addresses in `ADMIN_EMAILS` are blocked from self-service registration so an attacker cannot claim your admin account by signing up first. Sign in with a login link, which proves you control the inbox, or seed the account directly; `agents/admin.md` in your project shows both.

## Can I add a write endpoint to the scaffold?

The templates ship exactly one unauthenticated mutation on purpose, the demo counter: one shared row, clamped by a database constraint, rate-limited per IP. Anything that touches user data needs authentication first (`bun shi add auth`) and a `requireAuth` guard on the route. If you forget, the route-guard test fails and reminds you.

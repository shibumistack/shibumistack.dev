# FAQ

Questions that come up in real projects, with the reasoning behind the behavior.

## Why do I need to push if Ship uploads the image?

Because the server refuses to run anything it cannot verify. Every image is labeled with the commit and Git tree it was built from. At deploy time the server fetches that commit from GitHub, resolves the tree independently, and compares both against the image labels. If they do not match, nothing starts. The push is what makes the commit visible to the server for that check.

You never push manually: `bun ship` builds from committed HEAD, uploads the image, then pushes, then asks the server to deploy. The only manual push is the first one, when the repository is created and setup clones it server-side.

## Why did Ship stop with "working tree has uncommitted changes"?

Ship builds from committed HEAD only, using `git archive`. Uncommitted files are invisible to the build, so a dirty tree means the deployed app would silently differ from what you see locally. Commit or stash, then run `bun ship` again.

## Does `bun dev` work before I set up a server?

Yes. Without `shibumi-server.json` it runs the app on port 9000; after setup it uses the app's registered port. Registered apps get the first free port above 9000, so local and deployed behavior match.

## Where does my data live, and does rollback touch it?

SQLite lives on a volume at `/data`, outside the image. Deploys and rollbacks swap images only; the database is untouched. The scaffold's counter demonstrates this: increment it, deploy, roll back, and the count is still there. Backups run automatically before each migration.

## Where do secrets and per-deploy config go?

On the server, never in the repository: `bun ship:env set KEY=value`, applied to the container at the next deploy. Values survive rollback and are listed by name only. Tunable non-secret limits live in committed `src/config/*.yaml` files instead. See [Environment and secrets](https://server.shibumistack.dev/docs/app-env).

## Why do my form POSTs return 403 in production?

The CSRF check compares the browser's `Origin` header against `APP_ORIGIN`. If `APP_ORIGIN` is unset or wrong, every form submission is refused. Set it with `bun ship:env set APP_ORIGIN=https://your-domain` and redeploy. JSON API calls are unaffected.

## Why can't I register the admin email?

Addresses in `ADMIN_EMAILS` are reserved from self-service registration so nobody can claim the admin account before you. Sign in with a login link (proves inbox control) or seed the account; `agents/admin.md` in your project has both paths.

## Can I add a write endpoint to the scaffold?

The templates ship one deliberate unauthenticated mutation, the demo counter: a single clamped row with a rate limit. For anything touching user data, add authentication first (`bun shi add auth`) and put the route behind `requireAuth`. The route-guard test will remind you.

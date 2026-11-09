# Agent notes

This repo is the org's publishing point: the artifacts the other shibumistack repos consume (Ship client, design tokens, written versions) are cut here and served from this domain. When something is published here, the follow-ups below are owed — the full Ship flow lives in `create-shibumi/PUBLISHING.md` → "Ship client releases".

## Publishing a Ship client version (vN+1)

1. Add `public/ship/vN+1.ts`; point `/ship/latest.ts` at it in `src/app.ts`.
2. Cut a new installer `public/ship/install-vM.ts`: source URL → vN+1, append the new sha256 to `knownSourceHashes`; point `/install/ship` at it (`src/app.ts`).
3. Update `src/content/ship.md` (Source URL), `scripts/build.ts`, and `test/app.test.ts` (source + installer + retention boundary).
4. Deploy this site so `latest.ts` actually serves vN+1.
5. Consumers must then sync their locks — create-shibumi, shibumi-forms, shibumi-server: each bumps `scripts/ship.lock.json` and runs `bun run sync:ship` — and this repo's own `scripts/ship.ts` stays byte-identical to what latest serves.
6. Prune per the retention policy (current + previous two CLI versions; current installer; current bootstrap). The version-boundary assertions in `test/app.test.ts` encode the policy; update them with every prune.

## Version fields in package.json

- `createShibumiVersion`: bump on every create-shibumi release — the generator meta on all pages reads it (`Shibumistack.dev v{{generator-version}}`).
- `shibumiServerVersion`: bump on every shibumi-server release — `/install/server` and the docs' `{{server-version}}` tokens read it.
- Both are validated as stable semver at app boot; a bump with no release behind it fails nowhere, a release with no bump drifts the published tag.

## Shared design tokens

`public/shibumi.css` is the canonical design layer; forms and server vendor copies and re-pull with their `sync-shibumi-css.sh`. Change it here with plain selectors scoped under `.shell`, never bare `header`/`footer` (child apps nest those).
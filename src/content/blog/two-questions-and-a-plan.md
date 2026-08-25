---
title: Two questions and a plan
date: 2026-08-25
excerpt: Create and setup lost seven prompts between them. What is left is two real inputs, a plan you approve once, and one opt-in command.
---

# Two questions and a plan

I spent an evening walking every prompt in Shibumi one clack screen at a time, writing down what each question was for. Most of them were for me. They existed because I had implemented an option and then felt obliged to expose it.

Two questions in the whole product turned out to be real: where your server is, and what domain the app should answer on. Everything else was a default I had been too shy to commit to, a fact I could have printed instead of asked, or a feature that deserved its own command.

This lands in `create-shibumi` 0.3.0 and `shibumi-server` 0.10.7.

## Create asks three things

```text
┌  渋み shibumi
│
◆  Project name?
│  quiet-bamboo
│
◆  What are you shipping?
│  ● Bun full-stack app (recommended)
│      Hono, Alpine, and SQLite with migrations and backups
│  ○ Blog
│      Astro: posts, RSS, sitemap, SEO meta, llms.txt
│  ○ Static site
│      Any framework's build output: dist/, public/, _site/, or plain files
│
◆  Deploy to a VPS now?
│  ○ Yes / ● Later
```

The menu used to have four items and a follow-up question. The Bun web app is gone from it. That template was the full-stack one with the database removed, which gave me two starters to keep in sync and a menu whose top two options differed by a single dependency. If you want the app without SQLite, delete `src/db`, the migrations, and the `db:*` scripts. You own the source. Removing a piece is an ordinary edit, and it does not need to be a product decision I make for you in a select.

The blog moved up. It used to sit behind Static site under a second question that asked where you wanted to start from, which meant the template most people came for was the one they had to dig for.

## Setup shows its work

Setup used to ask eleven things. Some were genuine, some were me narrating. Now it asks for the SSH target and the domain, prints what it intends to do, and does all of it when you say yes:

```text
●  Plan
│  Create private repo bitbonsai/quiet-bamboo, push main
│  Connect to alpha, save target for this project
│  Install or upgrade shibumi-server (sudo password once)
│  Register quiet-bamboo.dev
│  Commit and push deployment files
│  Deploys run on: bun ship
◆  Run setup?
```

Nothing touches disk before you accept that. Cancelling really does leave the directory as you found it, which is the part that made the plan worth building rather than just printing a summary after the fact.

Two things still ask for themselves, because the plan cannot honestly speak for them. The GitHub sign-in opens a browser. The Caddy cutover moves live traffic. Everything the plan enumerates is covered by the one confirm, and `bun ship:setup --interactive` puts the old gates back if you want to watch each step.

A missing GitHub origin used to be an error with a lecture attached. Setup now offers to create the repository and push it. Private by default, `--public` when you mean it. I removed the visibility question because I have never once wanted the other answer at that moment.

## The webhook left the default path

Setup used to install a GitHub webhook. Working out why cost me longer than it should have, because the answer is that it did nothing. The default trigger is `bun ship`, which builds the image on your machine, uploads it over SSH, and asks the server to deploy that commit. By the time a webhook could fire, the deploy is done.

For that unused hook, setup was charging a GitHub sign-in and an `admin:repo_hook` grant on your repository. Those are the two heaviest things it asked for, and they bought nothing on the path almost everyone takes.

Push-to-deploy is now a command:

```sh
bun ship:webhook
```

It installs the hook and switches the committed trigger together, in that order, and takes the hook back down if the switch fails. An active hook therefore always means pushes deploy. `bun ship:webhook --off` reverses both halves. Projects configured before this existed keep the trigger they already have, and running `bun ship:setup` will not quietly change it.

## Bring your own project

`bun create shibumi .` adds deployment to a project that already exists. It reads your dependencies and config to find where the build lands (`astro` to `dist`, `@11ty/eleventy` to `_site`, `next` to `out`, `vite` to `dist`), vendors the ship client, generates the container files, and leaves everything else exactly as it was.

The interesting part was deciding when to refuse. It stops rather than guessing in three cases: a `Dockerfile` or `compose.yaml` it did not write may package something else entirely; a `start` script means the project is a server app and `bun ship:setup` is the right entry; and an `index.html` at the project root has no directory to serve, because a static image serves one directory and never the whole checkout. Each refusal prints the one command that fixes it.

## Server day two

Swapping the repository behind a live domain took me a sudo remove, a re-add, and a manual `mv` last week. That is now one command:

```sh
shis set-repository example.com github:owner/new-repository
```

The old checkout moves to `.bak`, the new repository is cloned in its place, and the Compose path is re-detected in the new tree rather than assumed from the old one. `shis add` makes the same offer when it finds a checkout whose origin points somewhere unexpected, instead of the dead-end error it used to print. `shis remove` now says out loud what it kept, since a preserved checkout is exactly the thing that surprises you an hour later when you re-add under a different repository.

The installer also puts `shis` on the non-interactive PATH, which is embarrassing to write down. `ssh alpha shis` used to answer "command not found" while the same command worked fine in an interactive shell.

## What I would tell myself

A prompt is a decision you are refusing to make. Sometimes that is right, because the answer is genuinely yours to give. More often it is a default I had not thought hard enough about, and asking felt safer than choosing. Astro asks about four things and gets out of your way, and it took me a while to see that as a standard rather than a stylistic preference.

The counting helped. Create went from four stops to three, setup from eleven to four. Whenever I could not say in one sentence what a question was for, it was not a question.

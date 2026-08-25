# Static template

![The scaffolded static site: plain files served from public/](/docs/templates/static.png)

Every file in `public/` is a page. The production image is busybox httpd on `scratch`, which is where the 1.4 MB comes from: there is no runtime in it, just the server binary and your files.

```sh
bun create shibumi@latest my-site --template static
```

## What lands in your repo

- `public/` with an `index.html`, a stylesheet, and a `404.html` to replace
- A local preview server behind `bun dev`
- `Dockerfile`, `compose.yaml`, and the deploy script

## Using a framework instead

Writing with Astro, Jekyll, Eleventy, or anything else that builds to a directory? You don't need this template: run [`bun create shibumi .`](/docs/cli) inside that project and Ship deploys its build output directly.

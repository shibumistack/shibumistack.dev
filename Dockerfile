FROM oven/bun:1-alpine@sha256:5acc90a93e91ff07bf72aa90a7c9f0fa189765aec90b47bdbf2152d2196383c0 AS build

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM busybox:1.37-musl@sha256:fc6dddc4c44b1bfe37f41cae8e67d1693828e8f42a91862816d7953e2c9d3f23 AS busybox

FROM scratch
COPY --from=busybox /bin/busybox /busybox
COPY --from=build --chown=65534:65534 /app/dist /www
USER 65534:65534
EXPOSE 3000
ENTRYPOINT ["/busybox", "httpd", "-f", "-p", "3000", "-h", "/www", "-c", "/www/httpd.conf"]

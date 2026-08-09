# shibumi-server

`shibumi-server` is an experimental, open-source Bun service for signed webhook deployments to a VPS running rootless Podman behind Caddy.

## Planned installation

```sh
bunx shibumi-server init
bunx shibumi-server add myapp.com
```

The installer will place a pinned copy on the host and create a systemd service. Caddy remains the only public HTTP server. The webhook receiver and application ports listen on loopback.

## Deployment flow

1. **Verify:** Check GitHub's `X-Hub-Signature-256` HMAC over the raw body, then match the configured repository and exact branch.
2. **Lock:** Allow one deployment per app. A second request receives `409 Conflict` and is not queued.
3. **Preflight:** Require configured free-memory and free-disk floors before changing the checkout.
4. **Fetch:** Fetch the configured branch and require its commit to match the signed webhook SHA. Do not use ambiguous `git pull` behavior.
5. **Build:** Build locally with rootless Podman while the existing container keeps serving.
6. **Test:** Run configured tests inside the new image. A failure stops before replacement.
7. **Start:** Start the replacement on its explicit localhost port and poll its health endpoint.

## Resource safety

The default preflight requires 2 GiB of available memory and 4 GiB of free space on the checkout filesystem. A Compose build is killed with its process group after 10 minutes by default. The example systemd unit also limits memory, swap, CPU, and task count so a failed build is less likely to take the host with it. Application services define their own Compose resource limits.

These values are configurable, but a small production VPS should always reserve capacity for the operating system, SSH, Caddy, and existing apps. Framework-heavy builds still belong on a larger builder or in CI when they cannot fit safely.

## Ports and Caddy

The machine-local configuration assigns each web app a unique host port. Compose binds it only to loopback:

```yaml
ports:
  - "127.0.0.1:${SHIBUMI_PORT}:3000"
```

Caddy maps public domains to those ports:

```caddy
myapp.com {
  reverse_proxy 127.0.0.1:9100
}

another.app {
  reverse_proxy 127.0.0.1:9101
}
```

Databases and workers remain private inside each Compose network.

## Public code, private machine

The public repository contains the server, CLI, tests, configuration schema, container templates, and generic Caddy/systemd examples.

The VPS stores webhook secrets, repository credentials, actual paths and ports, environment files, application data, deployment state, and logs. Public configuration examples reference secret environment-variable names but never secret values.

## Status

The signed GitHub webhook, resource preflight and build deadline, exact-commit checkout, per-app lock, Podman build/test/start pipeline, health check, and disposable integration test exist now. Installation automation, Caddy API changes, port allocation, durable delivery state, and health-check rollback come after dogfooding.

Source: <https://github.com/bitbonsai/shibumi-server>

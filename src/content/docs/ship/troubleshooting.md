# Ship troubleshooting

Ship stops before changing production when a local tool or server check fails. Follow the `Next:` line in the error first. Each error links to its section here.

## Docker engine

Ship prints this when the Docker CLI cannot reach the container engine used for local image builds:

```text
Docker cannot reach your container engine.
```

The rest of this section covers a stopped engine. If the failure is a socket permission error instead, jump to [the socket permission section](#if-the-socket-refuses-your-user).

Start or restart the engine, using the command that matches your setup.

### If the socket refuses your user

A running engine still refuses access when the Docker socket denies your user:

```text
permission denied while trying to connect to the Docker API at unix:///var/run/docker.sock
```

The Docker socket is owned by the `docker` group, so your session needs that group. Check whether your account is already a member:

```sh
getent group docker
```

If your account is listed but the error persists, your shell session started before the group change and does not have it yet. Either log out and back in, or rerun the Ship command in a shell that has the group:

```sh
# interactive: start a docker-group shell, then rerun the Ship command there
newgrp docker
# non-interactive (scripts and agents): run the Ship command once with the group
sg docker -c 'bun scripts/ship.ts'
```

If your account is not listed, add it, then log out and back in:

```sh
sudo usermod -aG docker "$USER"
```

Rerun `docker info` before `bun ship`; it prints both `Client` and `Server` sections when the connection works.

### Colima

```sh
colima restart
```

### Podman machine

```sh
podman machine restart
```

### Docker Desktop

Open Docker Desktop. If it already reports running, restart it from the Docker Desktop menu.

Then verify the connection:

```sh
docker info
```

A working connection prints both `Client` and `Server` sections. Once it does, retry:

```sh
bun ship
```

### If the engine says it is already running

A running VM can still have a stale or missing Docker socket. Restarting the engine recreates that connection. This briefly stops local containers but preserves their images, volumes, and engine VM state.

### If Docker still cannot connect

Check which endpoint the Docker CLI selected:

```sh
docker context ls
docker context inspect
```

The active context has an asterisk in `docker context ls`. `DOCKER_HOST` or `DOCKER_CONTEXT` can override that selection. Check for either variable:

```sh
env | grep -E '^DOCKER_(HOST|CONTEXT)='
```

Fix the selected context or environment override, then rerun `docker info` before `bun ship`.

Current reviewed Ship source: [`ship.ts`](https://shibumistack.dev/ship/latest.ts).

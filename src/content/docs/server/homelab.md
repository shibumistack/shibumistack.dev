# Host from your homelab

A homelab is a computer at home that stays on and serves things: a mini PC on a shelf, a Raspberry Pi behind the router, an old laptop with the lid closed. shibumi-server treats it exactly like a rented VPS. If the box runs Linux, has SSH, and can receive traffic on ports 80 and 443, every page in this section applies unchanged.

Why bother when a VPS costs €5 a month? Hardware you already own costs €0 a month, a used mini PC pays for itself against cloud bills within a year, and the data never leaves the building. The trade is that reachability becomes your job. The sections below cover the parts a VPS provider normally does for you.

## Pick the hardware

Anything 64-bit that runs mainstream Linux works. Both amd64 and arm64 images are supported.

- A used mini office desktop, the paperback-sized kind companies buy by the thousand (Dell OptiPlex Micro, Lenovo ThinkCentre Tiny, HP EliteDesk Mini), is the classic pick: quiet, 10 to 15 W idle, often under €150 refurbished.
- A new N100 or N150 mini PC gets you the same footprint with a warranty.
- A Raspberry Pi 5 with an NVMe HAT handles a handful of Bun apps comfortably.
- An old laptop is free and ships with its own UPS (the battery).

4 GB of RAM is enough to start; 8 GB or more is comfortable once several apps share the box. SQLite means no database server competing for memory.

## Prepare the box

Install Debian or Ubuntu Server, the two distributions almost every guide assumes. During setup:

1. Create a normal user; that user will own deployments.
2. Enable SSH with key login and turn off password authentication.
3. Give the box a fixed address on your LAN (a DHCP reservation in the router is the easiest way).

Also meet the [host requirements](/docs/server/install): Git, Caddy, and rootless Podman with a Compose frontend.

## Make it reachable

This is the part a VPS gives you for free and a homelab makes you earn. The good news: the safe setup opens zero ports on your router.

**Public traffic: [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/).** `cloudflared` runs on the box and dials out to Cloudflare, so nothing ever needs to dial in. Your domain routes through the tunnel with no forwarded ports, no dynamic DNS, and your home IP never appears in public DNS. It also works when your ISP shares one public IP across many customers (carrier-grade NAT, common on residential fiber), where inbound traffic can't reach you at all. Point the tunnel at Caddy's HTTP port; the trade is that TLS terminates at Cloudflare instead of your Caddy.

**SSH and deploys: [Tailscale](https://tailscale.com/).** It gives the box a stable private address reachable from your laptop anywhere, so `bun ship` works from a coffee shop with SSH never touching the public internet. Install it on the box and your machine, then use the box's Tailscale hostname as the SSH target during `bun ship:setup`.

**The old way, opening ports 80 and 443 on the router**, still works and lets Caddy terminate TLS with its own certificates. It also points the public internet directly at your home network and makes you responsible for a changing home IP (dynamic DNS). Take it only if you understand what you're exposing.

## Install and ship

From here the homelab is just a server:

```sh
curl -fsSL https://shibumistack.dev/install/server | bash
```

Then connect a project from your machine with `bun ship:setup`, using the box's LAN hostname or your domain as the SSH target. The [install](/docs/server/install) and [connect project](/docs/server/ship) pages cover both steps.

## Keep it healthy

- Turn on unattended security updates (`unattended-upgrades` on Debian and Ubuntu).
- Full-stack apps back up their SQLite databases on the box; copy those backups somewhere that is not the same box.
- Put the router and the box on a cheap smart plug or UPS if your power flickers.
- Keep the router closed. With the tunnel for traffic and Tailscale for SSH, no port needs forwarding at all.

## Learn more

Videos worth your time:

- [This Is The ONLY Home Server You Should Buy](https://www.youtube.com/watch?v=PisIPpbMkTc), Hardware Haven, on why used office mini PCs beat everything else per euro.
- [The Homelab Setup I Wish I Built First](https://www.youtube.com/watch?v=n_QLkVLFdSk), Tech With Emilio, a first setup done in the right order.
- [Cheap Homelab Setup for under $100](https://www.youtube.com/watch?v=ubOMgmTQjfs), Tech With Emilio, the budget end.
- [EXPOSE your home network to the INTERNET!! (it's safe)](https://www.youtube.com/watch?v=ey4u7OUAF3c), NetworkChuck, on exposing home services through a reverse proxy, the same job Caddy does here.

Written guides:

- [How to start a homelab](https://budgethomelab.com/guides/how-to-start-a-homelab/), Budget Homelab's beginner walkthrough.
- [Ultimate home lab starter stack](https://www.virtualizationhowto.com/2025/12/ultimate-home-lab-starter-stack-for-2026-key-recommendations/), Virtualization Howto's hardware and software picks.
- [From mini PC to custom DIY server](https://blog.alexandros.tech/Building-a-Homelab-From-Mini-PC-to-Custom-DIY-Server-Lessons-Learned/), lessons from one person's build-out.

These cover the general homelab world (Proxmox, media servers, NAS). None of that is required here: one Linux install and shibumi-server is a complete setup.

# Shibumi Forms

Shibumi Forms is a standalone service: it accepts submissions from any static site through a plain HTML form, whether or not the site was built with Shibumi. Hosted pre-alpha runs at <https://forms.shibumistack.dev>; the same Bun, Hono, and SQLite code is available at <https://github.com/bitbonsai/shibumi-forms>.

## Connect a page

Register the page URL and owner email, confirm the email link, then use the generated endpoint:

```html
<form action="https://forms.shibumistack.dev/f/your-id" method="post">
  <label>
    Email
    <input type="email" name="email" required>
  </label>
  <button type="submit">Notify me</button>
</form>
```

Named text fields become submission fields. Standard HTML posts need no client JavaScript. The endpoint also accepts multipart text fields and JSON from an approved origin.

## Review submissions

Email links provide passwordless access to an endpoint's submissions. Owners can page through results, inspect every field, add private notes, export CSV, disable collection, or delete a submission.

The application renders submitted values as text. Database queries check account ownership. It hashes login tokens, requires CSRF tokens for mutations, escapes spreadsheet formulas in CSV, and omits submitted values and credentials from logs.

## Run it yourself

The application runs as an unprivileged Bun container with one SQLite database on a persistent volume. SQLite uses WAL mode. The repository includes:

- `GET /healthz` for process liveness
- `GET /readyz` for database readiness
- tracked migrations
- backup and restore commands
- operational counts
- Docker or Podman Compose configuration

Pre-alpha covers contact forms, waitlists, and surveys. It does not include file uploads, teams, webhooks, analytics, or a visual form builder.

## Links

- Hosted: <https://forms.shibumistack.dev>
- Source: <https://github.com/bitbonsai/shibumi-forms>

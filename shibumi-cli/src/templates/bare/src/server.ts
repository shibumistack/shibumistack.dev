import { serve } from "bun";
import { app } from "./app";

const port = Number(Bun.env.PORT ?? 3000);

serve({ fetch: app.fetch, port });

console.log(`Listening on http://localhost:${port}`);

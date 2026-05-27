import { Hono } from "hono";
import { api } from "./routes/api";
import { pages } from "./routes/pages";

export const app = new Hono();

app.route("/api", api);
app.route("/", pages);

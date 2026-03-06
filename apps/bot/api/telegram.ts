import { Hono } from "hono";

const app = new Hono().basePath("/api");

app.post("/telegram", async (c) => {
  try {
    await c.req.json();
  } catch {
    return c.json({ ok: false, error: "invalid_json" }, 400);
  }

  return c.json({ ok: true });
});

app.all("/telegram", (c) => {
  c.header("Allow", "POST");
  return c.json({ ok: false, error: "method_not_allowed" }, 405);
});

export default app;
export { app };

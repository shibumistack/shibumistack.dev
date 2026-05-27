import { Hono } from "hono";

export const pages = new Hono();

pages.get("/", (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Shibumi App</title>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #1a1a1a; background: #faf8f4; max-width: 640px; margin: 0 auto; padding: 2rem 1rem; }
    a { color: #c76647; }
    h1 { margin-bottom: 1.5rem; }
    .item-list { list-style: none; margin: 1rem 0; }
    .item-list li { padding: 0.5rem 0; border-bottom: 1px solid #e5e0d8; display: flex; justify-content: space-between; align-items: center; }
    .item-list .delete { cursor: pointer; color: #c76647; background: none; border: none; font-size: 0.9rem; }
    form { display: flex; gap: 0.5rem; margin: 1rem 0; }
    input { flex: 1; padding: 0.5rem; border: 1px solid #e5e0d8; background: #fff; font: inherit; }
    button { padding: 0.5rem 1rem; background: #c76647; color: #fff; border: none; cursor: pointer; font: inherit; }
    .error { color: #c76647; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Items</h1>

  <div x-data="{ items: [], name: '', error: '' }" x-init="
    const res = await fetch('/api/items');
    items = await res.json();
  ">
    <form @submit.prevent="
      error = '';
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const item = await res.json();
        items.push(item);
        name = '';
      } else {
        const data = await res.json();
        error = data.error?.name?.[0] || 'Something went wrong';
      }
    ">
      <input type="text" x-model="name" placeholder="New item" required>
      <button type="submit">Add</button>
    </form>
    <div class="error" x-show="error" x-text="error"></div>

    <ul class="item-list">
      <template x-for="item in items" :key="item.id">
        <li>
          <span x-text="item.name"></span>
          <button class="delete" @click="
            await fetch('/api/items/' + item.id, { method: 'DELETE' });
            items = items.filter(i => i.id !== item.id);
          ">remove</button>
        </li>
      </template>
    </ul>
  </div>
</body>
</html>`);
});

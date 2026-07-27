import { kv } from "@vercel/kv";

const sanitize = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .slice(0, 30);

export default async function handler(req, res) {
  const user = sanitize(req.query.user);
  if (!user) {
    return res.status(400).json({ error: "Falta el usuario" });
  }
  const KEY = `gym-data-v1:${user}`;

  if (req.method === "GET") {
    let data = await kv.get(KEY);
    if (!data) {
      // Compatibilidad: datos guardados antes de separar por usuario
      const legacy = await kv.get("gym-data-v1");
      if (legacy) {
        data = legacy;
        await kv.set(KEY, legacy);
      }
    }
    return res.status(200).json({ data: data || null });
  }

  if (req.method === "POST") {
    await kv.set(KEY, req.body);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: "Método no permitido" });
}

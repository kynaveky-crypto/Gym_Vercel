export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { descripcion } = req.body || {};
  if (!descripcion) {
    return res.status(400).json({ error: "Falta la descripción" });
  }

  const prompt = `Genera un boceto SVG simple y minimalista, estilo icono de instrucciones de gimnasio, trazos negros (stroke="black", stroke-width entre 3 y 5, fill="none" o "white") sobre fondo blanco, que ilustre este ejercicio: "${descripcion}". Usa viewBox="0 0 200 200" y que el dibujo ocupe bien el espacio. Responde ÚNICAMENTE con el código SVG completo, empezando por <svg y terminando en </svg>. No incluyas texto, explicación ni bloques de markdown.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const match = text.match(/<svg[\s\S]*?<\/svg>/i);

    return res.status(200).json({ svg: match ? match[0] : null });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ svg: null, error: "No se pudo generar el boceto" });
  }
}

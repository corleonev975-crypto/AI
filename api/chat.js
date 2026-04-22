export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Pesan kosong" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah Xinn AI, asisten cerdas, ramah, natural, dan membantu seperti ChatGPT. Jawab dengan bahasa Indonesia yang santai, jelas, dan tidak kaku. Jangan terlalu panjang kecuali diminta. Jangan jawab seperti template."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data?.error?.message || "Gagal dari Groq"
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Tidak ada balasan."
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error"
    });
  }
}

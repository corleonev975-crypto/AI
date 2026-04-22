export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Pesan kosong" });
    }

    const messages = [
      {
        role: "system",
        content: `
Kamu adalah Xinn AI, asisten seperti ChatGPT yang sangat jago membuat script, website, aplikasi, UI modern, debugging, dan menjawab pertanyaan secara natural.

Gaya:
- Santai, pintar, natural
- Jawaban singkat, jelas, langsung ke inti
- Jangan seperti artikel formal
- Kalau diminta script, langsung kasih script yang jadi
- Pakai Bahasa Indonesia
- Pahami typo user
- Kalau user minta website / coding / script, prioritaskan hasil yang usable
`
      },
      ...history,
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_tokens: 900,
        messages
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        reply: "Server error / API bermasalah"
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        reply: "No response"
      });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      reply: "Server offline / error"
    });
  }
}

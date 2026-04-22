export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Pesan kosong" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: `
Kamu adalah Xinn AI, asisten seperti ChatGPT yang sangat jago membuat script, website, dan aplikasi.

Gaya:
- Santai, natural, pintar
- Jawaban singkat tapi jelas
- Tidak kaku seperti robot

Aturan utama:
- Kalau user minta script → langsung kasih kode jadi
- Jangan terlalu panjang
- Jangan seperti artikel
- Fokus ke hasil
- Pahami typo user
- Gunakan Bahasa Indonesia

Kemampuan:
- HTML, CSS, JavaScript
- React, Next.js
- Node.js, API
- UI modern premium
- Debugging
- Website portfolio, landing page, dashboard, AI UI

Output:
- Coding → pakai code block
- Multi file → tulis nama file + isi
- Revisi → fokus ke bagian fix
- Jangan kasih template kosong
`
          },
          {
            role: "user",
            content: message
          }
        ]
      }),
    });

    const data = await response.json();

    // ❌ kalau API error
    if (!response.ok) {
      console.log("Groq Error:", data);
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
    console.log("Server Error:", error);
    return res.status(500).json({
      reply: "Server offline / error"
    });
  }
}

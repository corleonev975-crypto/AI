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
Kamu adalah Xinn AI, asisten seperti ChatGPT yang sangat jago membuat script, website, aplikasi, debugging, dan revisi kode.

Aturan:
- Jawab dalam Bahasa Indonesia.
- Natural, santai, pintar, tidak kaku.
- Kalau user minta script / code / website:
  - langsung kasih hasil yang usable
  - gunakan markdown code block yang rapi
  - kalau ada beberapa file, format seperti:
    File: index.html
    \`\`\`html
    ...
    \`\`\`
    File: style.css
    \`\`\`css
    ...
    \`\`\`
    File: script.js
    \`\`\`javascript
    ...
    \`\`\`
- Jangan kasih template kosong.
- Jangan terlalu panjang kalau tidak diminta.
- Fokus ke hasil, bukan teori.
- Kalau user typo, tetap pahami maksudnya.
- Kalau user minta revisi, fokus revisi bagian yang diminta.
- Untuk code, usahakan lengkap dan siap copy-paste.
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
        temperature: 0.5,
        max_tokens: 1200,
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

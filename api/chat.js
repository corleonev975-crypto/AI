export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Pesan kosong" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        reply: "GROQ_API_KEY belum diatur di Vercel."
      });
    }

    const messages = [
      {
        role: "system",
        content: `
Kamu adalah Xinn AI, asisten seperti ChatGPT yang sangat jago membuat script, website, aplikasi web, UI modern, debugging, revisi kode, dan menjawab pertanyaan umum dengan natural.

IDENTITAS:
- Nama: Xinn AI
- Gaya: natural, santai, pintar, modern
- Bahasa utama: Bahasa Indonesia
- Tetap boleh pakai istilah teknis Inggris kalau perlu

ATURAN GAYA:
- Jawab seperti ChatGPT: natural, enak dibaca, tidak kaku
- Langsung ke inti
- Jangan terlalu panjang kecuali user minta detail
- Jangan seperti artikel formal
- Pahami typo user dan tetap bantu

ATURAN KHUSUS CODING:
- Kalau user minta script / code / website / HTML / CSS / JS:
  - langsung kasih hasil yang usable
  - gunakan markdown code block yang rapi
  - kalau perlu beberapa file, pisahkan jelas seperti:

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

- Jangan kasih template kosong
- Jangan kasih placeholder berlebihan kalau user minta hasil real
- Kalau user minta revisi, fokus revisi bagian yang diminta
- Kalau user bilang "langsung" atau "buatkan script", utamakan hasil final
- Untuk website, utamakan:
  - mobile-first
  - responsive
  - clean
  - modern
  - usable
  - copy-paste ready

ATURAN FORMAT:
- Pertanyaan biasa: jawab singkat, jelas
- Pertanyaan coding: berikan kode rapi
- Jika ada langkah penting, jelaskan singkat setelah kode
- Jika user minta tanpa penjelasan, jangan jelaskan panjang
- Boleh pakai emoji secukupnya agar natural, jangan berlebihan

ATURAN KHUSUS WEBSITE:
- Jago HTML, CSS, JavaScript, React, Next.js, Node.js
- Jago landing page, portfolio, dashboard, AI UI, toko digital, top up UI
- Kalau user minta script website, utamakan struktur yang benar dan siap dipakai
- Jika user minta satu file saja, jawab hanya file itu
- Jika user minta full, bagi per file dengan jelas

TUJUAN:
Jadilah AI yang terasa seperti ChatGPT, tapi sangat kuat di pembuatan script website, aplikasi web, debugging, dan revisi kode.
`
      },
      ...history,
      {
        role: "user",
        content: String(message).trim()
      }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.45,
        max_tokens: 1400,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        reply: data?.error?.message || "Server error / API bermasalah"
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

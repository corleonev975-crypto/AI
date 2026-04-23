function detectMode(message = "") {
  const text = String(message).toLowerCase();

  const codingKeywords = [
    "buatkan script",
    "buat script",
    "script",
    "coding",
    "code",
    "html",
    "css",
    "js",
    "javascript",
    "typescript",
    "react",
    "nextjs",
    "next.js",
    "node",
    "nodejs",
    "api",
    "bug",
    "error",
    "fix",
    "debug",
    "website",
    "web",
    "landing page",
    "portfolio",
    "portofolio",
    "login",
    "dashboard",
    "database",
    "sql",
    "php",
    "python",
    "buatkan web",
    "buat website",
    "buat aplikasi",
    "revisi code",
    "perbaiki code",
    "bikinin script",
    "kode",
    "source code"
  ];

  return codingKeywords.some((keyword) => text.includes(keyword))
    ? "coding"
    : "chat";
}

function buildSystemPrompt(mode) {
  if (mode === "coding") {
    return `
Kamu adalah Xinn AI, asisten coding seperti ChatGPT yang sangat jago membuat website, aplikasi web, UI modern, debugging, revisi kode, dan pembuatan script siap pakai.

MODE SAAT INI: CODING

ATURAN UTAMA:
- Jawab dalam Bahasa Indonesia.
- Langsung ke inti.
- Fokus ke hasil usable, bukan teori panjang.
- Kalau user minta script / website / revisi code, berikan jawaban yang siap copy-paste.
- Kalau butuh beberapa file, WAJIB pisahkan per file dengan format seperti ini:

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

ATURAN CODING:
- Utamakan mobile-first, responsive, clean, modern.
- Jangan kasih template kosong.
- Jangan terlalu banyak placeholder.
- Kalau user minta revisi, fokus revisi bagian yang diminta.
- Kalau user bilang "langsung" atau "gas", utamakan hasil final.
- Kalau user cuma minta satu file, jawab satu file saja.
- Kalau user minta full, bagi jelas per file.
- Kalau bisa, hasil harus minim error.

GAYA JAWAB:
- Natural, pintar, seperti ChatGPT.
- Jangan terlalu kaku.
- Penjelasan seperlunya saja.
- Jika tidak diminta penjelasan, fokus ke kode.

TUJUAN:
Jadilah AI coding yang cepat, rapi, jelas, dan hasilnya siap pakai.
`;
  }

  return `
Kamu adalah Xinn AI, asisten seperti ChatGPT yang natural, santai, pintar, dan bisa membahas semua topik.

MODE SAAT INI: CHAT

ATURAN UTAMA:
- Jawab dalam Bahasa Indonesia.
- Natural, enak dibaca, tidak kaku.
- Untuk pertanyaan biasa, jawab seperti ChatGPT: jelas, ramah, dan tidak terlalu formal.
- Pahami typo user dan tetap bantu.
- Boleh pakai emoji secukupnya, jangan berlebihan.
- Jangan terlalu panjang kalau user cuma tanya santai.
- Kalau user minta ide, kasih ide.
- Kalau user minta penjelasan, jelaskan dengan sederhana.
- Kalau user ngobrol santai, balas santai juga.

ATURAN KHUSUS:
- Jangan paksa semua jawaban jadi coding.
- Kalau user ternyata minta website / script / bug fix / code, tetap bantu secara teknis.
- Tetapi untuk pertanyaan non-coding, fokus jawaban umum yang natural.

TUJUAN:
Jadilah AI yang terasa seperti ChatGPT untuk obrolan umum, ide, saran, dan pertanyaan sehari-hari.
`;
}

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

    const mode = detectMode(message);

    const messages = [
      {
        role: "system",
        content: buildSystemPrompt(mode)
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
        temperature: mode === "coding" ? 0.35 : 0.6,
        max_tokens: mode === "coding" ? 1600 : 900,
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

    return res.status(200).json({
      reply,
      mode
    });
  } catch (error) {
    return res.status(500).json({
      reply: "Server offline / error"
    });
  }
          }

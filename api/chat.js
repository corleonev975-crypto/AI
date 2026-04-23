function detectMode({ message = "", image = null }) {
  if (image) return "vision";

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

ATURAN:
- Jawab dalam Bahasa Indonesia.
- Langsung ke inti.
- Fokus ke hasil usable, bukan teori panjang.
- Kalau user minta script / website / revisi code, berikan jawaban siap copy-paste.
- Kalau perlu beberapa file, WAJIB format seperti:

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

- Utamakan mobile-first, responsive, clean, modern.
- Jangan kasih template kosong.
- Kalau user bilang "langsung", "gas", atau "buatkan", utamakan hasil final.
- Penjelasan seperlunya saja.
`;
  }

  if (mode === "vision") {
    return `
Kamu adalah Xinn AI Vision.

MODE SAAT INI: VISION

ATURAN:
- Jawab dalam Bahasa Indonesia.
- Analisis gambar dengan natural, jelas, dan langsung ke inti.
- Kalau user tanya isi gambar, jelaskan isi gambar.
- Kalau ada teks di gambar, bantu bacakan / rangkum.
- Kalau user minta saran dari gambar, bantu sesuai konteks.
- Jangan ngarang kalau detail gambar tidak jelas.
- Kalau gambar kurang jelas, bilang dengan jujur.
`;
  }

  return `
Kamu adalah Xinn AI, asisten seperti ChatGPT yang natural, santai, pintar, dan bisa membahas semua topik.

MODE SAAT INI: CHAT

ATURAN:
- Jawab dalam Bahasa Indonesia.
- Natural, enak dibaca, tidak kaku.
- Untuk pertanyaan biasa, jawab seperti ChatGPT: jelas, ramah, dan tidak terlalu formal.
- Pahami typo user dan tetap bantu.
- Boleh pakai emoji secukupnya.
- Jangan terlalu panjang kalau user cuma tanya santai.
- Jangan paksa semua jawaban jadi coding.
`;
}

function buildMessages({ mode, message, history, image }) {
  const base = [
    {
      role: "system",
      content: buildSystemPrompt(mode)
    }
  ];

  if (mode === "vision") {
    return [
      ...base,
      ...history,
      {
        role: "user",
        content: [
          {
            type: "text",
            text: String(message || "Jelaskan gambar ini.")
          },
          {
            type: "image_url",
            image_url: {
              url: image
            }
          }
        ]
      }
    ];
  }

  return [
    ...base,
    ...history,
    {
      role: "user",
      content: String(message).trim()
    }
  ];
}

function buildModelConfig(mode) {
  if (mode === "vision") {
    return {
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.4,
      max_completion_tokens: 1200
    };
  }

  if (mode === "coding") {
    return {
      model: "llama-3.3-70b-versatile",
      temperature: 0.35,
      max_tokens: 1600
    };
  }

  return {
    model: "llama-3.3-70b-versatile",
    temperature: 0.6,
    max_tokens: 900
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history = [], image = null } = req.body || {};

    if ((!message || !String(message).trim()) && !image) {
      return res.status(400).json({ error: "Pesan kosong" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        reply: "GROQ_API_KEY belum diatur di Vercel."
      });
    }

    const mode = detectMode({ message, image });
    const messages = buildMessages({
      mode,
      message,
      history,
      image
    });

    const modelConfig = buildModelConfig(mode);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...modelConfig,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        reply: data?.error?.message || "Server error / API bermasalah",
        mode
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        reply: "No response",
        mode
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

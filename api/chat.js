export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

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
            content: "Kamu adalah Xinn AI, jawab santai, natural, seperti ChatGPT."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    // 🔥 DEBUG LOG
    console.log("GROQ RESPONSE:", data);

    // ❌ kalau API error
    if (!response.ok) {
      return res.status(500).json({
        reply: "API error: " + (data.error?.message || "unknown")
      });
    }

    // ❌ kalau kosong
    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({
        reply: "AI tidak memberi respon"
      });
    }

    return res.status(200).json({
      reply: data.choices[0].message.content
    });

  } catch (err) {
    return res.status(500).json({
      reply: "Server error: " + err.message
    });
  }
}

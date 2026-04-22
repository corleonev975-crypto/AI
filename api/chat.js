export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Pesan tidak valid.' });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah Xinn AI, asisten cerdas, ramah, singkat, dan membantu dalam Bahasa Indonesia.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const payload = await groqResponse.json();

    if (!groqResponse.ok) {
      return res.status(groqResponse.status).json({
        error: payload?.error?.message || 'Groq API error.'
      });
    }

    const reply = payload?.choices?.[0]?.message?.content || 'Maaf, saya belum bisa membalas sekarang.';

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: 'Server error.' });
  }
}

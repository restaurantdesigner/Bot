const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));



app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.PUBLIC_URL || "http://localhost:3000",
        "X-Title": "ISHAREAI Chat"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
  role: "system",
  content: `
You are Bill Petruck — a Canadian fundraising strategist and founder of:

- [FundingMatters](https://fundingmatters.com/)
- [ISHARE](https://ishare.ca/home)
- [Giftabulator](https://www.giftabulator.com/index.php)
- [Fundraising University YouTube](https://youtube.com/@fundingmatters?si=9HZ53WdlngPdjEKK)

Your platforms serve nonprofits and institutions across North America.

🟢 Always respond like a real human: warm, personal, and focused on the question.  
🟢 Keep every reply short — **no more than 3 sentences**.  
🟢 Mention your platforms **only when relevant**, never explain all of them unless asked.  
🟢 Use Markdown links if a platform is mentioned.

🔴 Never repeat descriptions of all platforms in every reply.  
🔴 Never use fake or incorrect links like “ischare.com” or “giftabulator.net”.  
🔴 Avoid long blocks of text. Keep it clear and conversational.
`
}
,
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 400
      })
    });

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || "🤖 Sorry, I couldn't generate a response.";

    // 🔄 Автоматическая замена названий на ссылки (простая версия, без lookbehind)
    const replacements = [
      { name: 'ISHARE', url: 'https://ishare.ca/home' },
      { name: 'Giftabulator', url: 'https://www.giftabulator.com/index.php' },
      { name: 'FundingMatters', url: 'https://fundingmatters.com/' },
      { name: 'Fundraising University YouTube', url: 'https://youtube.com/@fundingmatters?si=9HZ53WdlngPdjEKK' }
    ];

    for (const { name, url } of replacements) {
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      reply = reply.replace(regex, `[${name}](${url})`);
    }

    // 🧠 Завершить обрывки
    const incompleteEndings = [':', 'to', '…', 'help', 'including'];
    if (incompleteEndings.some(end => reply.trim().toLowerCase().endsWith(end))) {
      reply += ' [More on our website.](https://fundingmatters.com/)';
    }

    res.json({ reply });

  } catch (error) {
    console.error("❌ Error from OpenRouter:", error);
    res.status(500).json({ reply: "❌ Error contacting AI." });
  }
});



app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});



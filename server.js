const express = require('express');
const OpenAI = require('openai');
const path = require('path');
const dotenv = require('dotenv');
const cache = require('memory-cache');
const { pipeline } = require('@xenova/transformers');

dotenv.config({ path: './info.env' });

const app = express();
const PORT = process.env.PORT || 5000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const userInput = req.body.message.trim();
    const model = req.body.model || "gpt-3.5-turbo";

    if (!userInput) {
        return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Check cache first
    let cachedResponse = cache.get(userInput);
    if (cachedResponse) {
        return res.json({ reply: cachedResponse });
    }

    try {
        let aiResponse;
        if (model === "gpt-j") {
            aiResponse = await generateGPTJResponse(userInput); // Handle GPT-J
        } else if (model === "chatgpt-3") {
            aiResponse = await generateChatGPT3Response(userInput); // Handle ChatGPT-3
        } else {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: userInput }],
                max_tokens: 150,
                temperature: 0.7,
            });

            aiResponse = response.choices[0].message.content;
        }

        cache.put(userInput, aiResponse, 10 * 60 * 1000); // Cache for 10 minutes

        res.json({ reply: aiResponse });

    } catch (error) {
        console.error('OpenAI Error:', error.message || error);
        res.status(500).json({ error: 'Failed to communicate with the AI' });
    }
});

async function generateGPTJResponse(prompt) {
    try {
        const response = await pipeline(prompt, model="EleutherAI/gpt-j-6B", max_length=100);
        return response[0]['generated_text'];
    } catch (error) {
        console.error("GPT-J Error:", error.message || error);
        throw new Error("Failed to generate response using GPT-J.");
    }
}

async function generateChatGPT3Response(prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 150,
            temperature: 0.7,
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error("ChatGPT-3 Error:", error.message || error);
        throw new Error("Failed to generate response using ChatGPT-3.");
    }
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');
const fetch = require('node-fetch');

// Setup Discord Client
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

// Verify API keys on startup
console.log("Checking API Keys...");
if (!process.env.TOKEN || !process.env.OPENAI_API_KEY || !process.env.DEEPSEEK_API_KEY || !process.env.GOOGLE_GEMINI_API_KEY) {
  console.error("❌ Missing API keys in .env file!");
  process.exit(1);
} else {
  console.log("✅ API keys loaded successfully.");
}

// OpenAI setup
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

client.once('ready', () => {
  console.log(`${client.user.username} is online and ready! 🚀`);
});

const allowedChannels = process.env.CHANNEL_ID?.split(',') || [];

client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // Ignore bot messages
  if (message.content.trim().startsWith(process.env.IGNORE_MESSAGE_PREFIX)) return; // Ignore if message starts with '!'
  if (!allowedChannels.includes(message.channelId)) return; // Ignore if not in allowed channels

  let initialReply = await message.reply('🧠 Thinking...');

  const userInput = message.content.toLowerCase();

  try {
    // Handle requests based on user input
    if (userInput.includes("image") || userInput.includes("generate image")) {
      const imageUrl = await generateImage(userInput);
      return initialReply.edit(`Here is your image: ${imageUrl}`);
    } 
    else if (userInput.includes("video")) {
      return initialReply.edit("🔍 Sorry, video generation is not supported yet.");
    } 
    else if (userInput.includes("summarize") || userInput.includes("extract")) {
      const summary = await getTextSummary(userInput);
      return initialReply.edit(`📜 Summary: ${summary}`);
    } 
    else if (userInput.includes("translate")) {
      const translatedText = await translateText(userInput);
      return initialReply.edit(`🌍 Translation: ${translatedText}`);
    } 
    else if (userInput.includes("transcribe audio")) {
      return initialReply.edit("🔊 Please upload an audio file for transcription.");
    } 
    else if (userInput.includes("search google")) {
      const searchResult = await googleSearch(userInput);
      return initialReply.edit(`🔍 Google Search Result: ${searchResult}`);
    } 
    else {
      const chatResponse = await chatWithAI(userInput);
      return initialReply.edit(chatResponse);
    }
  } catch (error) {
    console.error(error);
    return initialReply.edit("⚠️ An error occurred. Please try again later.");
  }
});

// Function to Chat with AI
async function chatWithAI(message) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: message }],
      max_tokens: 250,
    });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error in AI Chat:", error);
    return "⚠️ AI response failed.";
  }
}

// Function to Generate an Image (DeepSeek)
async function generateImage(prompt) {
  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/images/generate",
      { prompt: prompt, model: "deepseek-image-v2" },
      { headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` } }
    );
    return response.data.url;
  } catch (error) {
    console.error("Image generation error:", error);
    return "⚠️ Unable to generate image.";
  }
}

// Function to Summarize Text (Google Gemini AI)
async function getTextSummary(text) {
  try {
    const response = await axios.post(
      "https://api.gemini.com/v1/summarize",
      { text },
      { headers: { Authorization: `Bearer ${process.env.GOOGLE_GEMINI_API_KEY}` } }
    );
    return response.data.summary;
  } catch (error) {
    console.error("Summarization error:", error);
    return "⚠️ Unable to summarize text.";
  }
}

// Function to Translate Text (Google Gemini AI)
async function translateText(text) {
  try {
    const response = await axios.post(
      "https://api.gemini.com/v1/translate",
      { text, target_lang: "en" },
      { headers: { Authorization: `Bearer ${process.env.GOOGLE_GEMINI_API_KEY}` } }
    );
    return response.data.translation;
  } catch (error) {
    console.error("Translation error:", error);
    return "⚠️ Translation failed.";
  }
}

// Function to Perform Google Search
async function googleSearch(query) {
  try {
    const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
      params: {
        key: process.env.GOOGLE_GEMINI_API_KEY,
        cx: "YOUR_GOOGLE_CUSTOM_SEARCH_ENGINE_ID",
        q: query,
      },
    });
    return response.data.items[0].snippet;
  } catch (error) {
    console.error("Google Search error:", error);
    return "⚠️ No search results found.";
  }
}

// Error Handling
process.on("unhandledRejection", (reason) => console.error("Unhandled Rejection:", reason));
process.on("uncaughtException", (error) => console.error("Uncaught Exception:", error));

client.login(process.env.TOKEN);

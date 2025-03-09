import 'dotenv/config';
import { Client, IntentsBitField } from 'discord.js';
import { Configuration, OpenAIApi } from 'openai';
import { DeepSeek } from 'deepseekai';
import fetch from 'node-fetch';
import mongoose from 'mongoose';

// Load environment variables
const { TOKEN, CHANNEL_ID, API_KEY, DEEPSEEK_KEY, GEMINI_KEY, MONGO_URI } = process.env;

// Connect to MongoDB
async function connectDatabase() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully!');
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
}
connectDatabase();

// Initialize Discord Bot
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.once('ready', () => console.log(`✅ ${client.user.username} is online and ready!`));

// Initialize OpenAI & Deepseek AI
const openai = new OpenAIApi(new Configuration({ apiKey: API_KEY }));
const deepseek = new DeepSeek(DEEPSEEK_KEY);

// System message for AI behavior
const systemMessage = "You're a smart AI chatbot. Respond concisely and intelligently.";

// Allowed channel
let chatChannels = CHANNEL_ID.split('-');

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!chatChannels.includes(message.channelId)) return;
  if (message.content.startsWith('!')) return; // Ignore commands

  let conversationLog = [{ role: 'system', content: systemMessage }];

  let prevMessages = await message.channel.messages.fetch({ limit: 8 });
  prevMessages.reverse();

  let initialReply = await message.reply('<a:loading:1095759091869167747> Generating response...');

  prevMessages.forEach((msg) => {
    if (msg.author.id === client.user.id) {
      conversationLog.push({ role: 'assistant', content: msg.content });
    } else {
      conversationLog.push({ role: 'user', content: msg.content });
    }
  });

  try {
    let aiResponse;
    if (message.content.toLowerCase().includes('image')) {
      aiResponse = await generateImage(message.content);
    } else if (message.content.toLowerCase().includes('audio')) {
      aiResponse = await transcribeAudio(message.content);
    } else if (message.content.toLowerCase().includes('text')) {
      aiResponse = await generateText(message.content);
    } else {
      aiResponse = await chatWithAI(conversationLog);
    }

    initialReply.edit(aiResponse);
  } catch (error) {
    initialReply.edit(`❌ Error: ${error.message}`);
    setTimeout(() => initialReply.delete(), 5000);
  }
});

// Chat with AI function
async function chatWithAI(conversationLog) {
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: conversationLog,
    max_tokens: 256,
  });
  return response.data.choices[0].message.content;
}

// Generate Image function
async function generateImage(prompt) {
  const response = await fetch('https://api.deepseek.ai/image', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${DEEPSEEK_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const data = await response.json();
  return data.url || '❌ Could not generate image';
}

// Transcribe Audio function
async function transcribeAudio(audioUrl) {
  const response = await fetch('https://api.deepseek.ai/transcribe', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${DEEPSEEK_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioUrl }),
  });
  const data = await response.json();
  return data.transcription || '❌ Could not transcribe audio';
}

// Generate Text function
async function generateText(prompt) {
  const response = await fetch('https://api.deepseek.ai/generate-text', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${DEEPSEEK_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const data = await response.json();
  return data.text || '❌ Could not generate text';
}

// Handle errors
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));
process.on('uncaughtException', (error) => console.error('Uncaught Exception:', error));

client.login(TOKEN);

require('dotenv').config();
const { Client, IntentsBitField, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');
const mongoose = require('mongoose');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const gtts = require('gtts');
const fs = require('fs');

// Initialize Discord client
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildMembers,
  ],
});

client.on('ready', (c) => console.log(`${c.user.username} is online and ready!`));

// Setup OpenAI API
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

// MongoDB setup
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
  userId: String,
  conversationHistory: [{ role: String, content: String }],
  reminders: [{ text: String, date: Date }],
});
const User = mongoose.model('User', userSchema);

// Specific channel ID
const specificChannelId = process.env.SPECIFIC_CHANNEL_ID;

// Function to get user context
async function getUserContext(userId) {
  const user = await User.findOne({ userId });
  return user?.conversationHistory || [];
}

// Function to update user context
async function updateUserContext(userId, role, content) {
  await User.updateOne(
    { userId },
    { $push: { conversationHistory: { role, content } } },
    { upsert: true }
  );
}

// Function to generate a chart
async function generateChart(data) {
  const width = 600, height = 400;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
  const configuration = {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: 'Data', data }],
    },
  };
  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  return image;
}

// Function to check toxicity
async function checkToxicity(message) {
  const response = await axios.post(
    'https://api.openai.com/v1/moderations',
    { input: message },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );
  return response.data.results[0].flagged;
}

// Function to search Spotify playlists
async function searchSpotifyPlaylist(query) {
  const response = await axios.get('https://api.spotify.com/v1/search', {
    params: { q: query, type: 'playlist' },
    headers: { Authorization: `Bearer ${process.env.SPOTIFY_API_KEY}` },
  });
  return response.data.playlists.items[0].external_urls.spotify;
}

// Function to search GIFs
async function searchGIF(query) {
  const response = await axios.get('https://api.tenor.com/v1/search', {
    params: { q: query, key: process.env.TENOR_API_KEY, limit: 1 },
  });
  return response.data.results[0].media[0].gif.url;
}

// Function to generate quiz questions
async function generateQuizQuestion() {
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'system', content: 'Generate a fun quiz question.' }],
  });
  return response.data.choices[0].message.content;
}

// Function to generate voice
async function generateVoice(text, voiceId) {
  const response = await axios.post(
    'https://api.elevenlabs.io/v1/text-to-speech/' + voiceId,
    { text },
    { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } }
  );
  return response.data.audio_url;
}

// Function to extract text from images
async function extractTextFromImage(imageUrl) {
  const response = await axios.post(
    'https://vision.googleapis.com/v1/images:annotate',
    {
      requests: [{ image: { source: { imageUri: imageUrl } }, features: [{ type: 'TEXT_DETECTION' }] }],
    },
    { params: { key: process.env.GOOGLE_VISION_API_KEY } }
  );
  return response.data.responses[0].fullTextAnnotation.text;
}

// Function to add reminders
async function addReminder(userId, reminder) {
  await User.updateOne(
    { userId },
    { $push: { reminders: reminder } },
    { upsert: true }
  );
}

// Handle messages
client.on('messageCreate', async (message) => {
  if (message.author.bot || message.channelId !== specificChannelId) return;

  // Check for toxicity
  const isToxic = await checkToxicity(message.content);
  if (isToxic) {
    await message.reply('Your message was flagged as inappropriate. Please be respectful.');
    return;
  }

  // Get user context
  const userContext = await getUserContext(message.author.id);

  // Generate response using OpenAI
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful and sarcastic chatbot.' },
      ...userContext,
      { role: 'user', content: message.content },
    ],
  });
  const gptReply = response.data.choices[0].message.content;

  // Update user context
  await updateUserContext(message.author.id, 'user', message.content);
  await updateUserContext(message.author.id, 'assistant', gptReply);

  // Send response
  await message.reply(gptReply);

  // Additional features
  if (message.content.toLowerCase().includes('chart')) {
    const chartImage = await generateChart([10, 20, 30]);
    await message.reply({ files: [new AttachmentBuilder(chartImage, { name: 'chart.png' })] });
  }

  if (message.content.toLowerCase().includes('playlist')) {
    const playlistUrl = await searchSpotifyPlaylist(message.content);
    await message.reply(`Here's a playlist for you: ${playlistUrl}`);
  }

  if (message.content.toLowerCase().includes('gif')) {
    const gifUrl = await searchGIF(message.content);
    await message.reply(gifUrl);
  }

  if (message.content.toLowerCase().includes('quiz')) {
    const quizQuestion = await generateQuizQuestion();
    await message.reply(`Quiz time! ${quizQuestion}`);
  }

  if (message.content.toLowerCase().includes('remind me')) {
    const reminder = { text: message.content, date: new Date() };
    await addReminder(message.author.id, reminder);
    await message.reply('Reminder added!');
  }
});

// Error handling
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));
process.on('uncaughtException', (reason) => console.error('Uncaught Exception:', reason));

client.login(process.env.TOKEN);

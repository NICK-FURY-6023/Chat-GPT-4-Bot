require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const fs = require('fs');
const gTTS = require('gtts');
const path = require('path');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates
  ],
});

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.API_KEY,
}));

const voiceChannelId = process.env.VOICE_CHANNEL_ID;
let connection;

client.once('ready', async () => {
  console.log(`${client.user.username} is online!`);

  const channel = await client.channels.fetch(voiceChannelId);
  if (!channel || channel.type !== 2) return console.error('Invalid voice channel ID');

  connection = joinVoiceChannel({
    channelId: voiceChannelId,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false
  });

  connection.on(VoiceConnectionStatus.Ready, () => {
    console.log('Bot joined the voice channel and is ready.');
  });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content || message.content.startsWith('!')) return;

  try {
    const messages = await message.channel.messages.fetch({ limit: 8 });
    const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const conversation = [
      { role: 'system', content: "You're a funny, sarcastic voice assistant in a Discord server. Respond in less than 5 sentences." }
    ];

    sorted.forEach(msg => {
      if (msg.content.startsWith('!') || msg.author.bot) return;
      conversation.push({
        role: msg.author.id === client.user.id ? 'assistant' : 'user',
        content: msg.content,
      });
    });

    const result = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: conversation,
      max_tokens: 200
    });

    const replyText = result.data.choices[0].message.content;
    const tts = new gTTS(replyText, 'en');
    const filePath = path.join(__dirname, 'reply.mp3');

    tts.save(filePath, async function () {
      const resource = createAudioResource(filePath);
      const player = createAudioPlayer();

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        fs.unlinkSync(filePath);
      });

      await message.react('🔊');
    });

  } catch (err) {
    console.error(err);
    message.reply('Kuch gadbad ho gayi. Error: ' + err.message);
  }
});

client.login(process.env.TOKEN);

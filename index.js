
require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on('ready', () => {
  console.log('The bot is online!');
});

const configuration = new Configuration({
  apiKey: "OPENAI_API_KEY",
});

const openai = new OpenAIApi(configuration);

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== "CHANNEL_ID") return;
  if (message.content.startsWith('!')) return;

  if (message.content.toLowerCase() === '!ping') {
    const pingMessage = await message.channel.send('Pinging...');

    // Calculate the bot's latency
    const latency = pingMessage.createdTimestamp - message.createdTimestamp;

    pingMessage.edit(`Pong! Latency is ${latency}ms. Bot Uptime is ${getUptime()}`);
    return;
  }

  let conversationLog = [
    { role: 'system', content: 'You are a friendly chat bot,
  ];

  try {
    const typingMessage = await message.channel.send();

    // Sending typing status
    await message.channel.sendTyping();

    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
      if (message.content.startsWith('!')) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;
      if (msg.author.id !== message.author.id) return;

      conversationLog.push({
        role: 'user',
        content: msg.content,
      });
    });

    const result = await openai
      .createChatCompletion({
        model: 'gpt-3.5-turbo', // you can change your ChatGpt model like gpt-4
        messages: conversationLog,
      })
      .catch((error) => {
        console.log(`OPENAI ERR: ${error}`);
      });

    typingMessage.delete(); // Remove the typing message

    message.reply(result.data.choices[0].message);
  } catch (error) {
    console.log(`ERR: ${error}`);
  }
});

client.login('YOUR_BOT_TOEKN');


# If you have any problem contact me on Discord and I will solve your problem

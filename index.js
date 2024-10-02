require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const logErrors = require('./utils/logErrors');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on('ready', (c) => console.log(`${c.user.username} is online and ready!`));

// Setup OpenAI API
const configuration = new Configuration({ apiKey: process.env.API_KEY });
const openai = new OpenAIApi(configuration);

// Custom system message used to modify the model's behaviour
const systemMessage =
  "You're a sarcastic chatbot in a Discord server. Respond in 5 or less sentences.";

const ignoreMessagePrefix = process.env.IGNORE_MESSAGE_PREFIX || "!";
let chatChannels = process.env.CHANNEL_ID.split('-');

client.on('messageCreate', async (message) => {
  if (message.author.bot || !chatChannels.includes(message.channelId)) return;
  if (message.content.startsWith(ignoreMessagePrefix)) return;

  let conversationLog = [{ role: 'system', content: systemMessage }];

  // Fetch previous messages to use as context
  let prevMessages = await message.channel.messages.fetch({ limit: 8 });
  prevMessages.reverse();

  let initialReply = await message.reply(
    '<a:loading:1095759091869167747> Generating a response, please wait...'
  );

  prevMessages.forEach((msg) => {
    if (msg.content.startsWith(ignoreMessagePrefix)) return;
    if (msg.author.bot && msg.author.id !== client.user.id) return; // Ignore other bots

    if (msg.author.id === client.user.id) {
      conversationLog.push({
        role: 'assistant',
        content: msg.content,
        name: msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, ''),
      });
    } else if (msg.author.id === message.author.id) {
      conversationLog.push({
        role: 'user',
        content: msg.content,
        name: message.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, ''),
      });
    }
  });

  // Generate a response
  openai
    .createChatCompletion({
      model: 'gpt-4', // Correct model name
      messages: conversationLog,
      max_tokens: 256,
    })
    .then((result) => {
      let gptReply = result.data.choices[0].message.content;

      if (gptReply.length > 2000) {
        gptReply = gptReply.slice(0, 1997) + '...';
      }

      initialReply.edit(gptReply);
    })
    .catch(async (error) => {
      await initialReply.edit(
        `<:xmark:1055230112934674513> There was an error, please try again later.\n${error}`
      );

      setTimeout(() => {
        initialReply.delete();
      }, 5000);
    });
});

// Error handling
process.on('unhandledRejection', (reason) => logErrors(reason));
process.on('uncaughtException', (reason) => logErrors(reason));

client.login(process.env.TOKEN);

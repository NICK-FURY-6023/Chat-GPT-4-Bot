require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const os = require('os');
const axios = require('axios');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});
// Define an array of allowed channel IDs

const allowedChannels = ["1127176908447174666", "1138468138875371530", "1169197223712665622", "1182674803631587348"];
// Define your custom bot version
const botVersion = '1.3.1'; // Replace with your desired bot version


client.on('ready', () => {
  console.log('🟢 The bot is online!');

  // Initial activity status
  setActivityStatus();

  // Update activity status every 1 minute (60000 milliseconds)
  setInterval(() => {
    setActivityStatus();
  }, 3000);
});

// Function to set activity status
function setActivityStatus() {
  const activities = [
    'Bot under maintenance',
  'Working on improvements',
  'Upgrading AI capabilities',
  '🔧 Fixing bugs',
  'Enhancing user experience',
      'WITH YOUR 🧠',
    'with Discord',
    'I CAN CONTROL YOU',
    'AI IS THE FUTURE',
    'WITH YOUR BRAIN',
    'गर्व से कहो हम हिंदू हैं। 🚩🚩',
    'with JavaScript',
    'with GPT-3.5 TURBO',
    'with AI',
    'Powered by VAYU ESPORTS',
    'गर्व से कहो हम हिंदू हैं। 🚩🚩',
    'AI IS THE FUTURE',
  'Support: discord.gg/vayuesports',
  'Exploring the metaverse',
  'Chatting with users',
  'Learning new tricks',
  'Bot under maintenance',
  'Working on improvements',
      'WITH YOUR 🧠',
    'with Discord',
    'I CAN CONTROL YOU',
    'AI IS THE FUTURE',
    'WITH YOUR BRAIN',
    'गर्व से कहो हम हिंदू हैं। 🚩🚩',
    'with JavaScript',
    'with GPT-3.5 TURBO',
    'with AI',
    'Powered by VAYU ESPORTS',
    'गर्व से कहो हम हिंदू हैं। 🚩🚩',
    'AI IS THE FUTURE',
  'Upgrading AI capabilities',
  'Providing helpful responses',
  'Adapting to your needs',
  'Creating AI magic',
  'Evolving every day',
      'Bot under maintenance',
  'Working on improvements',
  'Upgrading AI capabilities',
  'Making Discord smarter',
  'Join our support server!',
  ];
  const randomActivity = activities[Math.floor(Math.random() * activities.length)];

  client.user.setActivity(randomActivity);
}

// Function to set presence status
function setPresenceStatus() {
  // Set DND status (Do Not Disturb)
  client.user.setStatus('dnd');
}

const configuration = new Configuration({
  apiKey: "sk-proj-63OaZSCTHTQj8vJDrt8eT3BlbkFJONg2jTIfOontgA40XLiz",
});

const openai = new OpenAIApi(configuration);


client.on('messageCreate', async (message) => {

  if (message.author.bot) return;

  

  // Check if the message's channel ID is in the allowedChannels array

  if (!allowedChannels.includes(message.channel.id)) return;
    
  if (message.content.toLowerCase() === '!help') {
  // Get the user who ran the command
  const user = message.author;

  // Create an embed for help information
  const helpEmbed = {
    color: 000000, // Embed color (you can customize this)
    title: 'Available Commands',
    description: 'Here are the available commands:',
    fields: [
      {
        name: '1. !help',
        value: '> ```🔵 Displays this help message```',
      },
      {
        name: '2. !generateaiimage [custom prompt]',
        value: '> ```🔴 Genrates an AI-generated image based on a prompt. You can provide a custom prompt. Note: this command its not available right now for everyone.```',
      },
      {
        name: '3. !botinfo',
        value: '> ```⚪ Shows information about the bot.```',
      },
      {
        name: '4. !ping',
        value:'> ```🟢 Shows infromation about bot ping.```',
      },
      {
        name: '5. !joke',
        value: '> ``` 🟡Get a random joke.```',
      },
      {

        name: 'GitHub Repository',

        value: 'You can find the bot\'s source code and project details on [GitHub](https://github.com/NICK-FURY-6023/Chat-GPT-3.5-turbo.git).',

      },

      {

        name: 'Support Server',

        value: 'Join our support server for assistance and updates: [Support Server](https://discord.gg/CdCfgSC3qy).',

      },

    ],
    footer: {
    text: `Requested by ${user.tag}`,
      icon_url: message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),

    },

  };

  message.channel.send({ embeds: [helpEmbed] });

}
    
   if (message.content.toLowerCase() === '!joke') {
    try {
      // Fetch a random joke from a joke API (replace with a real joke API URL)
      const jokeResponse = await axios.get('https://v2.jokeapi.dev/joke/Any');

      if (jokeResponse.data && jokeResponse.data.joke) {
        const joke = jokeResponse.data.joke;
        message.channel.send(`Here's a random joke for you:\n${joke}`);
      } else {
        message.channel.send('Unable to fetch a joke. Please check the joke API or try again later.');
      }
    } catch (error) {
      console.error('Error fetching joke:', error);
      message.channel.send('An error occurred while fetching the joke. Please try again later.');
    }
  }
    
  if (message.content.toLowerCase() === '!ping') {
    const pingMessage = await message.channel.send('Pinging...');

    // Calculate the bot's latency
    const latency = pingMessage.createdTimestamp - message.createdTimestamp;

    pingMessage.edit(`Pong! Latency is ${latency}ms. Bot Uptime is ${getUptime()}`);
    return;
  }

 if (message.content.toLowerCase() === '!botinfo') {
    const botInfoMessage = await message.channel.send('Getting bot information...');

    const uptime = getUptime();
    const serverCount = client.guilds.cache.size;
    const userCount = client.users.cache.size;
    const cpuUsage = await getCpuUsage();

    const systemInfo = `**System Information**\n` +
      `> Node.js Version: ${process.version}\n` +
      `> Discord.js Version: ${require('discord.js').version}\n` +
      `> Operating System: ${os.type()} ${os.arch()}\n` +
      `> CPU: ${os.cpus()[0].model}\n` +
      `> CPU Cores: ${os.cpus().length}\n` +
      `> CPU Speed: ${os.cpus()[0].speed} MHz\n` +
      `> User CPU Usage: ${cpuUsage.userCpu} ms\n` +
      `> System CPU Usage: ${cpuUsage.systemCpu} ms\n` +
      `> Memory: ${formatBytes(os.totalmem())}`;

    const botInfo = `**Bot Information**\n` +
      `> Bot Version: ${botVersion}\n` +
      `> Bot Uptime: ${uptime}\n` +
      `> Bot Ping: ${client.ws.ping}ms\n` +
      `> Server Count: ${serverCount}\n` +
      `> User Count: ${userCount}`;

    const embed = {
      color: 0x00ff00, // Change the color as desired
      title: 'All Information',
      fields: [
        {
          name: '> _____________________________',
          value: systemInfo,
        },
        {
          name: '> _____________________________',
          value: botInfo,
        },
      ],
      timestamp: new Date(),
      footer: {
        text: `Requested by ${message.author.tag}`,
        icon_url: message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
      },
    };

    botInfoMessage.edit({ embeds: [embed] });
  }
    

  if (message.content.toLowerCase() === '!rb') {
    if (message.author.id !== '761635564835045387') {
      return;
    }

    await message.channel.send(' <a:q_validcode:1086172936420986880>  Rebooting...');
    client.destroy();
    process.exit(0);
  }

  if (message.content.startsWith('!')) return;

  try {
   // const contentOfLink = "https://media.tenor.com/xHzoT_g2pkwAAAAM/trollface-sinaere.gif"; // Replace this with actual code to get the content from the link
    const typingMessage = await message.channel.send(`> ${message.author} <a:q_loadingg:1118877722274443384> generating a response, please wait...`);

    // Sending typing status
    await message.channel.sendTyping();

    let prevMessages = await message.channel.messages.fetch({ limit: 5 });
    prevMessages.reverse();

    let conversationLog = [
      { role: 'system', content: 'Im sorry, but as a language AI model,  Im designed to assist with providing helpful responses and engaging in conversation.' },
    ];

    prevMessages.forEach((msg) => {
      if (message.content.startsWith('!')) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;
      if (msg.author.id !== message.author.id) return;

      conversationLog.push({
        role: 'user',
        content: msg.content,
      });
    });

    const result = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-1106',
      messages: conversationLog,
    });

    typingMessage.delete(); // Remove the typing message

    const reply = result.data.choices[0].message.content;

  // Mention and reply to the user
    const chunkSize = 1999;
    for (let i = 0; i < reply.length; i += chunkSize) {
      const chunk = reply.substring(i, i + chunkSize);
      await message.reply(chunk);
    }
  } catch (error) {
    console.error('An error occurred:', error);

    // Send a custom error message to the Discord channel and mention the developer
    const errorMessage = `Uh-oh! ${message.author}, I encountered an error and am informing the developer. Please check back later or contact the developer for assistance. <@761635564835045387>`;
    message.channel.send(errorMessage);
  }
});


// Calculate bot uptime
function getUptime() {
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
} 

// Format bytes to human-readable string
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function getCpuUsage() {
  const startUsage = process.cpuUsage();
  const startTime = performance.now();

  await new Promise(resolve => setTimeout(resolve, 1000));

  const endUsage = process.cpuUsage(startUsage);
  const endTime = performance.now();

  const userCpu = (endUsage.user / 1000).toFixed(2);
  const systemCpu = (endUsage.system / 1000).toFixed(2);
  const totalCpu = (endTime - startTime).toFixed(2);

  return {
    userCpu,
    systemCpu,
    totalCpu,
  };
}async function getCpuUsage() {
  const startUsage = process.cpuUsage();
  const startTime = performance.now();

  await new Promise(resolve => setTimeout(resolve, 1000));

  const endUsage = process.cpuUsage(startUsage);
  const endTime = performance.now();

  const userCpu = (endUsage.user / 1000).toFixed(2);
  const systemCpu = (endUsage.system / 1000).toFixed(2);
  const totalCpu = (endTime - startTime).toFixed(2);

  return {
    userCpu,
    systemCpu,
    totalCpu,
  };
}

client.login('');


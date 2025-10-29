require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const { spawn } = require('child_process');
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on('ready', (c) => {
  console.log(`✅ ${c.user.tag} is online.`);
  const channel = client.channels.fetch('1352943079811973160'); // Replace with your Discord channel ID
  startValheimLogListener('valheim-server', channel);
});

client.on('messageCreate', (message) => {
  if (message.author.bot) {
    return;
  }

  if (message.content === '.ping') {
    message.reply('✅ Valhalla#7999 is online.');
  }
});

const runScript = (scriptPath) => {
  return new Promise((resolve, reject) => {
    const process = spawn(scriptPath);
    let output = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on('close', () => {
      resolve(output);
    });
  });
};

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;

  if (commandName === 'vhstart') {
    await interaction.reply(
      '🚀 **Starting Docker Valheim Server!** *Please wait...*'
    );
    await runScript('/home/vhuser/vhserver/start.sh');
    setTimeout(async () => {
      const statusOutput = await runScript('/home/vhuser/vhserver/status.sh');
      await interaction.channel.send(
        `✅ **Valheim Server Started!**\n\`\`\`${statusOutput}\`\`\``
      );
    }, 5000);
  }

  if (commandName === 'vhstop') {
    try {
      await interaction.deferReply();
      console.log('Attempting to stop the server...');

      // Run status.sh to check current server status
      const statusScript = spawn('bash', ['/home/vhuser/vhserver/status.sh']);

      let statusOutput = '';
      statusScript.stdout.on('data', (data) => {
        statusOutput += data.toString();
      });

      statusScript.on('close', async () => {
        console.log('Status Output:\n', statusOutput);

        if (statusOutput.includes('OFFLINE')) {
          await interaction.editReply(
            '🟠 **Server is not currently running...**'
          );
          return;
        }

        const playersMatch = statusOutput.match(/Players Online:\s+(\d+)/);
        const playersOnline = playersMatch ? parseInt(playersMatch[1], 10) : 0;

        if (playersOnline === 0) {
          console.log('No players online, stopping the server...');
          spawn('docker', ['stop', 'valheim-server']);
          await interaction.editReply(
            '🛑 **Valheim server has been stopped.**'
          );
        } else {
          console.log('Players currently online, will not stop the server.');
          await interaction.editReply(
            '⚠️ **There are online players — stop aborted.**'
          );
        }
      });
    } catch (err) {
      console.error(`Error: ${err.message}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply(
          '❌ **Error checking or stopping the server.**'
        );
      }
    }
  }

  if (commandName === 'vhstatus') {
    await interaction.deferReply();
    const statusOutput = await runScript('/home/vhuser/vhserver/status.sh');
    await interaction.editReply(
      `📊 **Valheim Server Status:**\n\`\`\`${statusOutput}\`\`\``
    );
  }
});

// ✅ Persistent log listener with embed messages
const startValheimLogListener = (containerName, channel) => {
  const dockerLogs = spawn('docker', ['logs', '-f', containerName]);
  const processedPlayers = [];

  dockerLogs.stdout.on('data', async (data) => {
    const logLine = data.toString();
    console.log(`[${containerName}] ${logLine}`);

    // Player join
    const playerJoinMatch = logLine.match(/Got character ZDOID from: (\d+)/);
    if (playerJoinMatch) {
      const steamID = playerJoinMatch[1];
      if (!processedPlayers.includes(steamID)) {
        processedPlayers.push(steamID);
        const joinEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('📝 Player Joined Valhalla')
          .setDescription(`Player Name: **${steamID}**`)
          .setFooter({ text: 'Valheim Server' })
          .setTimestamp();
        channel.send({ embeds: [joinEmbed] });
      }
    }

    // Player leave
    if (logLine.includes('RPC_Disconnect')) {
      const leaveEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('👋 Player Left the Server')
        .setFooter({ text: 'Valheim Server' })
        .setTimestamp();
      channel.send({ embeds: [leaveEmbed] });
    }
  });

  dockerLogs.stderr.on('data', (data) => {
    console.error(`[${containerName}] ERROR: ${data}`);
  });
};

console.log('Loaded TOKEN:', process.env.TOKEN ? '✅ Present' : '❌ Missing');
client.login(process.env.TOKEN);

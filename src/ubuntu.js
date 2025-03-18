require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const { spawn } = require("child_process");
const fs = require("fs");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});
const stripAnsi = (str) => str.replace(/\x1B\[[0-9;]*m/g, "");
let valheimServerProcess = null;
let serverStarted = false;

client.on("ready", (c) => {
  console.log(`✅ ${c.user.tag} is online.`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;

  if (commandName === "vhstart") {
    if (!serverStarted) {
      await interaction.reply("**Starting Valheim Server! Please wait...**");
      spawn("/home/valheimserver/vhserver", ["start"]);

      const detailsProcess = spawn("/home/valheimserver/vhserver", ["details"]);
      let outputData = "";
      detailsProcess.stdout.on("data", (data) => {
        outputData += data.toString();
      });
      detailsProcess.on("close", async () => {
        const cleanOutput = stripAnsi(outputData);
        let serverStatus =
          cleanOutput.match(/Status:\s+([^\s]+)/)?.[1] || "OFFLINE";
        let players = cleanOutput.match(/Players:\s+([^\s]+)/)?.[1] || "0/10";
        const serverIP =
          cleanOutput.match(/Internet IP:\s+([^\s]+)/)?.[1] || "Unknown";
        if (serverStatus.toUpperCase() === "STARTED") {
          serverStatus = "ONLINE";
          serverStarted = true;
        } else {
          serverStatus = "OFFLINE";
        }
        players = players.replace(/\d+\/(\d+)/, (match, max) =>
          match.replace(max, "10")
        );
        const replyMessage = "✅ **Valheim server started successfully!**"`\`\`\`
Server name:    Roshar
Server IP:      ${serverIP}
Server status:  ${serverStatus}
Players:        ${players}
Password:       Valhalla
\`\`\``;

        await interaction.editReply({ content: replyMessage });
      });

      valheimServerProcess.on("close", async (code) => {
        if (code !== 0) {
          await interaction.followUp("❌ Failed to start Valheim server.");
        }
      });
    }
  } else if (commandName === "vhstop") {
    if (serverStarted) {
      const detailsProcess = spawn("/home/valheimserver/vhserver", ["details"]);
      let outputData = "";
      detailsProcess.stdout.on("data", (data) => {
        outputData += data.toString();
      });
      detailsProcess.on("close", async () => {
        const cleanOutput = stripAnsi(outputData);
        const players = cleanOutput.match(/Players:\s+([^\s]+)/)?.[1];
        if (players === "0/10") {
          await interaction.reply("Stopping Valheim Server...");
          spawn("/home/valheimserver/vhserver", ["stop"]);
          stopProcess.on("close", async (code) => {
            if (code === 0) {
              serverStarted = false;
              await interaction.followUp("✅ **Valheim server stopped.**");
            } else {
              await interaction.followUp("❌ Failed to stop Valheim server.");
            }
          });
        } else {
          await interaction.reply(
            "There are online players, can't stop the server"
          );
        }
      });
    } else {
      await interaction.reply("Server is not currently running...");
    }
  } else if (commandName === "vhstatus") {
    try {
      await interaction.deferReply();

      const detailsProcess = spawn("/home/valheimserver/vhserver", ["details"]);

      let outputData = "";
      detailsProcess.stdout.on("data", (data) => {
        outputData += data.toString();
      });

      detailsProcess.on("close", async () => {
        const cleanOutput = stripAnsi(outputData);
        let serverStatus =
          cleanOutput.match(/Status:\s+([^\s]+)/)?.[1] || "OFFLINE";
        let players = cleanOutput.match(/Players:\s+([^\s]+)/)?.[1] || "0/10";
        const serverIP =
          cleanOutput.match(/Internet IP:\s+([^\s]+)/)?.[1] || "Unknown";
        if (serverStatus.toUpperCase() === "STARTED") {
          serverStatus = "ONLINE";
        } else {
          serverStatus = "OFFLINE";
        }
        players = players.replace(/\d+\/(\d+)/, (match, max) =>
          match.replace(max, "10")
        );
        const replyMessage = `\`\`\`
Server name:    Roshar
Server IP:      ${serverIP}
Server status:  ${serverStatus}
Players:        ${players}
Password:       Valhalla
\`\`\``;

        await interaction.editReply({ content: replyMessage });
      });
    } catch (error) {
      console.error(`Error retrieving server status: ${error.message}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply("❌ **Error retrieving server status.**");
      }
    }
  }
});

console.log("Loaded TOKEN:", process.env.TOKEN ? "✅ Present" : "❌ Missing");
client.login(process.env.TOKEN);

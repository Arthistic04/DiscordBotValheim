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

client.on("ready", (c) => {
  console.log(`✅ ${c.user.tag} is online.`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  let serverStarted = false;

  if (commandName === "vhstart") {
    try {
      if (!serverStarted) {
        await interaction.reply("**Starting Valheim Server! Please wait...**");
        spawn("/home/valheimserver/vhserver", ["start"]);
        serverStarted = true;
      }
    } catch (error) {
      console.error(`Error starting Valheim Server: ${error.message}`);
      await interaction.followUp("❌ **Error starting Valheim Server.**");
    }
  } else if (commandName === "vhstop") {
    try {
      if (serverStarted) {
        await interaction.reply("Stopping Valheim Server...");
        spawn("/home/valheimserver/vhserver", ["stop"]);
        await interaction.followUp(
          "✅ **Valheim Server stopped successfully!**"
        );
        serverStarted = false;
      } else {
        await interaction.reply("Server is not currently running...");
      }
    } catch (error) {
      console.error(`Error stopping Valheim Server: ${error.message}`);
      await interaction.followUp("❌ **Error stopping Valheim Server.**");
    }
  } else if (commandName === "vhstatus") {
    try {
      if (serverStarted) {
        const detailsProcess = spawn("/home/valheimserver/vhserver", [
          "details",
        ]);
        let outputData = "";

        detailsProcess.stdout.on("data", (data) => {
          outputData += data.toString();
        });

        detailsProcess.on("close", async () => {
          const serverStatus =
            outputData.match(/Server status:\s+(.*)/)?.[1]?.trim() || "UNKNOWN";
          const players =
            outputData.match(/Players:\s+(.*)/)?.[1]?.trim() || "0 / 10";
          const serverIP =
            outputData.match(/IP:\s+(.*)/)?.[1]?.trim() || "Unknown";

          const replyMessage = `\`\`\`
Server name:    Roshar
Server IP:      ${serverIP}
Server status:  ${serverStatus}
Players:        ${players}
Password:       Valhalla
\`\`\``;

          await interaction.reply(replyMessage);
        });

        detailsProcess.stderr.on("data", (data) => {
          console.error(`Error fetching status: ${data}`);
        });
      } else {
        await interaction.reply("Server is not currently running...");
      }
    } catch (error) {
      console.error(`Error retrieving server status: ${error.message}`);
      await interaction.reply("❌ **Error retrieving server status.**");
    }
  }
});

console.log("Loaded TOKEN:", process.env.TOKEN ? "✅ Present" : "❌ Missing");
client.login(process.env.TOKEN);

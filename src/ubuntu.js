require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const { spawn } = require("child_process");
const fs = require("fs");
const { GameDig } = require("gamedig");

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

client.on("messageCreate", (message) => {
  if (message.author.bot) {
    return;
  }

  if (message.content === ".ping") {
    message.reply("✅ Valhalla#7999 is online.");
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;

  //Functions
  const afterStart = async () => {
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
      const replyMessage =
        "✅ **Valheim server started successfully!**" +
        `\`\`\`
Server name:    Roshar
Server IP:      ${serverIP}:2456
Server status:  ${serverStatus}
Players:        ${players}
Password:       Valhalla
\`\`\``;

      await interaction.channel.send({ content: replyMessage });
    });
  };

  //Commands
  if (commandName === "vhstart") {
    if (!serverStarted) {
      await interaction.reply(
        "**Starting Valheim Server!** \n *Please wait...*"
      );
      spawn("/home/valheimserver/vhserver", ["start"]);

      setTimeout(() => {
        afterStart();
      }, 3000);
    } else {
      await interaction.reply("Server is already running");
    }
  } else if (commandName === "vhstop") {
    //
    if (serverStarted) {
      const detailsProcess = spawn("/home/valheimserver/vhserver", ["details"]);

      let outputData = "";
      detailsProcess.stdout.on("data", (data) => {
        outputData += data.toString();
      });

      detailsProcess.on("close", async () => {
        let playerInfo = "0";
        try {
          const state = await GameDig.query({
            type: "valheim",
            host: serverIP,
            port: 2457, // Make sure this matches your server's query port
          });
          playerInfo = `${state.players.length}`;
          console.log("✅ Successfully retrieved player info via gamedig:");
          console.log("Players Online:", state.players.length);

          if (playerInfo === "0") {
            spawn("/home/valheimserver/vhserver", ["stop"]);
            await interaction.reply("**Stopping Valheim Server...**");
          } else {
            await interaction.reply("Server is not currently running...");
          }
        } catch (err) {
          console.warn(
            "❌ Could not get player info via gamedig:",
            err.message
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
        const serverIP =
          cleanOutput.match(/Internet IP:\s+([^\s]+)/)?.[1] || "Unknown";
        if (serverStatus.toUpperCase() === "STARTED") {
          serverStatus = "ONLINE";
        } else {
          serverStatus = "OFFLINE";
        }

        let playerInfo = "0/10";
        try {
          const state = await GameDig.query({
            type: "valheim",
            host: serverIP,
            port: 2457, // Make sure this matches your server's query port
          });
          playerInfo = `${state.players.length}/10`;
          console.log("✅ Successfully retrieved player info via gamedig:");
          console.log("Server Name:", state.name);
          console.log("Players Online:", state.players.length);
          console.log(
            "Player List:",
            state.players.map((p) => p.name).join(", ") || "None"
          );
        } catch (err) {
          console.warn(
            "❌ Could not get player info via gamedig:",
            err.message
          );
        }
        const replyMessage = `\`\`\`
Server name:    Roshar
Server IP:      ${serverIP}:2456
Server status:  ${serverStatus}
Players:        ${playerInfo}
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

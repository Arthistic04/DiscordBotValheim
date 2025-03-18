require("dotenv").config();
const { Client, IntentsBitField, Role } = require("discord.js");
const { spawn } = require("child_process");

const processedPlayers = [];

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

let valheimServerProcess = null;
let playerCount = 0;
let serverStarted = false;
let fullLobby = false;
let lobbyInfo = null;

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

  if (commandName === "vhstart") {
    try {
      if (!serverStarted) {
        await interaction.reply(
          "**Starting Valheim Server!** \n *Please wait ...*"
        );
        valheimServerProcess = spawn("/home/valheimserver/vhserver", ["start"]);
        valheimServerProcess.stdout.on("data", (data) => {
          console.log(`Valheim Server Output: ${data}`);

          const matchSession = data
            .toString()
            .match(/Session "Roshar" with join code (\d+) and IP (\S+:\d+)/);
          const matchUpdateLobby = data
            .toString()
            .match(/Updating lobby with public IP (\S+:\d+)/);
          const match2 = data
            .toString()
            .match(
              /Member cannot join this lobby because the number of lobbies exceeds the limit/
            );

          if (matchSession) {
            serverStarted = true;
            const joinCode = matchSession[1];
            const serverIP = matchSession[2];

            interaction.client.serverInfo = {
              joinCode,
              serverIP,
            };
            if (serverStarted) {
              interaction.channel.send(
                `***Valheim Server started successfully!***\n**Join Code:** ${joinCode}\n**Server IP:** ${serverIP}\n**Password:** ||Valhalla||`
              );
            }
          } else if (matchUpdateLobby) {
            serverStarted = true;
            const serverIP = matchUpdateLobby[1];
            lobbyInfo = { serverIP };
            if (serverStarted) {
              interaction.channel.send(
                `***Valheim Server started successfully!***\n**Server IP:** ${serverIP}\n**Password:** ||Valhalla||`
              );
            }
          } else if (match2) {
            fullLobby = true;
            if (fullLobby) {
              interaction.channel.send(
                `**Valheim Server:** Cannot Creat More Lobby`
              );
            }
          }

          const playerJoinMatch = data
            .toString()
            .match(
              /<color=orange>(.+?)<\/color>:\s<color=#FFEB04FF>DUMATING NA AKO! PUTANGINA NIYO!<\/color>/
            );
          if (playerJoinMatch) {
            const playerName = playerJoinMatch[1];
            if (!processedPlayers.includes(playerName)) {
              processedPlayers.push(playerName);
              interaction.channel.send(
                `**📝${playerName}** has entered Valhalla`
              );
            }
          }

          const leave = data
            .toString()
            .match(/ZPlayFabSocket::Dispose. leave lobby. LobbyId:/);
          if (leave) {
            playerCount--;
            console.log(`Player leave.`);
          }

          const counter = data.toString().match(/(\d) player\(s\)/);
          if (counter) {
            const count1 = counter[1];
            playerCount = parseInt(count1, 10);
            console.log(`Player count: ${playerCount}`);
          }
        });

        valheimServerProcess.stderr.on("data", (data) => {
          console.error(`Valheim Server Error: ${data}`);
        });

        valheimServerProcess.on("close", (code) => {
          console.log(`Valheim Server Process exited with code ${code}`);
        });
      } else {
        await interaction.reply("Server is up and running");
      }
      serverStarted = true;
    } catch (error) {
      console.error(`Error starting Valheim Server: ${error.message}`);
      //interaction.followUp('Error starting Valheim Server.');
    }
  } else if (commandName === "vhstop") {
    if (serverStarted && playerCount === 0) {
      try {
        await interaction.reply("Stopping Valheim Server...");
        const stopProcess = spawn("/home/valheimserver/vhserver", ["stop"]);
        stopProcess.stdout.on("data", (data) => {
          console.log(`Stop Output: ${data}`);
        });
        stopProcess.stderr.on("data", (data) => {
          console.error(`Stop Error: ${data}`);
        });
        stopProcess.on("close", (code) => {
          console.log(`vhserver stop exited with code ${code}`);
          interaction.followUp("✅ **Valheim Server stopped successfully!**");
          serverStarted = false;
        });
      } catch (error) {
        console.error(`Error stopping Valheim Server: ${error.message}`);
        await interaction.followUp("Error stopping Valheim Server.");
      }
    } else if (playerCount > 0) {
      await interaction.reply(
        "There are players online. Cannot stop the server."
      );
    } else {
      await interaction.reply("Valheim Server is not currently running.");
    }
  } else if (commandName === "vhstatus") {
    try {
      // Spawn vhserver details process
      const detailsProcess = spawn("./vhserver", ["details"], {
        cwd: "/home/username",
      }); // adjust cwd to where vhserver is

      let outputData = "";
      detailsProcess.stdout.on("data", (data) => {
        outputData += data.toString();
      });

      detailsProcess.on("close", async (code) => {
        // Parse server details
        const serverName =
          outputData.match(/Server name:\s+(.*)/)?.[1]?.trim() || "Unknown";
        const serverIP =
          outputData.match(/Server IP:\s+(.*)/)?.[1]?.trim() || "Unknown";
        const serverStatus =
          outputData.match(/Server status:\s+(.*)/)?.[1]?.trim() || "Unknown";
        const players =
          outputData.match(/Players:\s+(.*)/)?.[1]?.trim() || "Unknown";

        // You can hardcode or store the password somewhere safe; for now we’ll show it
        const joinCode = serverInfo.joinCode || "N/A";
        const password = "Valhalla";

        const replyMessage = `\`\`\`
  Server name:    ${serverName}
  Server IP:      ${serverIP}
  Join Code:      ${joinCode}
  Server status:  ${serverStatus}
  Players:        ${players}
  Password:       ${password}
  \`\`\``;

        await interaction.reply(replyMessage);
      });

      detailsProcess.stderr.on("data", (data) => {
        console.error(`Error fetching status: ${data}`);
      });
    } catch (error) {
      console.error(`Error replying to vhstatus: ${error.message}`);
      await interaction.reply("Error retrieving server status.");
    }
  } else {
    await interaction.reply("Unknown Command");
  }
});

console.log("Loaded TOKEN:", process.env.TOKEN ? "✅ Present" : "❌ Missing");
client.login(process.env.TOKEN);

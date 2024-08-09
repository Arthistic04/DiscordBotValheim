require('dotenv').config();
const { Client, IntentsBitField, Role } = require('discord.js');
const { spawn } = require('child_process');

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

client.on('ready', (c) => {
  console.log(`✅ ${c.user.tag} is online.`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot) {
    return;
  }

  if (message.content === '.ping') {
    message.reply('✅ Valhalla#7999 is online.');
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'vhstart') {
    try {
      if (!serverStarted) {
        await interaction.reply('**Starting Valheim Server!** \n *Please wait ...*');
        valheimServerProcess = spawn('E:\\ValheimServer\\valheim_server', [
          '-nographics',
          '-batchmode',
          '-name', 'T R A G I C - V A L H E I M',
          '-port', '2456',
          '-world', 'VikingRaiders',
          '-password', 'Valhalla',
          '-crossplay',
        ]);
        valheimServerProcess.stdout.on('data', (data) => {
          console.log(`Valheim Server Output: ${data}`);

          const matchSession = data.toString().match(/Session "T R A G I C - V A L H E I M" with join code (\d+) and IP (\S+:\d+)/);
          const matchUpdateLobby = data.toString().match(/Updating lobby with public IP (\S+:\d+)/);
          const match2 = data.toString().match(/Member cannot join this lobby because the number of lobbies exceeds the limit/);
          
          if (matchSession) {
            serverStarted = true;
            const joinCode = matchSession[1];
            const serverIP = matchSession[2];

            interaction.client.serverInfo = {
              joinCode,
              serverIP,
            };
            if(serverStarted){
              interaction.channel.send(`***Valheim Server started successfully!***\n**Join Code:** ${joinCode}\n**Server IP:** ${serverIP}\n**Password:** ||Valhalla||`);
            }
          }
          else if(matchUpdateLobby){
            serverStarted = true;
            const serverIP = matchUpdateLobby[1];
            lobbyInfo = { serverIP };
            if(serverStarted){
              interaction.channel.send(`***Valheim Server started successfully!***\n**Server IP:** ${serverIP}\n**Password:** ||Valhalla||`);
            }
          }
          else if(match2){
            fullLobby = true;
            if (fullLobby) {
              interaction.channel.send(`**Valheim Server:** Cannot Creat More Lobby`);
            }
          }

          const playerJoinMatch = data.toString().match(/<color=orange>(.+?)<\/color>:\s<color=#FFEB04FF>DUMATING NA AKO! PUTANGINA NIYO!<\/color>/);
          if (playerJoinMatch) {
            const playerName = playerJoinMatch[1];
            if (!processedPlayers.includes(playerName)) {
              processedPlayers.push(playerName);
              interaction.channel.send(`**📝${playerName}** has entered Valhalla`);
            }
          }

          const leave = data.toString().match(/ZPlayFabSocket::Dispose. leave lobby. LobbyId:/);
          if (leave) {
            playerCount--;;
            console.log(`Player leave.`);
          }

          const counter = data.toString().match(/(\d) player\(s\)/);
          if (counter) {
            const count1 = counter[1];
            playerCount = parseInt(count1, 10);
            console.log(`Player count: ${playerCount}`);
          } 

        });

        valheimServerProcess.stderr.on('data', (data) => {
          console.error(`Valheim Server Error: ${data}`);
        });

        valheimServerProcess.on('close', (code) => {
          console.log(`Valheim Server Process exited with code ${code}`);
        });
      } else {
        await interaction.reply('Server is up and running');
      }
      serverStarted = true;
    } catch (error) {
      console.error(`Error starting Valheim Server: ${error.message}`);
      //interaction.followUp('Error starting Valheim Server.');
    }
  } else if (commandName === 'vhstop') {
    if (valheimServerProcess && playerCount == 0) {
      try {
        serverStarted = false;
        process.kill(valheimServerProcess.pid, 'SIGTERM');
        await interaction.reply('Stopping Valheim Server gracefully...').catch(error => {
          if (error.code === 10062) {
            interaction.reply('Please try again a little while');
            console.warn('Interaction is no longer valid.');
          } else {
            console.error(`Error stopping Valheim Server: ${error.message}`);
            //interaction.followUp('Error stopping Valheim Server.');
          }
        });
      } catch (error) {
        console.error(`Error stopping Valheim Server: ${error.message}`);
        //interaction.followUp('Error stopping Valheim Server.');
      }
    } else if(valheimServerProcess && playerCount > 0){
      try {
        await interaction.reply('There are players online. Cannot stop the server.').catch(error => {
          if (error.code === 10062) {
            interaction.reply('Please try again a little while');
            console.warn('Interaction is no longer valid.');
          } else {
            console.error(`Error stopping Valheim Server: ${error.message}`);
            //interaction.followUp('Error stopping Valheim Server.');
          }
        });
      } catch (error) {
        console.error(`Error stopping Valheim Server: ${error.message}`);
        //interaction.followUp('Error stopping Valheim Server.');
      }
    } else {
      interaction.reply('Valheim Server is not currently running.').catch(error => {
        if (error.code === 10062) {
          interaction.reply('Please try again a little while');
          console.warn('Interaction is no longer valid.');
        } else {
          console.error(`Error stopping Valheim Server: ${error.message}`);
          //interaction.followUp('Error stopping Valheim Server.');
        }
      });
    }
  } else if (commandName === 'vhstatus') {
    try {
      const serverInfo = interaction.client.serverInfo;
      //const lobbyInfo = lobbyInfo;
      if (serverInfo || lobbyInfo) {
        let replyMessage = '***Valheim Server is UP***\n';
        if (serverInfo) {
          replyMessage += `\n**• Server IP:** ${serverInfo.serverIP}\n**• Join Code:** ${serverInfo.joinCode}\n**• Player Count:** ${playerCount}\n**Password:** ||Valhalla||`;
        }
        if (lobbyInfo) {
          replyMessage += `\n**• Server IP:** ${lobbyInfo.serverIP}\n**• Player Count:** ${playerCount}\n**Password:** ||Valhalla||`;
        }
        await interaction.reply(replyMessage);
      } else {
        await interaction.reply('Valheim Server is not currently running.');
      }
    } catch (error) {
      if (error.code === 10062) {
        console.warn('Interaction is no longer valid.');
      } else {
        console.error(`Error replying to vhstatus command: ${error.message}`);
      }
    }
  }
  else {
    await interaction.reply('Unknown Command')
  }
});

client.login(process.env.TOKEN);

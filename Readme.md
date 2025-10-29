sudo apt update && sudo apt install docker.io docker-compose -y
sudo systemctl enable --now docker

**root**
adduser vhuser
usermod -aG sudo vhuser

newgrp docker
sudo usermod -aG docker $USER

#Changed to mbround18 from lloesche
docker pull mbround18/valheim

mkdir -p /home/vhuser/vhserver/config
mkdir -p /home/vhuser/vhserver/data

_sudo nano /home/vhuser/vhserver/docker-compose.yaml_
_sudo nano /home/vhuser/vhserver/start.sh_
_sudo nano /home/vhuser/vhserver/stop.sh_
_sudo nano /home/vhuser/vhserver/status.sh_

**docker-compose.yaml**

```
services:
  valheim:
    image: mbround18/valheim:latest
    container_name: valheim-server
    restart: unless-stopped
    ports:
      - 2456:2456/udp
      - 2457:2457/udp
      - 2458:2458/udp
    environment:
      PORT: 2456
      NAME: "Helixar"
      WORLD: "ourworld"
      PASSWORD: "Valhalla"
      PUBLIC: "1"
      TYPE: "BepInEx"
      TZ: "Asia/Manila"
      UPDATE_ON_STARTUP: 0
      AUTO_UPDATE: 0
      AUTO_BACKUP: 1
      AUTO_BACKUP_SCHEDULE: "* */60 * * *"
    volumes:
      - ./valheim/saves:/home/steam/.config/unity3d/IronGate/Valheim
      - ./valheim/server:/home/steam/valheim
      - ./valheim/backups:/home/steam/backups
```

Start/Stop/Status commands

**start.sh**
#!/bin/bash
cd /home/vhuser/vhserver/
docker-compose up -d

**stop.sh**
#!/bin/bash
cd /home/vhuser/vhserver/
docker-compose down

**status.sh**
#!/bin/bash
cd /home/vhuser/vhserver/
CONTAINER_NAME="valheim-server"
IP_ADDRESS="ip address"
PORT="2456"
SERVER_NAME="ServerName"

if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
status="ONLINE"
joins=$(docker logs $CONTAINER_NAME 2>&1 | grep -c "Got character ZDOID from")
    leaves=$(docker logs $CONTAINER_NAME 2>&1 | grep -c "RPC_Disconnect")
    players=$((joins - leaves))
if [ "$players" -lt 0 ]; then
players=0
fi

    echo "Server Status:    $status"
    echo "Server Name:      $SERVER_NAME"
    echo "Server IP:        ${IP_ADDRESS}:${PORT}"
    echo "Players Online:   ${players}"

else
status="OFFLINE"
echo "Server Status: $status"
fi

sudo chmod +x /home/vhuser/vhserver/start.sh
sudo chmod +x /home/vhuser/vhserver/stop.sh
sudo chmod +x /home/vhuser/vhserver/status.sh

**Usage:**
cd /home/vhuser/vhserver/
./start.sh # to start the docker server
./stop.sh # to stop the docker server
./status.sh # to check status + players

**Discord Chat Bot**

- Install required packages: npm install
- fill the .env
- register commands: npm register
- run the bot: npm start

**Run Discord as services**
sudo nano /etc/systemd/system/discordbot.service

```
[Unit]
Description=Discord Bot
After=network.target

[Service]
WorkingDirectory=/home/vhuser/discordbot
ExecStart=/usr/bin/node /home/vhuser/discordbot/index.js
Restart=always
User=vhuser
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

sudo systemctl daemon-reload
sudo systemctl enable discordbot
sudo systemctl start discordbot
systemctl status discordbot

sudo apt update && sudo apt install docker.io docker-compose -y
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker

docker pull lloesche/valheim-server

mkdir -p /home/(user)/valheimserver/config
mkdir -p /home/(user)/valheimserver/data

docker-compose.yml
```
version: "3.8"

services:
  valheim-server:
    image: lloesche/valheim-server
    container_name: valheim-server
    restart: unless-stopped
    ports:
      - "2456-2458:2456-2458/udp"
    environment:
      - SERVER_NAME=Roshar
      - WORLD_NAME=yourworld
      - SERVER_PASS=Valhalla
      - SERVER_PUBLIC=true
      - BEPINEX=true
    volumes:
      - /home/valheimserver/config:/config
      - /home/valheimserver/data:/opt/valheim
```

Start/Stop/Status commands

start.sh
#!/bin/bash
cd /home/(user)/valheimserver/
docker-compose up -d

stop.sh
#!/bin/bash
cd /home/(user)/valheimserver/
docker-compose down

status.sh
#!/bin/bash
cd /home/(user)/valheimserver/
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
    echo "Server Status:    $status"
fi


sudo chmod +x /home/(user)/valheimserver/start.sh
sudo chmod +x /home/(user)/valheimserver/stop.sh
sudo chmod +x /home/(user)/valheimserver/status.sh

Usage:
cd /home/(user)/valheimserver/
./start.sh     # to start the docker server
./stop.sh      # to stop the docker server
./status.sh    # to check status + players

Discord Chat Bot
- Install required packages: npm install
- fill the .env
- register commands: npm register
- run the bot: npm start
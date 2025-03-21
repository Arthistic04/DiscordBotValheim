#!/bin/bash
cd /home/valheimserver/1vhserver
CONTAINER_NAME="valheim-server"
IP_ADDRESS="114.108.200.184"
PORT="2456"
SERVER_NAME="Roshar"

if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    status="ONLINE"
    arrivals=$(docker logs $CONTAINER_NAME 2>&1 | grep -c "I HAVE ARRIVED!")
    leaves=$(docker logs $CONTAINER_NAME 2>&1 | grep -c "leave lobby")
    players=$((arrivals - leaves))
    if [ $players -lt 0 ]; then
      players=0
    fi
else
    status="OFFLINE"
    players=0
fi

echo "Server Status:    $status"
echo "Server Name:      $SERVER_NAME"
echo "Server IP:        ${IP_ADDRESS}:${PORT}"
echo "Players Online:   ${players}"
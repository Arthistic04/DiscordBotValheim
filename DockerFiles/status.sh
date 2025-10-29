#!/bin/bash
cd /home/vhuser/vhserver
CONTAINER_NAME="valheim-server"
IP_ADDRESS="Under Testing"
PORT="2456"
SERVER_NAME="Roshar"

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
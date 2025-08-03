// Simple WebSocket Chess Server for Local Testing
// Run with: node server.js

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTTP server for serving files (optional)
const server = http.createServer((req, res) => {
    // Simple file server for testing
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Access denied');
        return;
    }
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }
        
        // Set content type based on file extension
        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json'
        }[ext] || 'text/plain';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// Store active rooms and players
const rooms = new Map();
const players = new Map(); // WebSocket -> player info

// Generate random room code
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Send message to WebSocket
function sendMessage(ws, type, data) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
    }
}

// Broadcast to all players in a room
function broadcastToRoom(roomCode, type, data, excludeWs = null) {
    const room = rooms.get(roomCode);
    if (!room) return;
    
    room.players.forEach(player => {
        if (player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
            sendMessage(player.ws, type, data);
        }
    });
}

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    // Send welcome message
    sendMessage(ws, 'connected', { 
        message: 'Connected to chess server',
        serverId: 'chess-local-server-v1.0'
    });
    
    ws.on('message', (message) => {
        try {
            const { type, data } = JSON.parse(message);
            console.log(`Received message: ${type}`, data);
            
            switch (type) {
                case 'ping':
                    sendMessage(ws, 'pong', { timestamp: Date.now() });
                    break;
                    
                case 'createRoom':
                    handleCreateRoom(ws, data);
                    break;
                    
                case 'joinRoom':
                    handleJoinRoom(ws, data);
                    break;
                    
                case 'leaveRoom':
                    handleLeaveRoom(ws);
                    break;
                    
                case 'move':
                    handleMove(ws, data);
                    break;
                    
                case 'chatMessage':
                    handleChatMessage(ws, data);
                    break;
                    
                case 'startGame':
                    handleStartGame(ws);
                    break;
                    
                default:
                    sendMessage(ws, 'error', { message: `Unknown message type: ${type}` });
            }
        } catch (error) {
            console.error('Error processing message:', error);
            sendMessage(ws, 'error', { message: 'Invalid message format' });
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
        handleLeaveRoom(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

function handleCreateRoom(ws, data) {
    const { playerName } = data;
    const roomCode = generateRoomCode();
    
    // Ensure unique room code
    while (rooms.has(roomCode)) {
        roomCode = generateRoomCode();
    }
    
    const room = {
        code: roomCode,
        players: [],
        createdAt: Date.now(),
        gameStarted: false
    };
    
    const player = {
        ws,
        name: playerName || 'Player 1',
        color: 'white', // Host is always white
        roomCode,
        isHost: true
    };
    
    room.players.push(player);
    rooms.set(roomCode, room);
    players.set(ws, player);
    
    sendMessage(ws, 'roomCreated', {
        roomCode,
        playerColor: 'white',
        playerName: player.name,
        isHost: true
    });
    
    console.log(`Room ${roomCode} created by ${player.name}`);
}

function handleJoinRoom(ws, data) {
    const { roomCode, playerName } = data;
    const room = rooms.get(roomCode);
    
    if (!room) {
        sendMessage(ws, 'error', { message: 'Room not found' });
        return;
    }
    
    if (room.players.length >= 2) {
        sendMessage(ws, 'error', { message: 'Room is full' });
        return;
    }
    
    if (room.gameStarted) {
        sendMessage(ws, 'error', { message: 'Game already in progress' });
        return;
    }
    
    const player = {
        ws,
        name: playerName || 'Player 2',
        color: 'black', // Second player is always black
        roomCode,
        isHost: false
    };
    
    room.players.push(player);
    players.set(ws, player);
    
    // Notify the joining player
    sendMessage(ws, 'roomJoined', {
        roomCode,
        playerColor: 'black',
        playerName: player.name,
        isHost: false,
        players: room.players.map(p => ({
            name: p.name,
            color: p.color,
            isHost: p.isHost
        }))
    });
    
    // Notify existing players
    broadcastToRoom(roomCode, 'playerJoined', {
        playerName: player.name,
        playerColor: 'black',
        players: room.players.map(p => ({
            name: p.name,
            color: p.color,
            isHost: p.isHost
        }))
    }, ws);
    
    console.log(`${player.name} joined room ${roomCode}`);
}

function handleLeaveRoom(ws) {
    const player = players.get(ws);
    if (!player) return;
    
    const room = rooms.get(player.roomCode);
    if (!room) return;
    
    // Remove player from room
    room.players = room.players.filter(p => p.ws !== ws);
    players.delete(ws);
    
    // Notify remaining players
    if (room.players.length > 0) {
        broadcastToRoom(player.roomCode, 'playerLeft', {
            playerName: player.name,
            players: room.players.map(p => ({
                name: p.name,
                color: p.color,
                isHost: p.isHost
            }))
        });
    } else {
        // Delete empty room
        rooms.delete(player.roomCode);
        console.log(`Room ${player.roomCode} deleted (empty)`);
    }
    
    console.log(`${player.name} left room ${player.roomCode}`);
}

function handleMove(ws, data) {
    const player = players.get(ws);
    if (!player) {
        sendMessage(ws, 'error', { message: 'Player not in room' });
        return;
    }
    
    const room = rooms.get(player.roomCode);
    if (!room || !room.gameStarted) {
        sendMessage(ws, 'error', { message: 'Game not started' });
        return;
    }
    
    // Broadcast move to other players in the room
    broadcastToRoom(player.roomCode, 'moveReceived', {
        ...data,
        playerColor: player.color,
        playerName: player.name
    }, ws);
    
    console.log(`Move from ${player.name} in room ${player.roomCode}`);
}

function handleChatMessage(ws, data) {
    const player = players.get(ws);
    if (!player) {
        sendMessage(ws, 'error', { message: 'Player not in room' });
        return;
    }
    
    const { message } = data;
    
    // Broadcast chat message to room
    broadcastToRoom(player.roomCode, 'chatMessage', {
        playerName: player.name,
        message,
        timestamp: Date.now()
    }, ws);
    
    console.log(`Chat from ${player.name}: ${message}`);
}

function handleStartGame(ws) {
    const player = players.get(ws);
    if (!player) {
        sendMessage(ws, 'error', { message: 'Player not in room' });
        return;
    }
    
    const room = rooms.get(player.roomCode);
    if (!room) {
        sendMessage(ws, 'error', { message: 'Room not found' });
        return;
    }
    
    if (!player.isHost) {
        sendMessage(ws, 'error', { message: 'Only host can start game' });
        return;
    }
    
    if (room.players.length < 2) {
        sendMessage(ws, 'error', { message: 'Need 2 players to start' });
        return;
    }
    
    if (room.gameStarted) {
        sendMessage(ws, 'error', { message: 'Game already started' });
        return;
    }
    
    room.gameStarted = true;
    
    // Notify all players that game started
    broadcastToRoom(player.roomCode, 'gameStarted', {
        players: room.players.map(p => ({
            name: p.name,
            color: p.color,
            isHost: p.isHost
        })),
        startTime: Date.now()
    });
    
    console.log(`Game started in room ${player.roomCode}`);
}

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Chess server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
    console.log(`HTTP server: http://localhost:${PORT}`);
    console.log('');
    console.log('Active rooms:', rooms.size);
    console.log('Connected players:', players.size);
});

// Cleanup function for graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    
    // Close all WebSocket connections
    wss.clients.forEach(ws => {
        ws.close();
    });
    
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Periodic cleanup of old empty rooms
setInterval(() => {
    const now = Date.now();
    const roomsToDelete = [];
    
    rooms.forEach((room, code) => {
        // Delete rooms older than 1 hour with no players
        if (room.players.length === 0 && (now - room.createdAt) > 3600000) {
            roomsToDelete.push(code);
        }
    });
    
    roomsToDelete.forEach(code => {
        rooms.delete(code);
        console.log(`Cleaned up old room: ${code}`);
    });
}, 300000); // Check every 5 minutes

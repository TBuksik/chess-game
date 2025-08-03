// Vercel API route for WebSocket-like functionality
// Since Vercel doesn't support persistent WebSocket connections,
// we'll use Server-Sent Events (SSE) and polling for real-time communication

export default async function handler(req, res) {
    // Set CORS headers for your domain
    res.setHeader('Access-Control-Allow-Origin', 'https://chess-game-one-amber.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method === 'GET') {
        // Server-Sent Events endpoint for real-time updates
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Send initial connection message
        res.write(`data: ${JSON.stringify({
            type: 'connected',
            message: 'Connected to chess server',
            timestamp: Date.now()
        })}\n\n`);
        
        // Keep connection alive
        const heartbeat = setInterval(() => {
            res.write(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: Date.now()
            })}\n\n`);
        }, 30000);
        
        // Clean up on disconnect
        req.on('close', () => {
            clearInterval(heartbeat);
        });
        
        return;
    }
    
    if (req.method === 'POST') {
        // Handle game messages
        const { type, data } = req.body;
        
        // Simple in-memory storage for demo
        // In production, use a database or Redis
        const response = await handleGameMessage(type, data);
        
        res.status(200).json(response);
        return;
    }
    
    res.status(405).json({ error: 'Method not allowed' });
}

async function handleGameMessage(type, data) {
    switch (type) {
        case 'createRoom':
            return {
                type: 'roomCreated',
                roomCode: generateRoomCode(),
                playerColor: 'white',
                success: true
            };
            
        case 'joinRoom':
            return {
                type: 'roomJoined',
                roomCode: data.roomCode,
                playerColor: 'black',
                success: true
            };
            
        case 'move':
            // Broadcast move to other player
            return {
                type: 'moveReceived',
                move: data.move,
                success: true
            };
            
        default:
            return {
                type: 'error',
                message: 'Unknown message type',
                success: false
            };
    }
}

function generateRoomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

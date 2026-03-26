/**
 * backend/utils/notificationManager.js
 * SSE (Server-Sent Events) Manager for real-time notifications
 */

let clients = [];

/**
 * Register a neuen client (user) to the SSE stream
 * @param {Object} req 
 * @param {Object} res 
 * @param {String} userId 
 */
const registerClient = (req, res, userId) => {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        userId: userId.toString(),
        res
    };

    clients.push(newClient);

    // Initial heartbeat
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`);

    req.on('close', () => {
        console.log(`SSE: Client ${clientId} disconnected`);
        clients = clients.filter(client => client.id !== clientId);
    });
};

/**
 * Send a notification to specific user(s) or all (admin)
 * @param {Object} notificationData 
 * @param {String|Array} targetUserIds - null for broadcast
 */
const sendNotification = (notificationData, targetUserIds = null) => {
    let targets = clients;

    if (targetUserIds) {
        const ids = Array.isArray(targetUserIds) ? targetUserIds.map(id => id.toString()) : [targetUserIds.toString()];
        targets = clients.filter(client => ids.includes(client.userId));
    }

    targets.forEach(client => {
        client.res.write(`data: ${JSON.stringify(notificationData)}\n\n`);
    });
};

/**
 * Broadcast to all connected admins
 * @param {Object} notificationData 
 */
const broadcastToAdmins = (notificationData, adminIds) => {
    const targets = clients.filter(client => adminIds.map(id => id.toString()).includes(client.userId));
    targets.forEach(client => {
        client.res.write(`data: ${JSON.stringify(notificationData)}\n\n`);
    });
};

module.exports = {
    registerClient,
    sendNotification,
    broadcastToAdmins
};

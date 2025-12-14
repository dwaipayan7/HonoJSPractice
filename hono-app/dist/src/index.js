import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import { cors } from "hono/cors";
const app = new Hono();
app.use("/*", cors());
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
// Store all active WebSocket connections
const clients = new Set();
// Health Check
app.get("/", (c) => {
    return c.json({ status: "ok", message: "Chat server running" });
});
// WebSocket endpoint
app.get("/ws", upgradeWebSocket(() => {
    return {
        onOpen(evt, ws) {
            console.log("Client Connected. Total clients:", clients.size + 1);
            clients.add(ws);
        },
        onMessage(evt, ws) {
            try {
                const data = JSON.parse(evt.data.toString());
                console.log("Message received:", data);
                // Broadcast to all connected clients
                clients.forEach((client) => {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify(data));
                    }
                });
            }
            catch (error) {
                console.error("Error parsing message:", error);
            }
        },
        onClose(evt, ws) {
            console.log("Client Disconnected. Total clients:", clients.size - 1);
            clients.delete(ws);
        },
        onError(evt, ws) {
            console.error("WebSocket error:", evt);
        },
    };
}));
app.post("/", async (c) => {
    const body = await c.req.json();
    const { name, email } = body;
    return c.json({
        success: true,
        message: "User received successfully",
        data: { name, email },
    });
});
const server = serve({
    fetch: app.fetch,
    port: 3000,
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
injectWebSocket(server);

import app from './app';
import 'dotenv/config';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { companyClients, ExtendedWebSocket } from './websocket';
import { resolveRequest } from './messageHandler';

// require("dotenv").config();
const port = process.env.PORT || 8000;
const wsPort = 81;

// Start HTTP server
app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});

// Create HTTP server for WebSocket
const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: ExtendedWebSocket, req) => {
  console.log("New client connected");
  
  // Extract company ID from URL path (e.g., /service1)
  const urlPath = req.url || '/';
  const companyId = urlPath.substring(1); // Remove leading slash
  
  console.log(`Connection URL: ${urlPath}, Company ID: ${companyId}`);
  
  // Auto-register the client if companyId is provided in URL
  if (companyId) {
    if (!companyClients.has(companyId)) {
      companyClients.set(companyId, new Set());
    }
    companyClients.get(companyId)!.add(ws);
    ws.companyId = companyId;
    console.log(`Client auto-registered under company: ${companyId}`);
  }
  
  ws.on("message", (raw) => {
        let msg;

        try {
            msg = JSON.parse(raw.toString());
        } catch (err) {
            return console.log("Invalid JSON:", raw);
        }

        // 1) Клиент өөрийгөө бүртгэж байна
        if (msg.type === "register") {
            const companyId = msg.companyId;

            // map-д companyId байхгүй бол шинээр үүсгэнэ
            if (!companyClients.has(companyId)) {
                companyClients.set(companyId, new Set());
            }

            companyClients.get(companyId)!.add(ws);
            ws.companyId = companyId;   // socket-д өөр дээр нь хадгална

            console.log(`Client registered under company: ${companyId}`);
            return;
        }

        // 2) Response to a request (with requestId)
        if (msg.type === "response" && msg.requestId) {
            console.log(`Received response for request: ${msg.requestId}`);
            resolveRequest(msg.requestId, msg.data);
            return;
        }

        // 3) Бусад мессеж → зөвхөн тухайн компанийн клиентэд тараана
        const companyId = ws.companyId;
        if (companyId) {
            const clientsInCompany = companyClients.get(companyId);

            if (clientsInCompany) {
                for (const client of clientsInCompany) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(msg));
                       
                    }
                }
            }
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");

        // холболт тасрахад компаний map-аас устгана
        if (ws.companyId) {
            const clients = companyClients.get(ws.companyId);
            clients?.delete(ws);
        }
    });
});

// Start WebSocket server on port 81
server.listen(wsPort, () => {
  console.log(`WebSocket server listening on port ${wsPort}`);
});
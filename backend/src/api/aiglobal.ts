import express from "express";
import os from "node:os";
import { companyClients } from "../websocket";
import { WebSocket } from 'ws';
import { generateRequestId, waitForResponse } from "../messageHandler";

const router = express.Router();

const companyId = "service1";

type OrderType = {
  return: any;
};

const order = new Map<string, OrderType>();



router.get("/", async (req, res) => {
  console.log(req.params);
  console.log(req.query);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (!req.query.id) {
    res.json(["😀", "😳", "🙄", order.size.toString(), os.platform().toString()]);
  } else {
    // res.json([
    //     {
    //       "CAR": "Цайны зам",
    //       "CON": "2025/08-92",
    //       "DRN": "Б.ЭНХБАТ ЕТ74102419 96650888",
    //       "LPC": "ПАТРИКЕЙН ХХК",
    //       "SLN": "ZW0341369-ZW0341381",
    //       "TRL": "1330СЧ",
    //       "UPC": "Erlian",
    //       "AKT": "11112025102800063",
    //       "NET": 28750,
    //       "WGT": 43950,
    //       "VNO": "3826ДГН",
    //       "CT1": "",
    //       "CMN": ""
    //     }
    //   ]);
    const id = req.query.id.toString();
    
    // Get WebSocket clients for this company
    const clients = companyClients.get(companyId);
    
    if (clients && clients.size > 0) {
      // Generate unique request ID
      const requestId = generateRequestId();
      
      // Send message to all connected clients for this company
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "request",
            requestId: requestId,
            id: id
          }));
        }
      }

      try {
        // Wait for response from client (5 second timeout)
        const responseData = await waitForResponse(requestId, 5000);
        console.log("Response data received:", responseData);
        res.json(responseData);
      } catch (error) {
        res.status(408).json({
          success: false,
          error: "Request timeout - no response from client",
          companyId,
          connectedClients: clients.size
        });
      }
    } else {
      res.status(404).json({
        success: false,
        error: "No clients connected",
        companyId,
        connectedClients: 0,
        hasClients: false
      });
    }
  }
});

export default router;

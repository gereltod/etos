import express from "express";
import os from "node:os";
import sha256 from "sha256";
import { v4 as uuidV4 } from "uuid";

const router = express.Router();

type EmojiResponse = (string | object)[];

type OrderType = {
  return: any;
};

const order = new Map<string, OrderType>();



router.get<{}, EmojiResponse>("/", (req, res) => {
  console.log(req.params);
  console.log(req.query);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (!req.query.id) {
    res.json(["😀", "😳", "🙄", order.size.toString(), os.platform().toString()]);
  } else {
    res.json([
        {
          "CAR": "Цайны зам",
          "CON": "2025/08-92",
          "DRN": "Б.ЭНХБАТ ЕТ74102419 96650888",
          "LPC": "ПАТРИКЕЙН ХХК",
          "SLN": "ZW0341369-ZW0341381",
          "TRL": "1330СЧ",
          "UPC": "Erlian",
          "AKT": "11112025102800063",
          "NET": 28750,
          "WGT": 43950,
          "VNO": "3826ДГН",
          "CT1": "",
          "CMN": ""
        }
      ]);
  }
});



export default router;

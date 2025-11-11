import express from 'express';

import MessageResponse from '../interfaces/MessageResponse';
import aiglobal from './aiglobal';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/service1', aiglobal);

export default router;
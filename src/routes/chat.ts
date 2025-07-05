import { Router } from 'express';
import { chatWithPDF } from '../services/langchainService';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { question } = req.body;
    const response = await chatWithPDF(question);
    res.json({ answer: response });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Chat failed' });
  }
});

export default router;

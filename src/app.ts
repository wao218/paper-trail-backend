import express from 'express';
import multer from 'multer';
import uploadRouter from './routes/upload';
import chatRouter from './routes/chat';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/upload', uploadRouter);
app.use('/chat', chatRouter);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: `Multer error: ${err.message}` });
  } else {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export { app };

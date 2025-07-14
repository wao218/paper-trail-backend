import express, { ErrorRequestHandler } from 'express';
import multer from 'multer';
import uploadRouter from './routes/upload';
import chatRouter from './routes/chat';
import cors from 'cors';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://paper-trail-frontend.vercel.app',
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());
app.use('/upload', uploadRouter);
app.use('/chat', chatRouter);

const multerErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: `Multer error: ${err.message}` });
  } else {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};

app.use(multerErrorHandler);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export { app };

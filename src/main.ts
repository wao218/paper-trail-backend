import { app } from './app.ts';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});

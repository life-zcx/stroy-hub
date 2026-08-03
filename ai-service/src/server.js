import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 5005;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-service', timestamp: new Date() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AI SERVICE] Tormag AI Microservice is running on port ${PORT}`);
});

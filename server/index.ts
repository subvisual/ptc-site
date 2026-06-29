import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import express from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { communitiesRouter } from './routes/communities.js';
import { configRouter } from './routes/config.js';
import { portalRouter } from './routes/portal.js';

const app = express();
const PORT = Number(process.env.API_PORT ?? 3001);

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/communities', communitiesRouter);
app.use('/api/config', configRouter);
app.use('/api/portal', portalRouter);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

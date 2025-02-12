import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes';
import broadcastRoutes from './routes/broadcastRoutes';
import helmet from 'helmet';
import cors from 'cors';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

export default app;


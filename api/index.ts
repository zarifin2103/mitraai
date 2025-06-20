// Vercel serverless function entry point
import express from "express";
import cors from "cors";
import { registerRoutes } from "../server/routes";
import { setupAuth } from "../server/replitAuth";

const app = express();

// CORS configuration for Vercel
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true // Allow all origins in production for Vercel
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup authentication
await setupAuth(app);

// Setup routes without vite middleware
const server = await registerRoutes(app);

export default app;
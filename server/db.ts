import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use external Neon DB - from environment variable or fallback
const EXTERNAL_DATABASE_URL = process.env.DATABASE_URL || "postgresql://mitraai_owner:npg_sg0DNjWy8XJf@ep-odd-credit-a14feb62-pooler.ap-southeast-1.aws.neon.tech/mitraai?sslmode=require";

if (!EXTERNAL_DATABASE_URL) {
  throw new Error("External DATABASE_URL must be configured");
}

console.log("Using external Neon database:", EXTERNAL_DATABASE_URL.split('@')[1]?.split('/')[0] || 'configured');

export const pool = new Pool({ connectionString: EXTERNAL_DATABASE_URL });
export const db = drizzle({ client: pool, schema });
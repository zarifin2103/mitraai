import { Pool, neonConfig, type NeonDatabase } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { sql } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

const EXTERNAL_DATABASE_URL = process.env.DATABASE_URL || "postgresql://mitraai_owner:npg_sg0DNjWy8XJf@ep-odd-credit-a14feb62-pooler.ap-southeast-1.aws.neon.tech/mitraai?sslmode=require";

let dbInstance: NeonDatabase<typeof schema> | null = null;

export function getDb(): NeonDatabase<typeof schema> {
  if (!dbInstance) {
    console.log("Database instance not yet initialized. Attempting to initialize.");
    if (!EXTERNAL_DATABASE_URL) {
      const errMsg = "CRITICAL: External DATABASE_URL is not configured. Cannot initialize database.";
      console.error(errMsg);
      throw new Error(errMsg);
    }
    try {
      console.log("Initializing Neon database pool for host:", EXTERNAL_DATABASE_URL.split('@')[1]?.split('/')[0] || 'configured host');
      const pool = new Pool({ connectionString: EXTERNAL_DATABASE_URL });
      console.log("Database pool created. Initializing Drizzle ORM.");
      dbInstance = drizzle(pool, { schema }); // Corrected based on original usage: drizzle(client, { schema })
      console.log("Database instance initialized successfully via getDb().");
    } catch (error) {
      console.error("Failed to initialize database instance in getDb():", error);
      throw error;
    }
  }
  return dbInstance;
}

export async function connectDb() {
    console.log("connectDb called. Ensuring DB instance is available.");
    const currentDb = getDb(); // ensure it's initialized
    try {
        console.log("Executing test query (SELECT 1).");
        await currentDb.execute(sql`SELECT 1`);
        console.log("Successfully connected to database and executed a test query via connectDb().");
    } catch (error) {
        console.error("Failed to connect to database or execute test query via connectDb():", error);
        throw error;
    }
}
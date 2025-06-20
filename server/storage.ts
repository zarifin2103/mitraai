import {
  users,
  chats,
  messages,
  documents,
  adminSettings,
  llmModels,
  userCredits,
  researchSources,
  researchQuestions,
  researchKeywords,
  type User,
  type UpsertUser,
  type Chat,
  type InsertChat,
  type Message,
  type InsertMessage,
  type Document,
  type InsertDocument,
  type AdminSetting,
  type InsertAdminSetting,
  type LlmModel,
  type InsertLlmModel,
  type UserCredits,
  type InsertUserCredits,
  type ResearchSource,
  type InsertResearchSource,
  type ResearchQuestion,
  type InsertResearchQuestion,
  type ResearchKeyword,
  type InsertResearchKeyword,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations for custom authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Chat operations
  getUserChats(userId: string): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChatTitle(chatId: number, title: string): Promise<void>;
  deleteChat(chatId: number): Promise<void>;
  
  // Message operations
  getChatMessages(chatId: number): Promise<Message[]>;
  addMessage(message: InsertMessage): Promise<Message>;
  
  // Document operations
  getUserDocuments(userId: string): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Admin operations
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
  getAllAdminSettings(): Promise<AdminSetting[]>;
  
  // LLM Model operations
  getAllLlmModels(): Promise<LlmModel[]>;
  getActiveLlmModels(): Promise<LlmModel[]>;
  createLlmModel(model: InsertLlmModel): Promise<LlmModel>;
  updateLlmModel(modelId: string, updates: Partial<LlmModel>): Promise<LlmModel>;
  deleteLlmModel(modelId: string): Promise<void>;
  
  // User credits operations
  getUserCredits(userId: string): Promise<UserCredits | undefined>;
  createUserCredits(userCredits: InsertUserCredits): Promise<UserCredits>;
  updateUserCredits(userId: string, updates: Partial<UserCredits>): Promise<UserCredits>;
  deductCredits(userId: string, amount: number): Promise<UserCredits>;
  
  // Research operations
  getChatResearchSources(chatId: number): Promise<ResearchSource[]>;
  addResearchSource(source: InsertResearchSource): Promise<ResearchSource>;
  getChatResearchQuestions(chatId: number): Promise<ResearchQuestion[]>;
  addResearchQuestion(question: InsertResearchQuestion): Promise<ResearchQuestion>;
  updateResearchQuestion(id: number, updates: Partial<ResearchQuestion>): Promise<ResearchQuestion>;
  getChatResearchKeywords(chatId: number): Promise<ResearchKeyword[]>;
  addResearchKeyword(keyword: InsertResearchKeyword): Promise<ResearchKeyword>;
  updateKeywordFrequency(chatId: number, keyword: string): Promise<void>;
  
  // Chat title update operations
  getAllChatsForTitleUpdate(): Promise<Chat[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations for custom authentication
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Chat operations
  async getUserChats(userId: string): Promise<Chat[]> {
    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db
      .insert(chats)
      .values(chat)
      .returning();
    return newChat;
  }

  async updateChatTitle(chatId: number, title: string): Promise<void> {
    await db
      .update(chats)
      .set({ title, updatedAt: new Date() })
      .where(eq(chats.id, chatId));
  }

  async deleteChat(chatId: number): Promise<void> {
    await db.delete(chats).where(eq(chats.id, chatId));
  }

  // Message operations
  async getChatMessages(chatId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);
  }

  async addMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Document operations
  async getUserDocuments(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.updatedAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values({
        ...document,
        chatId: document.chatId || null,
      })
      .returning();
    return newDocument;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Admin operations
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, key));
    return setting;
  }

  async setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting> {
    const [newSetting] = await db
      .insert(adminSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: adminSettings.key,
        set: {
          value: setting.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newSetting;
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings);
  }

  // LLM Model operations
  async getAllLlmModels(): Promise<LlmModel[]> {
    return await db.select().from(llmModels).orderBy(llmModels.displayName);
  }

  async getActiveLlmModels(): Promise<LlmModel[]> {
    try {
      console.log("Fetching active LLM models from external database...");
      
      const result = await db
        .select()
        .from(llmModels)
        .where(eq(llmModels.isActive, true))
        .orderBy(llmModels.displayName);
        
      console.log("Successfully fetched", result.length, "active models");
      return result;
    } catch (error) {
      console.error("Error fetching active models:", error);
      throw error;
    }
  }

  async createLlmModel(model: InsertLlmModel): Promise<LlmModel> {
    const [newModel] = await db
      .insert(llmModels)
      .values(model)
      .returning();
    return newModel;
  }

  async updateLlmModel(modelId: string, updates: Partial<LlmModel>): Promise<LlmModel> {
    const [updatedModel] = await db
      .update(llmModels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(llmModels.modelId, modelId))
      .returning();
    return updatedModel;
  }

  async deleteLlmModel(modelId: string): Promise<void> {
    await db.delete(llmModels).where(eq(llmModels.modelId, modelId));
  }

  // User credits operations
  async getUserCredits(userId: string): Promise<UserCredits | undefined> {
    const [credits] = await db.select().from(userCredits).where(eq(userCredits.userId, userId));
    return credits;
  }

  async createUserCredits(userCreditsData: InsertUserCredits): Promise<UserCredits> {
    const [newCredits] = await db
      .insert(userCredits)
      .values(userCreditsData)
      .returning();
    return newCredits;
  }

  async updateUserCredits(userId: string, updates: Partial<UserCredits>): Promise<UserCredits> {
    const [updatedCredits] = await db
      .update(userCredits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userCredits.userId, userId))
      .returning();
    return updatedCredits;
  }

  async deductCredits(userId: string, amount: number): Promise<UserCredits> {
    const [updatedCredits] = await db
      .update(userCredits)
      .set({
        usedCredits: sql`${userCredits.usedCredits} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(userCredits.userId, userId))
      .returning();
    return updatedCredits;
  }
}

export const storage = new DatabaseStorage();

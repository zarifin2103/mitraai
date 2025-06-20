import {
  users,
  chats,
  messages,
  documents,
  adminSettings,
  llmModels,
  userCredits,
  subscriptionPackages,
  userSubscriptions,
  payments,
  apiUsageLogs,
  systemSettings,
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
  type SubscriptionPackage,
  type InsertSubscriptionPackage,
  type UserSubscription,
  type InsertUserSubscription,
  type Payment,
  type InsertPayment,
  type ApiUsageLog,
  type InsertApiUsageLog,
  type SystemSetting,
  type InsertSystemSetting,
  type ResearchSource,
  type InsertResearchSource,
  type ResearchQuestion,
  type InsertResearchQuestion,
  type ResearchKeyword,
  type InsertResearchKeyword,
  // Import IStorage if it's defined within schema.ts or a separate types file
  // For this example, assuming IStorage is part of the schemaFull import
  IStorage as ISchemaStorage, // Alias to avoid naming conflict if IStorage is re-declared
} from "@shared/schema";
import { getDb } from "./db"; // Changed from `import { db }`
import { type NeonDatabase } from '@neondatabase/serverless'; // For typing _db
import * as schemaFull from "@shared/schema"; // For using schema types

import { eq, desc, and, sql } from "drizzle-orm";

// Destructure specific table schemas needed from schemaFull for use in methods
const {
  users, chats, messages, documents, adminSettings, llmModels,
  userCredits, subscriptionPackages, userSubscriptions, payments,
  apiUsageLogs, systemSettings, researchSources, researchQuestions,
  researchKeywords
} = schemaFull;

// Interface for storage operations (ensure this matches your actual IStorage definition)
// If IStorage is imported from @shared/schema, this local re-declaration might not be needed
// or should be perfectly identical. For this exercise, assuming it's defined as below or imported.
export interface IStorage extends ISchemaStorage {} // Use the imported IStorage

export class DatabaseStorage implements IStorage {
  // private db = db; // Old direct assignment removed
  private _db: NeonDatabase<typeof schemaFull> | null = null;

  private get db(): NeonDatabase<typeof schemaFull> {
    if (!this._db) {
      console.log("DatabaseStorage: _db is null. Calling getDb() to initialize.");
      this._db = getDb();
    }
    return this._db;
  }

  // User operations for custom authentication
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
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  
  // Subscription package operations
  getAllSubscriptionPackages(): Promise<SubscriptionPackage[]>;
  getSubscriptionPackage(id: number): Promise<SubscriptionPackage | undefined>;
  createSubscriptionPackage(pkgData: InsertSubscriptionPackage): Promise<SubscriptionPackage>;
  updateSubscriptionPackage(id: number, updates: Partial<SubscriptionPackage>): Promise<SubscriptionPackage>;
  deleteSubscriptionPackage(id: number): Promise<void>;
  
  // User subscription operations
  getAllUserSubscriptions(): Promise<UserSubscription[]>;
  getUserSubscription(userId: string): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: number, updates: Partial<UserSubscription>): Promise<UserSubscription>;
  
  // Payment operations
  getAllPayments(): Promise<Payment[]>;
  getUserPayments(userId: string): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, updates: Partial<Payment>): Promise<Payment>;
  
  // API usage log operations
  getApiUsageLogs(limit?: number): Promise<ApiUsageLog[]>;
  getUserApiUsageLogs(userId: string): Promise<ApiUsageLog[]>;
  createApiUsageLog(log: InsertApiUsageLog): Promise<ApiUsageLog>;
  
  // System settings operations
  getAllSystemSettings(): Promise<SystemSetting[]>;
  getSystemSetting(category: string, key: string): Promise<SystemSetting | undefined>;
  setSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(id: number, updates: Partial<SystemSetting>): Promise<SystemSetting>;
  deleteSystemSetting(id: number): Promise<void>;
}

  async getUser(id: string): Promise<schemaFull.User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<schemaFull.User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<schemaFull.User | null> {
    if (!this.db) {
      console.error("Database not initialized in getUserByEmail");
      // Consider how you want to handle this: throw, or ensure db is always initialized.
      // For now, let's assume db should be initialized by the time this is called.
      // If it can truly be null/undefined here, you might need a more robust solution
      // or ensure your application's lifecycle guarantees db initialization.
      throw new Error("Database not initialized");
    }
    try {
      const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error(`Error fetching user by email ${email}:`, error);
      // Depending on your error handling strategy, you might want to:
      // 1. Return null (as the function signature suggests for "not found" or error cases)
      // 2. Re-throw the error or a custom error
      return null;
    }
  }

  async createUser(userData: schemaFull.UpsertUser): Promise<schemaFull.User> {
    const [user] = await this.db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: schemaFull.UpsertUser): Promise<schemaFull.User> {
    const [user] = await this.db
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
  async getUserChats(userId: string): Promise<schemaFull.Chat[]> {
    const result = await this.db
      .select({
        id: chats.id,
        userId: chats.userId,
        title: chats.title,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
        mode: chats.mode,
        metadata: chats.metadata, // Ensure all fields from Chat type are here
        deletedAt: chats.deletedAt,
        summary: chats.summary,
        context: chats.context,
      })
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
    return result as schemaFull.Chat[]; // Assuming 'mode' in chats table is compatible with Chat['mode'] type
  }

  async createChat(chat: schemaFull.InsertChat): Promise<schemaFull.Chat> {
    const [newChat] = await this.db // Changed from global `db` to `this.db`
      .insert(chats)
      .values(chat)
      .returning();
    return newChat;
  }

  async updateChatTitle(chatId: number, title: string): Promise<void> {
    await this.db // Changed from global `db` to `this.db`
      .update(chats)
      .set({ title, updatedAt: new Date() })
      .where(eq(chats.id, chatId));
  }

  async deleteChat(chatId: number): Promise<void> {
    await this.db.delete(chats).where(eq(chats.id, chatId));
  }

  // Message operations
  async getChatMessages(chatId: number): Promise<schemaFull.Message[]> {
    // Assuming messages schema matches Message type. If not, select explicitly.
    const result = await this.db // Changed from global `db` to `this.db`
      .select() // Or select specific columns if type mismatch
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);
    return result as schemaFull.Message[]; // Add 'as Message[]' if select() is used without explicit fields
                               // and if Drizzle's inference isn't perfect.
                               // If you selected specific fields, ensure they match Message type.
  }

  async addMessage(message: schemaFull.InsertMessage): Promise<schemaFull.Message> {
    const [newMessage] = await this.db // Changed from global `db` to `this.db`
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Document operations
  async getUserDocuments(userId: string): Promise<schemaFull.Document[]> {
    return await this.db // Changed from global `db` to `this.db`
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.updatedAt));
  }

  async getDocument(id: number): Promise<schemaFull.Document | undefined> {
    const [document] = await this.db // Changed from global `db` to `this.db`
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: schemaFull.InsertDocument): Promise<schemaFull.Document> {
    const [newDocument] = await this.db // Changed from global `db` to `this.db`
      .insert(documents)
      .values({
        ...document,
        chatId: document.chatId || null,
      })
      .returning();
    return newDocument;
  }

  async updateDocument(id: number, updates: Partial<schemaFull.Document>): Promise<schemaFull.Document> {
    const [updatedDocument] = await this.db // Changed from global `db` to `this.db`
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    await this.db.delete(documents).where(eq(documents.id, id));
  }

  // Admin operations
  async getAdminSetting(key: string): Promise<schemaFull.AdminSetting | undefined> {
    const [setting] = await this.db // Changed from global `db` to `this.db`
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, key));
    return setting;
  }

  async setAdminSetting(setting: schemaFull.InsertAdminSetting): Promise<schemaFull.AdminSetting> {
    const [newSetting] = await this.db // Changed from global `db` to `this.db`
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

  async getAllAdminSettings(): Promise<schemaFull.AdminSetting[]> {
    return await this.db.select().from(adminSettings);
  }

  // LLM Model operations
  async getAllLlmModels(): Promise<schemaFull.LlmModel[]> {
    return await this.db.select().from(llmModels).orderBy(llmModels.displayName);
  }

  async getActiveLlmModels(): Promise<schemaFull.LlmModel[]> {
    try {
      console.log("Fetching active LLM models from external database...");
      
      const result = await this.db // Changed from global `db` to `this.db`
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

  async createLlmModel(model: schemaFull.InsertLlmModel): Promise<schemaFull.LlmModel> {
    const [newModel] = await this.db // Changed from global `db` to `this.db`
      .insert(llmModels)
      .values(model)
      .returning();
    return newModel;
  }

  async updateLlmModel(modelId: string, updates: Partial<schemaFull.LlmModel>): Promise<schemaFull.LlmModel> {
    const [updatedModel] = await this.db // Changed from global `db` to `this.db`
      .update(llmModels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(llmModels.modelId, modelId))
      .returning();
    return updatedModel;
  }

  async deleteLlmModel(modelId: string): Promise<void> {
    await this.db.delete(llmModels).where(eq(llmModels.modelId, modelId));
  }

  async getLlmModel(modelId: string): Promise<schemaFull.LlmModel | undefined> {
    const [model] = await this.db // Changed from global `db` to `this.db`
      .select()
      .from(llmModels)
      .where(eq(llmModels.modelId, modelId));
    return model;
  }

  // User credits operations
  async getUserCredits(userId: string): Promise<schemaFull.UserCredits | undefined> {
    const [credits] = await this.db.select().from(userCredits).where(eq(userCredits.userId, userId));
    return credits;
  }

  async createUserCredits(userCreditsData: schemaFull.InsertUserCredits): Promise<schemaFull.UserCredits> {
    const [newCredits] = await this.db // Changed from global `db` to `this.db`
      .insert(userCredits)
      .values(userCreditsData)
      .returning();
    return newCredits;
  }

  async updateUserCredits(userId: string, updates: Partial<schemaFull.UserCredits>): Promise<schemaFull.UserCredits> {
    const [updatedCredits] = await this.db // Changed from global `db` to `this.db`
      .update(userCredits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userCredits.userId, userId))
      .returning();
    return updatedCredits;
  }

  async deductCredits(userId: string, amount: number): Promise<schemaFull.UserCredits> {
    // First check if user has enough credits
    const currentCredits = await this.getUserCredits(userId);
    if (!currentCredits) {
      throw new Error(`User credits not found for user ${userId}`);
    }

    // Ensure totalCredits and usedCredits are treated as numbers, defaulting to 0 if null/undefined
    const totalCredits = currentCredits.totalCredits ?? 0;
    const usedCredits = currentCredits.usedCredits ?? 0;

    const remainingCredits = totalCredits - usedCredits;
    if (remainingCredits < amount) {
      throw new Error(`Insufficient credits. Required: ${amount}, Available: ${remainingCredits}`);
    }

    // Deduct credits
    const [updatedCredits] = await this.db // Changed from global `db` to `this.db`
      .update(userCredits)
      .set({
        usedCredits: sql`${userCredits.usedCredits} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(userCredits.userId, userId))
      .returning();

    if (!updatedCredits) {
      throw new Error(`Failed to deduct credits for user ${userId}`);
    }
    
    // Ensure totalCredits and usedCredits are treated as numbers for logging
    const newTotalCredits = updatedCredits.totalCredits ?? 0;
    const newUsedCredits = updatedCredits.usedCredits ?? 0;
    console.log(`✅ Deducted ${amount} credits from user ${userId}. New balance: ${newTotalCredits - newUsedCredits}`);
    return updatedCredits;
  }

  // Admin operations
  async getAllUsers(): Promise<schemaFull.User[]> {
    return await this.db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(userId: string, updates: Partial<schemaFull.User>): Promise<schemaFull.User> {
    const [updatedUser] = await this.db // Changed from global `db` to `this.db`
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, userId));
  }

  // Subscription package operations
  async getAllSubscriptionPackages(): Promise<schemaFull.SubscriptionPackage[]> {
    return await this.db.select().from(subscriptionPackages).orderBy(subscriptionPackages.price);
  }

  async getSubscriptionPackage(id: number): Promise<schemaFull.SubscriptionPackage | undefined> {
    const [package_] = await this.db.select().from(subscriptionPackages).where(eq(subscriptionPackages.id, id));
    return package_;
  }

  async createSubscriptionPackage(packageData: schemaFull.InsertSubscriptionPackage): Promise<schemaFull.SubscriptionPackage> {
    const [newPackage] = await this.db.insert(subscriptionPackages).values(packageData).returning();
    return newPackage;
  }

  async updateSubscriptionPackage(id: number, updates: Partial<schemaFull.SubscriptionPackage>): Promise<schemaFull.SubscriptionPackage> {
    const [updatedPackage] = await this.db
      .update(subscriptionPackages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionPackages.id, id))
      .returning();
    return updatedPackage;
  }

  async deleteSubscriptionPackage(id: number): Promise<void> {
    await this.db.delete(subscriptionPackages).where(eq(subscriptionPackages.id, id));
  }

  // User subscription operations
  async getAllUserSubscriptions(): Promise<schemaFull.UserSubscription[]> {
    return await this.db.select().from(userSubscriptions).orderBy(desc(userSubscriptions.createdAt));
  }

  async getUserSubscription(userId: string): Promise<schemaFull.UserSubscription | undefined> {
    const [subscription] = await this.db
      .select()
      .from(userSubscriptions)
      .where(and(eq(userSubscriptions.userId, userId), eq(userSubscriptions.status, "active")))
      .orderBy(desc(userSubscriptions.createdAt));
    return subscription;
  }

  async createUserSubscription(subscription: schemaFull.InsertUserSubscription): Promise<schemaFull.UserSubscription> {
    const [newSubscription] = await this.db.insert(userSubscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateUserSubscription(id: number, updates: Partial<schemaFull.UserSubscription>): Promise<schemaFull.UserSubscription> {
    const [updatedSubscription] = await this.db
      .update(userSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  // Payment operations
  async getAllPayments(): Promise<schemaFull.Payment[]> {
    return await this.db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getUserPayments(userId: string): Promise<schemaFull.Payment[]> {
    return await this.db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<schemaFull.Payment | undefined> {
    const [payment] = await this.db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: schemaFull.InsertPayment): Promise<schemaFull.Payment> {
    const [newPayment] = await this.db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: number, updates: Partial<schemaFull.Payment>): Promise<schemaFull.Payment> {
    const [updatedPayment] = await this.db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  // API usage log operations
  async getApiUsageLogs(limit: number = 100): Promise<schemaFull.ApiUsageLog[]> {
    return await this.db.select().from(apiUsageLogs).orderBy(desc(apiUsageLogs.createdAt)).limit(limit);
  }

  async getUserApiUsageLogs(userId: string): Promise<schemaFull.ApiUsageLog[]> {
    return await this.db.select().from(apiUsageLogs).where(eq(apiUsageLogs.userId, userId)).orderBy(desc(apiUsageLogs.createdAt));
  }

  async createApiUsageLog(log: schemaFull.InsertApiUsageLog): Promise<schemaFull.ApiUsageLog> {
    const [newLog] = await this.db.insert(apiUsageLogs).values(log).returning();
    return newLog;
  }

  // System settings operations
  async getAllSystemSettings(): Promise<schemaFull.SystemSetting[]> {
    return await this.db.select().from(systemSettings).orderBy(systemSettings.category, systemSettings.key);
  }

  async getSystemSetting(category: string, key: string): Promise<schemaFull.SystemSetting | undefined> {
    const [setting] = await this.db
      .select()
      .from(systemSettings)
      .where(and(eq(systemSettings.category, category), eq(systemSettings.key, key)));
    return setting;
  }

  async setSystemSetting(setting: schemaFull.InsertSystemSetting): Promise<schemaFull.SystemSetting> {
    // Check if setting already exists
    const existing = await this.getSystemSetting(setting.category, setting.key);
    
    if (existing) {
      // Update existing setting
      const [updatedSetting] = await this.db // Changed from global `db` to `this.db`
        .update(systemSettings)
        .set({ ...setting, updatedAt: new Date() })
        .where(eq(systemSettings.id, existing.id))
        .returning();
      return updatedSetting;
    } else {
      // Insert new setting
      const [newSetting] = await this.db.insert(systemSettings).values(setting).returning();
      return newSetting;
    }
  }

  async updateSystemSetting(id: number, updates: Partial<schemaFull.SystemSetting>): Promise<schemaFull.SystemSetting> {
    const [updatedSetting] = await this.db // Changed from global `db` to `this.db`
      .update(systemSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systemSettings.id, id))
      .returning();
    return updatedSetting;
  }

  async deleteSystemSetting(id: number): Promise<void> {
    await this.db.delete(systemSettings).where(eq(systemSettings.id, id));
  }

  // Research operations (existing methods from interface)
  async getChatResearchSources(chatId: number): Promise<schemaFull.ResearchSource[]> {
    return await this.db.select().from(researchSources).where(eq(researchSources.chatId, chatId)).orderBy(desc(researchSources.createdAt));
  }

  async addResearchSource(source: schemaFull.InsertResearchSource): Promise<schemaFull.ResearchSource> {
    const [newSource] = await this.db.insert(researchSources).values(source).returning();
    return newSource;
  }

  async getChatResearchQuestions(chatId: number): Promise<schemaFull.ResearchQuestion[]> {
    return await this.db.select().from(researchQuestions).where(eq(researchQuestions.chatId, chatId)).orderBy(researchQuestions.priority);
  }

  async addResearchQuestion(question: schemaFull.InsertResearchQuestion): Promise<schemaFull.ResearchQuestion> {
    const [newQuestion] = await this.db.insert(researchQuestions).values(question).returning();
    return newQuestion;
  }

  async updateResearchQuestion(id: number, updates: Partial<schemaFull.ResearchQuestion>): Promise<schemaFull.ResearchQuestion> {
    const [updatedQuestion] = await this.db // Changed from global `db` to `this.db`
      .update(researchQuestions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(researchQuestions.id, id))
      .returning();
    return updatedQuestion;
  }

  async getChatResearchKeywords(chatId: number): Promise<schemaFull.ResearchKeyword[]> {
    return await this.db.select().from(researchKeywords).where(eq(researchKeywords.chatId, chatId)).orderBy(desc(researchKeywords.frequency));
  }

  async addResearchKeyword(keyword: schemaFull.InsertResearchKeyword): Promise<schemaFull.ResearchKeyword> {
    const [newKeyword] = await this.db.insert(researchKeywords).values(keyword).returning();
    return newKeyword;
  }

  async updateKeywordFrequency(chatId: number, keyword: string): Promise<void> {
    await this.db // Changed from global `db` to `this.db`
      .update(researchKeywords)
      .set({ frequency: sql`${researchKeywords.frequency} + 1` })
      .where(and(eq(researchKeywords.chatId, chatId), eq(researchKeywords.keyword, keyword)));
  }

  async getAllChatsForTitleUpdate(): Promise<schemaFull.Chat[]> {
    const result = await this.db
      .select({
        id: chats.id,
        userId: chats.userId,
        title: chats.title,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
        mode: chats.mode,
        metadata: chats.metadata,
        deletedAt: chats.deletedAt,
        summary: chats.summary,
        context: chats.context,
      })
      .from(chats)
      .where(eq(chats.title, "New Chat")) // Consider if "New Chat" is the only title or make it more robust
      .orderBy(desc(chats.createdAt));
    return result as schemaFull.Chat[];
  }
}

export const storage = new DatabaseStorage();

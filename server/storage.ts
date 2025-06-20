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
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  
  // Subscription package operations
  getAllSubscriptionPackages(): Promise<SubscriptionPackage[]>;
  getSubscriptionPackage(id: number): Promise<SubscriptionPackage | undefined>;
  createSubscriptionPackage(package: InsertSubscriptionPackage): Promise<SubscriptionPackage>;
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

export class DatabaseStorage implements IStorage {
  private db = db;

  // User operations for custom authentication
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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
  async getUserChats(userId: string): Promise<Chat[]> {
    const result = await this.db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
    return result as Chat[];
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
    await this.db.delete(chats).where(eq(chats.id, chatId));
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
    await this.db.delete(documents).where(eq(documents.id, id));
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
    return await this.db.select().from(adminSettings);
  }

  // LLM Model operations
  async getAllLlmModels(): Promise<LlmModel[]> {
    return await this.db.select().from(llmModels).orderBy(llmModels.displayName);
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
    await this.db.delete(llmModels).where(eq(llmModels.modelId, modelId));
  }

  async getLlmModel(modelId: string): Promise<LlmModel | undefined> {
    const [model] = await db
      .select()
      .from(llmModels)
      .where(eq(llmModels.modelId, modelId));
    return model;
  }

  // User credits operations
  async getUserCredits(userId: string): Promise<UserCredits | undefined> {
    const [credits] = await this.db.select().from(userCredits).where(eq(userCredits.userId, userId));
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
    // First check if user has enough credits
    const currentCredits = await this.getUserCredits(userId);
    if (!currentCredits) {
      throw new Error(`User credits not found for user ${userId}`);
    }

    const remainingCredits = (currentCredits.totalCredits || 0) - (currentCredits.usedCredits || 0);
    if (remainingCredits < amount) {
      throw new Error(`Insufficient credits. Required: ${amount}, Available: ${remainingCredits}`);
    }

    // Deduct credits
    const [updatedCredits] = await db
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
    
    console.log(`✅ Deducted ${amount} credits from user ${userId}. New balance: ${updatedCredits.totalCredits - updatedCredits.usedCredits}`);
    return updatedCredits;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
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
  async getAllSubscriptionPackages(): Promise<SubscriptionPackage[]> {
    return await this.db.select().from(subscriptionPackages).orderBy(subscriptionPackages.price);
  }

  async getSubscriptionPackage(id: number): Promise<SubscriptionPackage | undefined> {
    const [package_] = await this.db.select().from(subscriptionPackages).where(eq(subscriptionPackages.id, id));
    return package_;
  }

  async createSubscriptionPackage(packageData: InsertSubscriptionPackage): Promise<SubscriptionPackage> {
    const [newPackage] = await this.db.insert(subscriptionPackages).values(packageData).returning();
    return newPackage;
  }

  async updateSubscriptionPackage(id: number, updates: Partial<SubscriptionPackage>): Promise<SubscriptionPackage> {
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
  async getAllUserSubscriptions(): Promise<UserSubscription[]> {
    return await this.db.select().from(userSubscriptions).orderBy(desc(userSubscriptions.createdAt));
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await this.db
      .select()
      .from(userSubscriptions)
      .where(and(eq(userSubscriptions.userId, userId), eq(userSubscriptions.status, "active")))
      .orderBy(desc(userSubscriptions.createdAt));
    return subscription;
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [newSubscription] = await this.db.insert(userSubscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateUserSubscription(id: number, updates: Partial<UserSubscription>): Promise<UserSubscription> {
    const [updatedSubscription] = await this.db
      .update(userSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  // Payment operations
  async getAllPayments(): Promise<Payment[]> {
    return await this.db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await this.db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await this.db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await this.db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: number, updates: Partial<Payment>): Promise<Payment> {
    const [updatedPayment] = await this.db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  // API usage log operations
  async getApiUsageLogs(limit: number = 100): Promise<ApiUsageLog[]> {
    return await this.db.select().from(apiUsageLogs).orderBy(desc(apiUsageLogs.createdAt)).limit(limit);
  }

  async getUserApiUsageLogs(userId: string): Promise<ApiUsageLog[]> {
    return await this.db.select().from(apiUsageLogs).where(eq(apiUsageLogs.userId, userId)).orderBy(desc(apiUsageLogs.createdAt));
  }

  async createApiUsageLog(log: InsertApiUsageLog): Promise<ApiUsageLog> {
    const [newLog] = await this.db.insert(apiUsageLogs).values(log).returning();
    return newLog;
  }

  // System settings operations
  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await this.db.select().from(systemSettings).orderBy(systemSettings.category, systemSettings.key);
  }

  async getSystemSetting(category: string, key: string): Promise<SystemSetting | undefined> {
    const [setting] = await this.db
      .select()
      .from(systemSettings)
      .where(and(eq(systemSettings.category, category), eq(systemSettings.key, key)));
    return setting;
  }

  async setSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    // Check if setting already exists
    const existing = await this.getSystemSetting(setting.category, setting.key);
    
    if (existing) {
      // Update existing setting
      const [updatedSetting] = await db
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

  async updateSystemSetting(id: number, updates: Partial<SystemSetting>): Promise<SystemSetting> {
    const [updatedSetting] = await db
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
  async getChatResearchSources(chatId: number): Promise<ResearchSource[]> {
    return await this.db.select().from(researchSources).where(eq(researchSources.chatId, chatId)).orderBy(desc(researchSources.createdAt));
  }

  async addResearchSource(source: InsertResearchSource): Promise<ResearchSource> {
    const [newSource] = await this.db.insert(researchSources).values(source).returning();
    return newSource;
  }

  async getChatResearchQuestions(chatId: number): Promise<ResearchQuestion[]> {
    return await this.db.select().from(researchQuestions).where(eq(researchQuestions.chatId, chatId)).orderBy(researchQuestions.priority);
  }

  async addResearchQuestion(question: InsertResearchQuestion): Promise<ResearchQuestion> {
    const [newQuestion] = await this.db.insert(researchQuestions).values(question).returning();
    return newQuestion;
  }

  async updateResearchQuestion(id: number, updates: Partial<ResearchQuestion>): Promise<ResearchQuestion> {
    const [updatedQuestion] = await db
      .update(researchQuestions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(researchQuestions.id, id))
      .returning();
    return updatedQuestion;
  }

  async getChatResearchKeywords(chatId: number): Promise<ResearchKeyword[]> {
    return await this.db.select().from(researchKeywords).where(eq(researchKeywords.chatId, chatId)).orderBy(desc(researchKeywords.frequency));
  }

  async addResearchKeyword(keyword: InsertResearchKeyword): Promise<ResearchKeyword> {
    const [newKeyword] = await this.db.insert(researchKeywords).values(keyword).returning();
    return newKeyword;
  }

  async updateKeywordFrequency(chatId: number, keyword: string): Promise<void> {
    await db
      .update(researchKeywords)
      .set({ frequency: sql`${researchKeywords.frequency} + 1` })
      .where(and(eq(researchKeywords.chatId, chatId), eq(researchKeywords.keyword, keyword)));
  }

  async getAllChatsForTitleUpdate(): Promise<Chat[]> {
    const result = await this.db.select().from(chats).where(eq(chats.title, "New Chat")).orderBy(desc(chats.createdAt));
    return result as Chat[];
  }
}

export const storage = new DatabaseStorage();

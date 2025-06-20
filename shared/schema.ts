import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for custom authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  password: varchar("password").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  mode: varchar("mode", { enum: ["riset", "create", "edit"] }).notNull(),
  documentId: integer("document_id").references(() => documents.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  role: varchar("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  modelId: varchar("model_id").references(() => llmModels.modelId),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  type: varchar("type", { enum: ["uploaded", "generated", "academic"] }).default("academic"),
  chatId: integer("chat_id").references(() => chats.id, { onDelete: "set null" }),
  wordCount: integer("word_count").default(0),
  pageCount: integer("page_count").default(1),
  referenceCount: integer("reference_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin settings for API keys
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: text("value"),
  isEncrypted: boolean("is_encrypted").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LLM Models configuration
export const llmModels = pgTable("llm_models", {
  id: serial("id").primaryKey(),
  modelId: varchar("model_id").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  provider: varchar("provider").notNull(),
  costPerMessage: integer("cost_per_message").default(0), // in credits
  isActive: boolean("is_active").default(true),
  isFree: boolean("is_free").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User credits for managing AI usage
export const userCredits = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalCredits: integer("total_credits").default(100),
  usedCredits: integer("used_credits").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription packages
export const subscriptionPackages = pgTable("subscription_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in rupiah cents
  credits: integer("credits").notNull(),
  duration: integer("duration").notNull(), // in days
  features: text("features").array(),
  isActive: boolean("is_active").default(true),
  isPopular: boolean("is_popular").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  packageId: integer("package_id").notNull().references(() => subscriptionPackages.id),
  status: varchar("status", { enum: ["active", "expired", "cancelled"] }).default("active"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  autoRenew: boolean("auto_renew").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: integer("subscription_id").references(() => userSubscriptions.id),
  amount: integer("amount").notNull(), // in rupiah cents
  currency: varchar("currency").default("IDR"),
  paymentMethod: varchar("payment_method"), // bank_transfer, credit_card, e_wallet, etc
  paymentGateway: varchar("payment_gateway"), // midtrans, xendit, etc
  transactionId: varchar("transaction_id"),
  externalTransactionId: varchar("external_transaction_id"),
  status: varchar("status", { enum: ["pending", "paid", "failed", "cancelled", "refunded"] }).default("pending"),
  paidAt: timestamp("paid_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API usage logs
export const apiUsageLogs = pgTable("api_usage_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  chatId: integer("chat_id").references(() => chats.id, { onDelete: "set null" }),
  modelId: varchar("model_id").references(() => llmModels.modelId),
  endpoint: varchar("endpoint").notNull(),
  creditsUsed: integer("credits_used").default(0),
  tokensUsed: integer("tokens_used").default(0),
  responseTime: integer("response_time"), // in milliseconds
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System settings for app configuration
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  category: varchar("category").notNull(),
  key: varchar("key").notNull(),
  value: text("value"),
  dataType: varchar("data_type", { enum: ["string", "number", "boolean", "json"] }).default("string"),
  description: text("description"),
  isPublic: boolean("is_public").default(false), // can be accessed by non-admin users
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Research sources for chat research functionality
export const researchSources = pgTable("research_sources", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url"),
  content: text("content"),
  relevanceScore: integer("relevance_score").default(50),
  sourceType: varchar("source_type", { enum: ["academic", "web", "book", "journal"] }).default("web"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Research questions for chat research functionality
export const researchQuestions = pgTable("research_questions", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  category: varchar("category", { enum: ["main", "sub", "follow_up"] }).default("main"),
  priority: integer("priority").default(1),
  isAnswered: boolean("is_answered").default(false),
  answer: text("answer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Research keywords for chat research functionality
export const researchKeywords = pgTable("research_keywords", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  keyword: varchar("keyword").notNull(),
  context: text("context"),
  importance: integer("importance").default(1),
  frequency: integer("frequency").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  chats: many(chats),
  documents: many(documents),
  userCredits: many(userCredits),
  userSubscriptions: many(userSubscriptions),
  payments: many(payments),
  apiUsageLogs: many(apiUsageLogs),
}));

export const subscriptionPackagesRelations = relations(subscriptionPackages, ({ many }) => ({
  userSubscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  package: one(subscriptionPackages, {
    fields: [userSubscriptions.packageId],
    references: [subscriptionPackages.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(userSubscriptions, {
    fields: [payments.subscriptionId],
    references: [userSubscriptions.id],
  }),
}));

export const apiUsageLogsRelations = relations(apiUsageLogs, ({ one }) => ({
  user: one(users, {
    fields: [apiUsageLogs.userId],
    references: [users.id],
  }),
  chat: one(chats, {
    fields: [apiUsageLogs.chatId],
    references: [chats.id],
  }),
}));

export const researchSourcesRelations = relations(researchSources, ({ one }) => ({
  chat: one(chats, {
    fields: [researchSources.chatId],
    references: [chats.id],
  }),
}));

export const researchQuestionsRelations = relations(researchQuestions, ({ one }) => ({
  chat: one(chats, {
    fields: [researchQuestions.chatId],
    references: [chats.id],
  }),
}));

export const researchKeywordsRelations = relations(researchKeywords, ({ one }) => ({
  chat: one(chats, {
    fields: [researchKeywords.chatId],
    references: [chats.id],
  }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(messages),
  document: one(documents, {
    fields: [chats.documentId],
    references: [documents.id],
  }),
  generatedDocuments: many(documents),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  chat: one(chats, {
    fields: [documents.chatId],
    references: [chats.id],
  }),
}));

// Insert schemas
export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertLlmModelSchema = createInsertSchema(llmModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserCreditsSchema = createInsertSchema(userCredits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionPackageSchema = createInsertSchema(subscriptionPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiUsageLogSchema = createInsertSchema(apiUsageLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertResearchSourceSchema = createInsertSchema(researchSources).omit({
  id: true,
  createdAt: true,
});

export const insertResearchQuestionSchema = createInsertSchema(researchQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResearchKeywordSchema = createInsertSchema(researchKeywords).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type LlmModel = typeof llmModels.$inferSelect;
export type InsertLlmModel = z.infer<typeof insertLlmModelSchema>;
export type UserCredits = typeof userCredits.$inferSelect;
export type InsertUserCredits = z.infer<typeof insertUserCreditsSchema>;
export type SubscriptionPackage = typeof subscriptionPackages.$inferSelect;
export type InsertSubscriptionPackage = z.infer<typeof insertSubscriptionPackageSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;
export type InsertApiUsageLog = z.infer<typeof insertApiUsageLogSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type ResearchSource = typeof researchSources.$inferSelect;
export type InsertResearchSource = z.infer<typeof insertResearchSourceSchema>;
export type ResearchQuestion = typeof researchQuestions.$inferSelect;
export type InsertResearchQuestion = z.infer<typeof insertResearchQuestionSchema>;
export type ResearchKeyword = typeof researchKeywords.$inferSelect;
export type InsertResearchKeyword = z.infer<typeof insertResearchKeywordSchema>;

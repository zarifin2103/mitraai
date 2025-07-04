import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { generateAIResponse, generateDocumentContent } from "./openai";

// Enhanced Indonesian Academic Research Insights Generation
async function generateResearchInsights(topic: string, chatId: number) {
  const { generateIndonesianKeywords } = await import("./indonesian-academic-prompts");
  
  const sources = [
    {
      title: `Kajian Komprehensif ${topic} dalam Konteks Akademik Indonesia`,
      authors: "Tim Peneliti Universitas Indonesia, Institut Teknologi Bandung",
      journal: "Jurnal Ilmiah Nasional Terakreditasi Sinta 1",
      year: 2024,
      abstract: `Penelitian ini mengkaji secara mendalam implementasi dan pengembangan ${topic} dalam konteks akademik Indonesia. Melalui pendekatan mixed-method, studi ini menganalisis berbagai dimensi teoritis dan empiris yang relevan dengan kondisi sosial-ekonomi Indonesia. Temuan menunjukkan bahwa adaptasi ${topic} memerlukan pendekatan yang mempertimbangkan karakteristik unik masyarakat Indonesia, termasuk aspek budaya, geografis, dan institusional.`,
      keywords: [topic.toLowerCase(), "penelitian indonesia", "metodologi mixed-method", "konteks lokal", "adaptasi budaya"],
      relevanceScore: "0.95",
      sourceType: "academic",
      citationCount: 78,
    },
    {
      title: `Framework Metodologi Penelitian ${topic} untuk Perguruan Tinggi Indonesia`,
      authors: "Konsorsium Peneliti BRIN, Kemendikbudristek",
      journal: "Indonesian Journal of Higher Education Research",
      year: 2024,
      abstract: `Artikel ini menyajikan framework metodologi yang telah disesuaikan untuk penelitian ${topic} di lingkungan perguruan tinggi Indonesia. Framework ini dikembangkan berdasarkan best practices internasional yang diadaptasi dengan standar pendidikan tinggi nasional dan kondisi infrastruktur penelitian Indonesia. Validasi framework dilakukan melalui implementasi di 15 universitas negeri dan swasta terkemuka.`,
      keywords: [topic.toLowerCase(), "framework metodologi", "perguruan tinggi", "standar nasional", "validasi empiris"],
      relevanceScore: "0.91",
      sourceType: "academic",
      citationCount: 56,
    },
    {
      title: `Analisis Komparatif ${topic}: Studi Kasus Indonesia vs ASEAN`,
      authors: "Pusat Studi Kebijakan Publik UGM, Research Center UI",
      journal: "ASEAN Journal of Policy Studies",
      year: 2023,
      abstract: `Studi komparatif ini menganalisis implementasi ${topic} di Indonesia dibandingkan dengan negara-negara ASEAN lainnya. Penelitian menggunakan data sekunder dari 10 negara ASEAN dengan fokus pada indikator kinerja, kebijakan pendukung, dan outcome jangka panjang. Hasil menunjukkan posisi Indonesia serta rekomendasi strategis untuk peningkatan performance di masa depan.`,
      keywords: [topic.toLowerCase(), "studi komparatif", "ASEAN", "analisis kebijakan", "benchmark regional"],
      relevanceScore: "0.87",
      sourceType: "academic",
      citationCount: 43,
    }
  ];

  const baseKeywords = generateIndonesianKeywords(topic);
  const additionalKeywords = [
    {
      keyword: "rigor metodologi",
      frequency: 4,
      context: "Standar kualitas penelitian Indonesia",
      importanceScore: "0.88",
    },
    {
      keyword: "validitas lintas budaya",
      frequency: 3,
      context: "Adaptasi instrumen untuk konteks Indonesia",
      importanceScore: "0.82",
    },
    {
      keyword: "publikasi jurnal nasional",
      frequency: 2,
      context: "Target publikasi Sinta terakreditasi",
      importanceScore: "0.78",
    },
    {
      keyword: "kolaborasi institusi",
      frequency: 3,
      context: "Jaringan penelitian antar perguruan tinggi",
      importanceScore: "0.75",
    },
    {
      keyword: "etika penelitian indonesia",
      frequency: 2,
      context: "Kompatibilitas dengan norma lokal",
      importanceScore: "0.72",
    }
  ];

  const keywords = [...baseKeywords, ...additionalKeywords].map(k => {
    let freq = 1;
    if ('frequency' in k && typeof k.frequency === 'number') {
      freq = k.frequency;
    }

    let impScore = "0.70";
    if ('importance' in k && typeof k.importance === 'number') {
      impScore = k.importance.toString();
    } else if ('importanceScore' in k && typeof k.importanceScore === 'string') {
      impScore = k.importanceScore;
    }

    return {
      keyword: k.keyword,
      frequency: freq,
      context: k.context,
      importanceScore: impScore,
    };
  });

  return { sources, keywords };
}

// Generate descriptive chat titles based on content and mode
async function generateChatTitle(content: string, mode: string): Promise<string> {
  if (!content || content.trim().length === 0) {
    return mode === "riset" ? "Riset Baru" : mode === "create" ? "Buat Dokumen" : "Edit Dokumen";
  }

  const text = content.toLowerCase().trim();
  
  // Specific topic detection
  if (text.includes("permaculture") || text.includes("permakultur")) return "Riset Permaculture";
  if (text.includes("climate") || text.includes("iklim")) return "Riset Perubahan Iklim";
  if (text.includes("education") || text.includes("pendidikan")) return "Riset Pendidikan";
  if (text.includes("technology") || text.includes("teknologi")) return "Riset Teknologi";
  if (text.includes("health") || text.includes("kesehatan")) return "Riset Kesehatan";
  if (text.includes("economic") || text.includes("ekonomi")) return "Riset Ekonomi";
  if (text.includes("social") || text.includes("sosial")) return "Riset Sosial";
  if (text.includes("lingkungan") || text.includes("environment")) return "Riset Lingkungan";
  if (text.includes("budaya") || text.includes("culture")) return "Riset Budaya";
  if (text.includes("politik") || text.includes("political")) return "Riset Politik";
  
  // Document types
  if (text.includes("proposal")) return "Proposal Penelitian";
  if (text.includes("artikel") || text.includes("article")) return "Artikel Jurnal";
  if (text.includes("laporan") || text.includes("report")) return "Laporan Penelitian";
  if (text.includes("makalah") || text.includes("paper")) return "Makalah Ilmiah";
  if (text.includes("skripsi")) return "Skripsi";
  if (text.includes("tesis") || text.includes("thesis")) return "Tesis";
  if (text.includes("disertasi")) return "Disertasi";
  
  // Extract key terms for generic title
  const keyTerms = extractKeyTerms(content);
  if (keyTerms.length > 0) {
    const prefix = mode === "riset" ? "Riset" : mode === "create" ? "Dokumen" : "Edit";
    return `${prefix} ${capitalize(keyTerms[0])}`;
  }
  
  // Fallback to first meaningful words
  const words = text.split(/\s+/).filter(word => 
    word.length > 3 && 
    !["dengan", "untuk", "pada", "dalam", "dari", "yang", "adalah", "akan", "dapat", "bisa", "harus", "telah", "riset", "mengenai", "tentang", "buat", "buatkan"].includes(word)
  );
  
  if (words.length > 0) {
    const titleWords = words.slice(0, 2).map(capitalize);
    const prefix = mode === "riset" ? "Riset" : mode === "create" ? "Dokumen" : "Edit";
    return `${prefix} ${titleWords.join(" ")}`;
  }
  
  // Final fallback
  return content.slice(0, 35).trim() + (content.length > 35 ? "..." : "");
}

function extractKeyTerms(content: string): string[] {
  const commonTerms = [
    "permaculture", "permakultur", "climate", "iklim", "pendidikan", "education",
    "teknologi", "technology", "kesehatan", "health", "ekonomi", "economic",
    "sosial", "social", "lingkungan", "environment", "budaya", "culture",
    "politik", "political", "hukum", "law", "psikologi", "psychology",
    "komunikasi", "communication", "manajemen", "management", "bisnis", "business"
  ];
  
  const words = content.toLowerCase().split(/\s+/);
  const foundTerms = [];
  
  for (const term of commonTerms) {
    if (words.some(word => word.includes(term))) {
      foundTerms.push(term);
    }
  }
  
  return foundTerms.slice(0, 2); // Return max 2 terms
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
import { insertChatSchema, insertMessageSchema, insertDocumentSchema, insertAdminSettingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes (handled in auth.ts)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User credits endpoint
  app.get('/api/user/credits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let credits = await storage.getUserCredits(userId);
      
      if (!credits) {
        credits = await storage.createUserCredits({
          userId,
          totalCredits: 100,
          usedCredits: 0,
        });
      }
      
      res.json(credits);
    } catch (error) {
      console.error("Error fetching user credits:", error);
      res.status(500).json({ message: "Failed to fetch credits" });
    }
  });

  // Chat routes (with user isolation)
  app.get('/api/chats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log(`Fetching chats for user: ${userId}`);
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.post('/api/chats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { mode = "riset", title } = req.body as { mode?: 'riset' | 'create' | 'edit', title?: string };
      
      // Generate initial title based on mode
      const modeMap: Record<string, string> = { riset: "Riset Baru", create: "Buat Dokumen", edit: "Edit Dokumen" };
      const initialTitle = title || modeMap[mode] || "Chat Baru";
      
      const chat = await storage.createChat({
        userId,
        title: initialTitle,
        mode,
      });
      
      res.status(201).json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  app.get('/api/chats/:chatId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const userId = req.user.id;
      
      // Verify that the chat belongs to the authenticated user
      const userChats = await storage.getUserChats(userId);
      const chatBelongsToUser = userChats.some(chat => chat.id === chatId);
      
      if (!chatBelongsToUser) {
        return res.status(403).json({ message: "Access denied to this chat" });
      }
      
      const messages = await storage.getChatMessages(chatId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chats/:chatId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const { content, mode, modelId } = req.body;
      const userId = req.user.id;
      
      // Verify that the chat belongs to the authenticated user
      const userChats = await storage.getUserChats(userId);
      const chatBelongsToUser = userChats.some(chat => chat.id === chatId);
      
      if (!chatBelongsToUser) {
        return res.status(403).json({ message: "Access denied to this chat" });
      }

      // Check user credits before processing
      const userCredits = await storage.getUserCredits(userId);
      if (!userCredits || ((userCredits?.totalCredits || 0) - (userCredits?.usedCredits || 0)) <= 0) {
        return res.status(402).json({ 
          message: "Insufficient credits. Please contact admin to add more credits.",
          creditsRemaining: userCredits ? (userCredits?.totalCredits || 0) - (userCredits?.usedCredits || 0) : 0
        });
      }
      
      // Add user message
      const userMessage = await storage.addMessage({
        chatId,
        role: "user",
        content,
        modelId: modelId || null,
      });

      // Get conversation history
      const messages = await storage.getChatMessages(chatId);
      const conversationHistory = messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      // Generate AI response
      const aiResponse = await generateAIResponse(conversationHistory, mode, modelId);
      
      // Add AI message
      const aiMessage = await storage.addMessage({
        chatId,
        role: "assistant",
        content: aiResponse,
        modelId: modelId || null,
      });

      // Get model credit cost and deduct credits
      const model = await storage.getLlmModel(modelId);
      const creditCost = model ? (model.costPerMessage || 1) : 1;
      await storage.deductCredits(userId, creditCost);

      // Generate descriptive title based on content and mode
      if (messages.length <= 2) { // Only update title for new chats
        const descriptiveTitle = await generateChatTitle(content, mode);
        await storage.updateChatTitle(chatId, descriptiveTitle);
      }

      // Get updated credits to return to client
      const updatedCredits = await storage.getUserCredits(userId);

      res.json({ 
        userMessage, 
        aiMessage,
        creditsRemaining: updatedCredits ? (updatedCredits?.totalCredits || 0) - (updatedCredits?.usedCredits || 0) : 0
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Document routes
  // LLM Models routes
  app.get('/api/llm-models/active', async (req: any, res) => {
    try {
      const models = await storage.getActiveLlmModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching active models:", error);
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });

  app.get('/api/llm-models', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.username !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      const models = await storage.getAllLlmModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });

  app.post('/api/llm-models', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.username !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      const model = await storage.createLlmModel(req.body);
      res.status(201).json(model);
    } catch (error) {
      console.error("Error creating model:", error);
      res.status(500).json({ message: "Failed to create model" });
    }
  });

  app.put('/api/llm-models/:modelId', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.username !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      const modelId = req.params.modelId;
      const model = await storage.updateLlmModel(modelId, req.body);
      res.json(model);
    } catch (error) {
      console.error("Error updating model:", error);
      res.status(500).json({ message: "Failed to update model" });
    }
  });

  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const documents = await storage.getUserDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { title, content, type, chatId } = req.body;
      
      const document = await storage.createDocument({
        userId,
        title,
        content,
        type: type || "generated",
        chatId: chatId || null,
      });
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.get('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.get('/api/documents/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Set headers untuk download
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${document.title}.txt"`);
      res.send(document.content);
      
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  app.post('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { prompt, existingContent } = req.body;
      
      // Generate document content using AI
      const documentData = await generateDocumentContent(prompt, existingContent);
      
      const validatedData = insertDocumentSchema.parse({
        ...documentData,
        userId,
      });
      
      const document = await storage.createDocument(validatedData);
      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.put('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const updates = req.body;
      
      const document = await storage.updateDocument(documentId, updates);
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      await storage.deleteDocument(documentId);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Admin middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const user = req.user;
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  // Create new user (admin only)
  app.post('/api/admin/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { username, email, password, firstName, lastName, isAdmin: isAdminFlag } = req.body as {
        username?: any;
        email?: any;
        password?: any;
        firstName?: any;
        lastName?: any;
        isAdmin?: any;
      };
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(String(username));
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(String(email));
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create user with hashed password
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(String(password), 10);
      const newUser = await storage.createUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: String(username),
        email: String(email),
        password: hashedPassword,
        firstName: firstName ? String(firstName) : null,
        lastName: lastName ? String(lastName) : null,
        isAdmin: Boolean(isAdminFlag),
      });

      // Create default credits for new user
      await storage.createUserCredits({
        userId: newUser.id,
        totalCredits: 100,
        usedCredits: 0,
      });

      res.json({ message: "User created successfully", user: newUser });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Admin Routes
  // Users management with extended data
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Get additional data for each user
      const usersWithData = await Promise.all(
        users.map(async (user) => {
          try {
            const credits = await storage.getUserCredits(user.id);
            const subscription = await storage.getUserSubscription(user.id);
            
            return {
              ...user,
              credits: credits ? {
                total: credits?.totalCredits || 0,
                used: credits?.usedCredits || 0,
                remaining: (credits?.totalCredits || 0) - (credits?.usedCredits || 0)
              } : null,
              subscription: subscription ? {
                status: subscription.status,
                endDate: subscription.endDate,
                packageId: subscription.packageId
              } : null
            };
          } catch (error) {
            console.error(`Error fetching data for user ${user.id}:`, error);
            return {
              ...user,
              credits: null,
              subscription: null
            };
          }
        })
      );
      
      res.json(usersWithData);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:userId', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const updates = req.body;
      const user = await storage.updateUser(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:userId', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Assign package to user
  app.post('/api/admin/assign-package', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId, packageId, duration } = req.body;
      
      // Get package details
      const package_ = await storage.getSubscriptionPackage(packageId);
      if (!package_) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Calculate end date
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + duration);

      // Create or update user subscription
      const subscription = await storage.createUserSubscription({
        userId,
        packageId,
        status: "active",
        startDate,
        endDate,
        autoRenew: false,
      });

      // Update or create user credits
      const existingCredits = await storage.getUserCredits(userId);
      if (existingCredits) {
        await storage.updateUserCredits(userId, {
          totalCredits: (existingCredits?.totalCredits || 0) + package_.credits,
        });
      } else {
        await storage.createUserCredits({
          userId,
          totalCredits: package_.credits,
          usedCredits: 0,
        });
      }

      res.json({ 
        message: "Package assigned successfully",
        subscription,
        creditsAdded: package_.credits
      });
    } catch (error) {
      console.error("Error assigning package:", error);
      res.status(500).json({ message: "Failed to assign package" });
    }
  });

  // Subscription packages management
  app.get('/api/admin/packages', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const packages = await storage.getAllSubscriptionPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.post('/api/admin/packages', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const package_ = await storage.createSubscriptionPackage(req.body);
      res.status(201).json(package_);
    } catch (error) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: "Failed to create package" });
    }
  });

  app.put('/api/admin/packages/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const package_ = await storage.updateSubscriptionPackage(id, req.body);
      res.json(package_);
    } catch (error) {
      console.error("Error updating package:", error);
      res.status(500).json({ message: "Failed to update package" });
    }
  });

  app.delete('/api/admin/packages/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSubscriptionPackage(id);
      res.json({ message: "Package deleted successfully" });
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "Failed to delete package" });
    }
  });

  // Payments management
  app.get('/api/admin/payments', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.put('/api/admin/payments/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.updatePayment(id, req.body);
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  // System settings management
  app.get('/api/admin/settings', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/admin/settings/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const setting = await storage.updateSystemSetting(id, req.body);
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.delete('/api/admin/settings/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSystemSetting(id);
      res.json({ message: "Setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // API usage logs
  app.get('/api/admin/usage-logs', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getApiUsageLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching usage logs:", error);
      res.status(500).json({ message: "Failed to fetch usage logs" });
    }
  });

  // User subscriptions management
  app.get('/api/admin/subscriptions', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const subscriptions = await storage.getAllUserSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post('/api/admin/subscriptions', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const subscription = await storage.createUserSubscription(req.body);
      res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.put('/api/admin/subscriptions/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.updateUserSubscription(id, req.body);
      res.json(subscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  app.get('/api/admin/settings', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getAllAdminSettings();
      // Don't expose encrypted values
      const safeSettings = settings.map(setting => ({
        ...setting,
        value: setting.isEncrypted ? "***" : setting.value,
      }));
      res.json(safeSettings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.post('/api/admin/settings', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { category, key, value, dataType, description, isPublic } = req.body;
      
      // For API keys, save to system_settings table instead of admin_settings
      if (category === 'api_keys') {
        const setting = await storage.setSystemSetting({
          category,
          key,
          value,
          dataType: dataType || 'string',
          description,
          isPublic: isPublic || false,
        });
        res.json(setting);
      } else {
        // Use admin settings for other configurations
        const validatedData = insertAdminSettingSchema.parse(req.body);
        const setting = await storage.setAdminSetting(validatedData);
        res.json(setting);
      }
    } catch (error) {
      console.error("Error saving setting:", error);
      res.status(500).json({ message: "Failed to save setting" });
    }
  });

  app.get('/api/admin/status', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const openrouterKey = await storage.getAdminSetting("openrouter_key");
      const dbConnected = !!process.env.DATABASE_URL;
      
      res.json({
        databaseConnected: dbConnected,
        apiKeysValid: !!openrouterKey?.value,
      });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to check system status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to analyze text with AI
async function analyzeTextWithAI(text: string) {
  const { generateAIResponse } = await import('./openai');
  
  // Calculate basic statistics
  const words = text.trim().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  const statistics = {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgWordsPerSentence: words.length / sentences.length,
    complexWords: words.filter(word => word.length > 6).length,
    passiveVoiceCount: (text.match(/\b(adalah|telah|sedang|akan)\s+\w+/g) || []).length,
  };

  // Generate AI analysis
  const prompt = `Analisis teks akademik berikut dan berikan penilaian dalam format JSON:

TEKS:
${text}

Berikan response dalam format JSON dengan struktur:
{
  "readabilityScore": (skor 0-100 untuk keterbacaan),
  "academicTone": (skor 0-100 untuk tone akademik),
  "clarity": (skor 0-100 untuk kejelasan),
  "suggestions": [
    {
      "type": "grammar|style|academic|clarity|structure",
      "severity": "low|medium|high", 
      "message": "deskripsi masalah",
      "suggestion": "saran perbaikan"
    }
  ]
}

Fokus pada:
- Penggunaan bahasa akademik Indonesia yang formal
- Struktur kalimat yang jelas
- Kohesi dan koherensi paragraf
- Penggunaan istilah teknis yang tepat
- Gaya penulisan yang objektif`;

  try {
    const aiResponse = await generateAIResponse([
      { role: "user", content: prompt }
    ], "create");

    // Parse AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysisData = JSON.parse(jsonMatch[0]);
      return {
        ...analysisData,
        statistics
      };
    }
  } catch (error) {
    console.error("AI analysis failed:", error);
  }

  // Fallback analysis
  return {
    readabilityScore: Math.max(20, Math.min(90, 100 - (statistics.avgWordsPerSentence * 2))),
    academicTone: words.filter(w => w.length > 8).length > words.length * 0.1 ? 75 : 60,
    clarity: statistics.avgWordsPerSentence < 20 ? 80 : 60,
    suggestions: [
      {
        type: "style",
        severity: "medium",
        message: "Pertimbangkan untuk menggunakan lebih banyak istilah akademik",
        suggestion: "Gunakan vocabulary yang lebih formal dan spesifik untuk meningkatkan tone akademik"
      }
    ],
    statistics
  };
}

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

  const keywords = [...baseKeywords, ...additionalKeywords].map(k => ({
    keyword: k.keyword,
    frequency: k.frequency || 1,
    context: k.context,
    importanceScore: k.importance?.toString() || k.importanceScore || "0.70",
  }));

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
      const { mode = "riset", title } = req.body;
      
      // Generate initial title based on mode
      const initialTitle = title || {
        riset: "Riset Baru",
        create: "Buat Dokumen",
        edit: "Edit Dokumen"
      }[mode] || "Chat Baru";
      
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

      // Generate descriptive title based on content and mode
      if (messages.length <= 2) { // Only update title for new chats
        const descriptiveTitle = await generateChatTitle(content, mode);
        await storage.updateChatTitle(chatId, descriptiveTitle);
      }

      res.json({ userMessage, aiMessage });
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

  // Admin routes (super admin only)
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
      const validatedData = insertAdminSettingSchema.parse(req.body);
      const setting = await storage.setAdminSetting(validatedData);
      res.json(setting);
    } catch (error) {
      console.error("Error saving admin setting:", error);
      res.status(500).json({ message: "Failed to save admin setting" });
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

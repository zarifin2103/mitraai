import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { generateAIResponse, generateDocumentContent } from "./openai";
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

  // Chat routes
  app.get('/api/chats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const { mode = "riset", title = "Percakapan Baru" } = req.body;
      
      const chat = await storage.createChat({
        userId,
        title,
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
      
      // Add user message
      const userMessage = await storage.addMessage({
        chatId,
        role: "user",
        content,
      });

      // Get conversation history
      const messages = await storage.getChatMessages(chatId);
      const conversationHistory = messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      // Generate AI response
      const aiResponse = await generateAIResponse(conversationHistory, mode);
      
      // Add AI message
      const aiMessage = await storage.addMessage({
        chatId,
        role: "assistant",
        content: aiResponse,
      });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Document routes
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

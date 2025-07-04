import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, FileText, Copy, Check, Download, PenTool, Coins } from "lucide-react";
import WritingAssistant from "./writing-assistant";
import ModelSelector from "./model-selector";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";

interface ChatAreaProps {
  mode: "riset" | "create" | "edit";
  chatId: number | null;
  documentId: number | null;
  onDocumentUpdate: (documentId: number) => void;
}

export default function ChatArea({
  mode,
  chatId,
  documentId,
  onDocumentUpdate,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [isWritingAssistantOpen, setIsWritingAssistantOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch user credits
  const { data: credits } = useQuery({
    queryKey: ['/api/user/credits'],
    enabled: !!user,
  });

  const { 
    data: messages = [], 
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages 
  } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    queryFn: async () => {
      console.log(`🔄 Fetching messages for chat ${chatId}...`);
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(`✅ Messages fetched for chat ${chatId}:`, data?.length || 0, data);
      return data;
    },
    enabled: !!chatId,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    onError: (error) => {
      console.error("❌ Error fetching messages:", error);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, mode }: { content: string; mode: string }) => {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content,
          mode,
          modelId: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          throw new Error(errorData.message || "Insufficient credits");
        }
        throw new Error(errorData.message || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries([`/api/chats/${chatId}/messages`]);
      queryClient.invalidateQueries(["/api/chats"]);
      queryClient.invalidateQueries(['/api/user/credits']); // Refresh credits
      setInput("");
      setIsTyping(false);
      
      // Show credits remaining if provided
      if (data.creditsRemaining !== undefined) {
        toast({
          title: "Message sent successfully",
          description: `Credits remaining: ${data.creditsRemaining.toLocaleString()}`,
        });
      }
    },
    onError: (error: Error) => {
      setIsTyping(false);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1000);
        return;
      }

      // Handle insufficient credits
      if (error.message?.includes("credits")) {
        toast({
          title: "Insufficient Credits",
          description: "Please contact admin to add more credits to your account",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSendMessage = () => {
    if (!input.trim() || !chatId || sendMessageMutation.isPending) return;
    
    setIsTyping(true);
    sendMessageMutation.mutate({ 
      content: input.trim(), 
      mode 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyToClipboard = async (text: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      toast({
        title: "Pesan disalin",
        description: "Teks berhasil disalin ke clipboard",
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast({
        title: "Gagal menyalin",
        description: "Tidak dapat menyalin teks ke clipboard",
        variant: "destructive",
      });
    }
  };

  const generateDocxFromChat = async () => {
    try {
      // Ambil semua pesan AI dari chat
      const aiMessages = messages.filter(msg => msg.role === "assistant");
      
      if (aiMessages.length === 0) {
        toast({
          title: "Tidak ada konten",
          description: "Belum ada respons AI untuk diekspor",
          variant: "destructive",
        });
        return;
      }

      // Buat dokumen DOCX
      const children = [];
      
      // Tambah judul dokumen
      children.push(
        new Paragraph({
          text: `Dokumen Akademik - ${new Date().toLocaleDateString('id-ID')}`,
          heading: HeadingLevel.TITLE,
        })
      );

      // Tambah konten dari setiap pesan AI
      aiMessages.forEach((msg, index) => {
        // Pisahkan konten berdasarkan paragraf
        const paragraphs = msg.content.split('\n\n');
        
        paragraphs.forEach((paragraph) => {
          if (paragraph.trim()) {
            // Handle markdown formatting sederhana
            const text = paragraph
              .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
              .replace(/\*(.*?)\*/g, '$1') // Italic
              .replace(/^#+\s(.+)/gm, '$1') // Headers
              .replace(/^[\-\*]\s(.+)/gm, '• $1') // Bullet points
              .replace(/^\d+\.\s(.+)/gm, '$1'); // Numbered lists

            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: text,
                    size: 24, // 12pt font
                  }),
                ],
                spacing: {
                  after: 200,
                },
              })
            );
          }
        });
      });

      // Buat dokumen
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: children,
          },
        ],
      });

      // Generate dan download
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `dokumen-akademik-${Date.now()}.docx`);

      // Simpan ke database
      const docData = {
        title: `Dokumen Akademik - ${new Date().toLocaleDateString('id-ID')}`,
        content: aiMessages.map(msg => msg.content).join('\n\n'),
        type: "generated",
        chatId: chatId,
      };

      const response = await apiRequest("POST", "/api/documents", docData);
      
      toast({
        title: "Dokumen berhasil diekspor",
        description: "File DOCX telah diunduh dan disimpan ke database",
      });

      // Update callback jika ada
      if (onDocumentUpdate) {
        const savedDoc = await response.json();
        onDocumentUpdate(savedDoc.id);
      }

    } catch (error) {
      console.error("Error generating DOCX:", error);
      toast({
        title: "Gagal mengekspor dokumen",
        description: "Terjadi kesalahan saat membuat file DOCX",
        variant: "destructive",
      });
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selamat datang di Mitra AI
          </h3>
          <p className="text-gray-500 mb-4">
            Pilih atau buat percakapan baru untuk memulai
          </p>
          <p className="text-sm text-gray-400">
            Mode: {mode === "riset" ? "Riset" : mode === "create" ? "Buat Dokumen" : "Edit Dokumen"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Mode {mode === "riset" ? "Riset" : mode === "create" ? "Buat Dokumen Akademik" : "Edit Dokumen"}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === "riset" && "Dapatkan bantuan penelitian dengan AI"}
              {mode === "create" && "Buat dokumen akademik berkualitas tinggi"}
              {mode === "edit" && "Edit dan perbaiki dokumen yang ada"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* User Credits Display */}
            {credits && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <Coins className="h-4 w-4 text-blue-600" />
                <div className="text-sm">
                  <span className="font-medium text-blue-800">
                    {(credits.totalCredits - credits.usedCredits).toLocaleString()}
                  </span>
                  <span className="text-blue-600 mx-1">/</span>
                  <span className="text-blue-600">
                    {credits.totalCredits.toLocaleString()}
                  </span>
                </div>
                <div className="w-16 h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      ((credits.totalCredits - credits.usedCredits) / credits.totalCredits) * 100 > 50 ? 'bg-blue-600' : 
                      ((credits.totalCredits - credits.usedCredits) / credits.totalCredits) * 100 > 20 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.max(((credits.totalCredits - credits.usedCredits) / credits.totalCredits) * 100, 0)}%` 
                    }}
                  />
                </div>
              </div>
            )}
            
            {documentId && (
              <Button variant="outline" size="sm" onClick={() => onDocumentUpdate(documentId)}>
                <FileText className="h-4 w-4 mr-2" />
                Pratinjau Dokumen
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">


        {messages.length === 0 && !isLoadingMessages && (
          <div className="space-y-6">
            {/* Model Selector */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Pilih Model AI</h3>
              <ModelSelector 
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={sendMessageMutation.isPending}
              />
            </div>
            
            {/* Welcome Message */}
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-white border border-border rounded-lg p-4 max-w-2xl shadow-sm">
                <div className="text-foreground">
                  {mode === "riset" && 
                    "Selamat datang di Mode Riset! Saya siap membantu Anda dalam penelitian dan mencari referensi akademik. Bagaimana saya dapat membantu Anda hari ini?"
                  }
                  {mode === "create" && 
                    "Selamat datang di Mode Pembuatan Dokumen! Saya akan membantu Anda membuat dokumen akademik berkualitas tinggi. Ceritakan tentang dokumen yang ingin Anda buat."
                  }
                  {mode === "edit" && 
                    "Selamat datang di Mode Edit Dokumen! Saya akan membantu Anda mengedit dan memperbaiki dokumen yang ada. Upload atau pilih dokumen yang ingin diedit."
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoadingMessages ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-500">Loading messages...</span>
          </div>
        ) : messagesError ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="text-red-500 mb-2">Failed to load messages</div>
            <Button variant="outline" size="sm" onClick={() => refetchMessages()}>
              Try Again
            </Button>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.role === "user" ? "justify-end" : ""
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div
                className={`rounded-lg p-4 max-w-2xl relative group ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-white border border-border text-foreground shadow-sm"
                }`}
              >
                {msg.role === "assistant" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-accent"
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                  >
                    {copiedMessageId === msg.id ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                )}
                
                <div className="text-sm leading-relaxed">
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 text-primary" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-semibold mb-2 text-primary" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1 text-primary" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="text-foreground" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 text-foreground" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-primary" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-muted-foreground" {...props} />,
                          code: ({node, ...props}) => <code className="bg-accent px-1 py-0.5 rounded text-sm font-mono text-accent-foreground" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  )}
                </div>
                <div className="text-xs opacity-60 mt-2">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        {/* Tombol ekspor dan writing assistant untuk mode create */}
        {mode === "create" && messages.some(msg => msg.role === "assistant") && (
          <div className="mb-4 flex justify-center gap-3">
            <Button
              onClick={generateDocxFromChat}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Ekspor ke DOCX
            </Button>
            <Button
              onClick={() => setIsWritingAssistantOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <PenTool className="h-4 w-4" />
              Writing Assistant
            </Button>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              mode === "riset" 
                ? "Ketik untuk mengirim pesan..." 
                : mode === "create"
                ? "Jelaskan dokumen yang ingin dibuat..."
                : "Jelaskan bagian yang ingin diedit..."
            }
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            disabled={!chatId || sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || !chatId || sendMessageMutation.isPending}
            size="lg"
            className="px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {sendMessageMutation.isPending && (
          <div className="text-xs text-gray-500 mt-2">
            Mengirim pesan...
          </div>
        )}
        
        <div className="text-xs text-gray-400 mt-2">
          Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
        </div>
      </div>

      {/* Writing Assistant Modal */}
      <WritingAssistant 
        isOpen={isWritingAssistantOpen}
        onClose={() => setIsWritingAssistantOpen(false)}
      />
    </div>
  );
}
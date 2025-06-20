import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Bot, Send, User } from "lucide-react";
import type { Message } from "@shared/schema";

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
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch messages for active chat
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/chats", chatId, "messages"],
    enabled: !!chatId,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!chatId) throw new Error("No active chat");
      
      const response = await apiRequest("POST", `/api/chats/${chatId}/messages`, {
        content,
        mode,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId, "messages"] });
      setMessage("");
      setIsTyping(false);
    },
    onError: (error: Error) => {
      setIsTyping(false);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !chatId) return;
    
    setIsTyping(true);
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, index) => {
        // Handle headers
        if (line.startsWith('# ')) {
          return <h3 key={index} className="text-lg font-bold mt-4 mb-2">{line.slice(2)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h4 key={index} className="text-md font-semibold mt-3 mb-2">{line.slice(3)}</h4>;
        }
        
        // Handle bullet points
        if (line.startsWith('- ')) {
          return <li key={index} className="ml-4">{line.slice(2)}</li>;
        }
        
        // Regular paragraphs
        if (line.trim()) {
          return <p key={index} className="mb-2">{line}</p>;
        }
        
        return <br key={index} />;
      });
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selamat datang di Mitra AI
          </h3>
          <p className="text-gray-600 max-w-md">
            Pilih percakapan yang sudah ada atau buat percakapan baru untuk memulai.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg p-4 max-w-2xl">
                  <div className="text-gray-800">
                    {mode === "riset" && 
                      "Selamat datang di Mode Riset! Saya siap membantu Anda dalam penelitian dan mencari referensi akademik. Bagaimana saya dapat membantu Anda hari ini?"
                    }
                    {mode === "create" && 
                      "Selamat datang di Mode Pembuatan Dokumen! Saya akan membantu Anda membuat dokumen akademik berkualitas tinggi. Ceritakan tentang dokumen yang ingin Anda buat."
                    }
                    {mode === "edit" && 
                      "Selamat datang di Mode Edit Dokumen! Saya akan membantu Anda memperbaiki dan meningkatkan kualitas dokumen yang sudah ada. Pilih dokumen yang ingin diedit atau upload dokumen baru."
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
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
                  className={`rounded-lg p-4 max-w-2xl ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    {formatMessage(msg.content)}
                  </div>
                </div>
                
                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
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
          </>
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <Textarea
              placeholder="Ketik pesan Anda di sini..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="resize-none max-h-32"
              rows={1}
              disabled={sendMessageMutation.isPending}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Tekan Enter untuk mengirim</span>
          <span>{message.length}/4000 karakter</span>
        </div>
      </div>
    </div>
  );
}

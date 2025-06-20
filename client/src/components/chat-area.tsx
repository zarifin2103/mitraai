import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    data: messages = [], 
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages 
  } = useQuery<Message[]>({
    queryKey: ["/api/chats", chatId, "messages"],
    enabled: !!chatId,
    staleTime: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, mode }: { content: string; mode: string }) => {
      const response = await apiRequest("POST", `/api/chats/${chatId}/messages`, {
        content,
        mode,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/chats", chatId, "messages"]);
      queryClient.invalidateQueries(["/api/chats"]);
      setInput("");
      setIsTyping(false);
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
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!input.trim() || !chatId || sendMessageMutation.isLoading) return;
    
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
          {documentId && (
            <Button variant="outline" size="sm" onClick={() => onDocumentUpdate(documentId)}>
              <FileText className="h-4 w-4 mr-2" />
              Pratinjau Dokumen
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoadingMessages && (
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
                  "Selamat datang di Mode Edit Dokumen! Saya akan membantu Anda mengedit dan memperbaiki dokumen yang ada. Upload atau pilih dokumen yang ingin diedit."
                }
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
                className={`rounded-lg p-4 max-w-2xl ${
                  msg.role === "user"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content || "No content available"}
                </div>
                <div className="text-xs opacity-60 mt-2">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-gray-600" />
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
            disabled={!chatId || sendMessageMutation.isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || !chatId || sendMessageMutation.isLoading}
            size="lg"
            className="px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {sendMessageMutation.isLoading && (
          <div className="text-xs text-gray-500 mt-2">
            Mengirim pesan...
          </div>
        )}
        
        <div className="text-xs text-gray-400 mt-2">
          Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
        </div>
      </div>
    </div>
  );
}
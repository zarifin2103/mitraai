import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Bot, Search, FileText, Edit3, Plus, Beer } from "lucide-react";
import type { Chat } from "@shared/schema";

interface ChatSidebarProps {
  activeMode: "riset" | "create" | "edit";
  onModeChange: (mode: "riset" | "create" | "edit") => void;
  activeChatId: number | null;
  onChatSelect: (chatId: number) => void;
}

export default function ChatSidebar({
  activeMode,
  onModeChange,
  activeChatId,
  onChatSelect,
}: ChatSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user chats
  const { data: chats = [], isLoading } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
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
      toast({
        title: "Error",
        description: "Failed to load chats",
        variant: "destructive",
      });
    },
  });

  // Create new chat mutation
  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/chats", {
        title: "Percakapan Baru",
        mode: activeMode,
      });
      return response.json();
    },
    onSuccess: (newChat: Chat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      onChatSelect(newChat.id);
      toast({
        title: "Success",
        description: "Percakapan baru dibuat",
      });
    },
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
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    },
  });

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "riset":
        return <Search className="h-4 w-4 mr-2" />;
      case "create":
        return <FileText className="h-4 w-4 mr-2" />;
      case "edit":
        return <Edit3 className="h-4 w-4 mr-2" />;
      default:
        return <Search className="h-4 w-4 mr-2" />;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "riset":
        return "Mode Riset";
      case "create":
        return "Buat Dokumen Akademik";
      case "edit":
        return "Edit Dokumen";
      default:
        return "Mode Riset";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return "Baru saja";
    } else if (diffHours < 24) {
      return `${diffHours} jam yang lalu`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} hari yang lalu`;
    }
  };

  return (
    <div className="w-full bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Mitra AI</h1>
          </div>
        </div>
        
        {/* Mode Selector */}
        <div className="space-y-2">
          <Button
            variant={activeMode === "riset" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onModeChange("riset")}
          >
            <Search className="h-4 w-4 mr-2" />
            Mode Riset
          </Button>
          <Button
            variant={activeMode === "create" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onModeChange("create")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Buat Dokumen Akademik
          </Button>
          <Button
            variant={activeMode === "edit" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onModeChange("edit")}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Dokumen
          </Button>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <Card
                key={chat.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                  activeChatId === chat.id
                    ? "border-l-4 border-l-primary bg-blue-50"
                    : ""
                }`}
                onClick={() => onChatSelect(chat.id)}
              >
                <div className="flex items-start space-x-2">
                  {getModeIcon(chat.mode)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {chat.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {chat.updatedAt && formatTime(chat.updatedAt)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {chats.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada percakapan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          className="w-full"
          onClick={() => createChatMutation.mutate()}
          disabled={createChatMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-2" />
          {createChatMutation.isPending ? "Membuat..." : "Percakapan Baru"}
        </Button>
      </div>
    </div>
  );
}

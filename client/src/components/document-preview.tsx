import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Download, EyeOff, FileText } from "lucide-react";
import type { Document } from "@shared/schema";

interface DocumentPreviewProps {
  documentId: number | null;
  onClose: () => void;
}

export default function DocumentPreview({
  documentId,
  onClose,
}: DocumentPreviewProps) {
  const [title, setTitle] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch document data
  const { data: document, isLoading } = useQuery<Document>({
    queryKey: ["/api/documents", documentId],
    enabled: !!documentId,
    onSuccess: (data) => {
      setTitle(data.title);
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
    },
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async (updates: Partial<Document>) => {
      if (!documentId) throw new Error("No document ID");
      
      const response = await apiRequest("PUT", `/api/documents/${documentId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", documentId] });
      toast({
        title: "Success",
        description: "Document updated successfully",
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
        description: "Failed to update document",
        variant: "destructive",
      });
    },
  });

  const handleTitleBlur = () => {
    if (title !== document?.title && title.trim()) {
      updateDocumentMutation.mutate({ title });
    }
  };

  const handleExport = () => {
    // Simple export implementation - in production, this would generate actual DOCX
    if (!document) return;
    
    const content = `${document.title}\n\n${document.content}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${document.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Document exported successfully",
    });
  };

  const formatContent = (content: string) => {
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        // Handle headers
        if (paragraph.startsWith('# ')) {
          return (
            <h3 key={index} className="text-lg font-bold text-gray-900 mb-3 mt-6">
              {paragraph.slice(2)}
            </h3>
          );
        }
        if (paragraph.startsWith('## ')) {
          return (
            <h4 key={index} className="text-md font-semibold text-gray-900 mb-2 mt-4">
              {paragraph.slice(3)}
            </h4>
          );
        }
        
        // Regular paragraphs
        return (
          <p key={index} className="text-gray-700 text-sm leading-relaxed mb-4">
            {paragraph}
          </p>
        );
      });
  };

  if (!documentId) {
    return (
      <div className="w-full bg-white flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Pratinjau Dokumen</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada dokumen dipilih
            </h4>
            <p className="text-gray-600 text-sm">
              Pilih atau buat dokumen untuk melihat pratinjau
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Pratinjau Dokumen</h3>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={onClose} title="Sembunyikan Panel">
              <EyeOff className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport} title="Export ke DOCX">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ) : document ? (
          <>
            {/* Document Title */}
            <div className="mb-6">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="text-lg font-semibold border-none p-0 focus:ring-0"
                placeholder="Judul Dokumen"
              />
            </div>

            {/* Document Content */}
            <div className="prose prose-sm max-w-none font-serif">
              {document.content ? formatContent(document.content) : (
                <p className="text-gray-500 italic">Belum ada konten dokumen</p>
              )}
            </div>

            {/* Document Stats */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Kata:</span>
                  <span className="ml-1">{document.wordCount || 0}</span>
                </div>
                <div>
                  <span className="font-medium">Halaman:</span>
                  <span className="ml-1">{document.pageCount || 1}</span>
                </div>
                <div>
                  <span className="font-medium">Referensi:</span>
                  <span className="ml-1">{document.referenceCount || 0}</span>
                </div>
                <div>
                  <span className="font-medium">Disimpan:</span>
                  <span className="ml-1">
                    {document.updatedAt 
                      ? new Date(document.updatedAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Belum disimpan"
                    }
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Dokumen tidak ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { FileText, X } from "lucide-react";
import type { Document } from "@shared/schema";

interface DocumentModalProps {
  open: boolean;
  onClose: () => void;
  onSelectDocument: (documentId: number) => void;
}

export default function DocumentModal({
  open,
  onClose,
  onSelectDocument,
}: DocumentModalProps) {
  const { toast } = useToast();

  // Fetch user documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    enabled: open,
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
        description: "Failed to load documents",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return "Baru saja";
    } else if (diffHours < 24) {
      return `${diffHours} jam yang lalu`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Dimodifikasi ${diffDays} hari yang lalu`;
    }
  };

  const handleSelectDocument = (documentId: number) => {
    onSelectDocument(documentId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Pilih Dokumen untuk Diedit
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="ml-4">
                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length > 0 ? (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelectDocument(doc.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {doc.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {doc.excerpt || "Tidak ada ringkasan tersedia"}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>
                            {doc.updatedAt ? formatDate(doc.updatedAt) : "Belum disimpan"}
                          </span>
                          <span>{doc.wordCount || 0} kata</span>
                          <span>{doc.type || "Dokumen Akademik"}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada dokumen
              </h3>
              <p className="text-gray-600">
                Buat dokumen baru terlebih dahulu dengan mode "Buat Dokumen Akademik"
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

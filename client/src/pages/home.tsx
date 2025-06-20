import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import ChatSidebar from "@/components/chat-sidebar";
import ChatArea from "@/components/chat-area";
import DocumentPreview from "@/components/document-preview";
import AdminModal from "@/components/admin-modal";
import DocumentModal from "@/components/document-modal";
import { Button } from "@/components/ui/button";
import { Settings, Menu, EyeOff } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeMode, setActiveMode] = useState<"riset" | "create" | "edit">("riset");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<number | null>(null);

  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading]);

  const handleModeChange = (mode: "riset" | "create" | "edit") => {
    setActiveMode(mode);
    if (mode === "edit") {
      setDocumentModalOpen(true);
    }
  };

  const getModeTitle = () => {
    switch (activeMode) {
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

  const getModeDescription = () => {
    switch (activeMode) {
      case "riset":
        return "Dapatkan bantuan penelitian dengan AI";
      case "create":
        return "Buat dokumen akademik dengan bantuan AI";
      case "edit":
        return "Edit dan perbaiki dokumen yang sudah ada";
      default:
        return "Dapatkan bantuan penelitian dengan AI";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
        <ChatSidebar
          activeMode={activeMode}
          onModeChange={handleModeChange}
          activeChatId={activeChatId}
          onChatSelect={setActiveChatId}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getModeTitle()}
                </h2>
                <p className="text-sm text-gray-500">
                  {getModeDescription()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <div className="flex items-center space-x-2 text-gray-700">
                {user?.profileImageUrl && (
                  <img
                    src={user.profileImageUrl}
                    alt="User Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <span className="font-medium">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || "User"}
                </span>
              </div>
              
              {/* Admin Settings (Super Admin Only) */}
              {user?.isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminModalOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              
              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await fetch("/api/logout", { method: "POST" });
                    window.location.reload();
                  } catch (error) {
                    console.error("Logout error:", error);
                    window.location.reload();
                  }
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Chat + Preview Content */}
        <div className="flex-1 flex">
          {/* Chat Area */}
          <div className="flex-1">
            <ChatArea
              mode={activeMode}
              chatId={activeChatId}
              documentId={activeDocumentId}
              onDocumentUpdate={(docId) => setActiveDocumentId(docId)}
            />
          </div>

          {/* Document Preview Panel */}
          {previewOpen && (
            <div className="w-96 border-l border-gray-200">
              <DocumentPreview
                documentId={activeDocumentId}
                onClose={() => setPreviewOpen(false)}
              />
            </div>
          )}
          
          {/* Toggle Preview Button */}
          {!previewOpen && (
            <div className="fixed right-4 top-1/2 transform -translate-y-1/2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="bg-white"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AdminModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
      
      <DocumentModal
        open={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        onSelectDocument={(docId) => {
          setActiveDocumentId(docId);
          setDocumentModalOpen(false);
        }}
      />
    </div>
  );
}

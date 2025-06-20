import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
}

interface AdminSetting {
  key: string;
  value: string;
  isEncrypted: boolean;
}

interface SystemStatus {
  databaseConnected: boolean;
  apiKeysValid: boolean;
}

export default function AdminModal({ open, onClose }: AdminModalProps) {
  const [showKeys, setShowKeys] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [neonDbUrl, setNeonDbUrl] = useState("");
  const [defaultModel, setDefaultModel] = useState("gpt-4o");
  const [maxTokens, setMaxTokens] = useState("4000");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin settings
  const { data: settings = [] } = useQuery<AdminSetting[]>({
    queryKey: ["/api/admin/settings"],
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
    },
  });

  // Fetch system status
  const { data: systemStatus } = useQuery<SystemStatus>({
    queryKey: ["/api/admin/status"],
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
    },
  });

  // Save settings mutation
  const saveSettingMutation = useMutation({
    mutationFn: async (setting: { key: string; value: string; isEncrypted: boolean }) => {
      const response = await apiRequest("POST", "/api/admin/settings", setting);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
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
        description: "Failed to save setting",
        variant: "destructive",
      });
    },
  });

  // Load settings when modal opens
  useEffect(() => {
    if (settings.length > 0) {
      const openRouterSetting = settings.find(s => s.key === "openrouter_key");
      const neonDbSetting = settings.find(s => s.key === "neon_db_url");
      const modelSetting = settings.find(s => s.key === "default_model");
      const tokensSetting = settings.find(s => s.key === "max_tokens");

      if (openRouterSetting && !openRouterSetting.isEncrypted) {
        setOpenRouterKey(openRouterSetting.value);
      }
      if (neonDbSetting && !neonDbSetting.isEncrypted) {
        setNeonDbUrl(neonDbSetting.value);
      }
      if (modelSetting) {
        setDefaultModel(modelSetting.value);
      }
      if (tokensSetting) {
        setMaxTokens(tokensSetting.value);
      }
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      // Save all settings
      if (openRouterKey.trim()) {
        await saveSettingMutation.mutateAsync({
          key: "openrouter_key",
          value: openRouterKey.trim(),
          isEncrypted: true,
        });
      }

      if (neonDbUrl.trim()) {
        await saveSettingMutation.mutateAsync({
          key: "neon_db_url",
          value: neonDbUrl.trim(),
          isEncrypted: true,
        });
      }

      await saveSettingMutation.mutateAsync({
        key: "default_model",
        value: defaultModel,
        isEncrypted: false,
      });

      await saveSettingMutation.mutateAsync({
        key: "max_tokens",
        value: maxTokens,
        isEncrypted: false,
      });

      toast({
        title: "Success",
        description: "Pengaturan berhasil disimpan",
      });
      
      onClose();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pengaturan Admin</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* API Keys Section */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Konfigurasi API Keys</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="openrouter-key" className="text-sm font-medium text-gray-700 mb-2 block">
                  OpenRouter API Key
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="openrouter-key"
                    type={showKeys ? "text" : "password"}
                    placeholder="sk-or-..."
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKeys(!showKeys)}
                  >
                    {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="neon-db-url" className="text-sm font-medium text-gray-700 mb-2 block">
                  Neon DB Connection String
                </Label>
                <Input
                  id="neon-db-url"
                  type={showKeys ? "text" : "password"}
                  placeholder="postgresql://..."
                  value={neonDbUrl}
                  onChange={(e) => setNeonDbUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Model Configuration */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Model Configuration</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="default-model" className="text-sm font-medium text-gray-700 mb-2 block">
                  Default AI Model
                </Label>
                <select
                  id="default-model"
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="max-tokens" className="text-sm font-medium text-gray-700 mb-2 block">
                  Max Tokens per Request
                </Label>
                <Input
                  id="max-tokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* System Status */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Status Sistem</h4>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    {systemStatus?.databaseConnected ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      systemStatus?.databaseConnected ? "text-green-800" : "text-red-800"
                    }`}>
                      Database Connected
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    {systemStatus?.apiKeysValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      systemStatus?.apiKeysValid ? "text-green-800" : "text-red-800"
                    }`}>
                      API Keys Valid
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={saveSettingMutation.isPending}
          >
            {saveSettingMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

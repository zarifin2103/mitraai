import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, CreditCard, Package, Settings, BarChart3, Key, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  createdAt: string;
}

interface SubscriptionPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  credits: number;
  duration: number;
  features: string[];
  isActive: boolean;
  isPopular: boolean;
}

interface Payment {
  id: number;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface SystemSetting {
  id: number;
  category: string;
  key: string;
  value: string;
  dataType: string;
  description: string;
  isPublic: boolean;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch data
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: packages = [], isLoading: packagesLoading } = useQuery<SubscriptionPackage[]>({
    queryKey: ['/api/admin/packages'],
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/admin/payments'],
  });

  const { data: settings = [], isLoading: settingsLoading } = useQuery<SystemSetting[]>({
    queryKey: ['/api/admin/settings'],
  });

  // Stats calculations
  const totalUsers = users.length;
  const activeUsers = users.filter(u => !u.isAdmin).length;
  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Badge variant="secondary">Administrator</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {activeUsers} active users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatRupiah(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  From {payments.filter(p => p.status === 'paid').length} payments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Packages</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{packages.length}</div>
                <p className="text-xs text-muted-foreground">
                  {packages.filter(p => p.isActive).length} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Settings</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{settings.length}</div>
                <p className="text-xs text-muted-foreground">
                  System configurations
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersTab users={users} isLoading={usersLoading} />
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <PackagesTab packages={packages} isLoading={packagesLoading} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentsTab payments={payments} isLoading={paymentsLoading} />
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <ApiKeysTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SettingsTab settings={settings} isLoading={settingsLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab({ users, isLoading }: { users: User[], isLoading: boolean }) {
  if (isLoading) return <div>Loading users...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">{user.username}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PackagesTab({ packages, isLoading }: { packages: SubscriptionPackage[], isLoading: boolean }) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  if (isLoading) return <div>Loading packages...</div>;

  const handleCreatePackage = async (formData: FormData) => {
    try {
      const features = formData.get('features')?.toString().split('\n').filter(f => f.trim()) || [];
      
      await apiRequest('/api/admin/packages', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          price: parseInt(formData.get('price')?.toString() || '0'),
          credits: parseInt(formData.get('credits')?.toString() || '0'),
          duration: parseInt(formData.get('duration')?.toString() || '30'),
          features,
          isActive: formData.get('isActive') === 'true',
          isPopular: formData.get('isPopular') === 'true',
        }),
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Package created successfully" });
    } catch (error) {
      toast({ title: "Failed to create package", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Subscription Packages</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Package</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Package</DialogTitle>
            </DialogHeader>
            <form action={handleCreatePackage} className="space-y-4">
              <div>
                <Label htmlFor="name">Package Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (Rupiah cents)</Label>
                  <Input id="price" name="price" type="number" required />
                </div>
                <div>
                  <Label htmlFor="credits">Credits</Label>
                  <Input id="credits" name="credits" type="number" required />
                </div>
              </div>
              <div>
                <Label htmlFor="duration">Duration (days)</Label>
                <Input id="duration" name="duration" type="number" defaultValue="30" />
              </div>
              <div>
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea id="features" name="features" placeholder="Feature 1&#10;Feature 2&#10;Feature 3" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isActive" name="isActive" defaultChecked />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isPopular" name="isPopular" />
                <Label htmlFor="isPopular">Popular</Label>
              </div>
              <Button type="submit" className="w-full">Create Package</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={pkg.isPopular ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <div className="flex gap-1">
                  {pkg.isPopular && <Badge variant="default">Popular</Badge>}
                  {!pkg.isActive && <Badge variant="secondary">Inactive</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>
              <div className="space-y-1 text-sm">
                <p><strong>Price:</strong> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(pkg.price / 100)}</p>
                <p><strong>Credits:</strong> {pkg.credits.toLocaleString()}</p>
                <p><strong>Duration:</strong> {pkg.duration} days</p>
              </div>
              {pkg.features && pkg.features.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Features:</p>
                  <ul className="text-xs space-y-1">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <span className="text-green-500">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" size="sm">
                Edit Package
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PaymentsTab({ payments, isLoading }: { payments: Payment[], isLoading: boolean }) {
  if (isLoading) return <div>Loading payments...</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">Payment #{payment.id}</h3>
                <p className="text-sm text-muted-foreground">User: {payment.userId}</p>
                <p className="text-sm text-muted-foreground">Method: {payment.paymentMethod}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(payment.amount / 100)}
                </p>
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ApiKeysTab() {
  const { toast } = useToast();
  const [openRouterKey, setOpenRouterKey] = useState("");

  const handleSaveApiKey = async () => {
    try {
      await apiRequest('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          category: 'api_keys',
          key: 'openrouter_api_key',
          value: openRouterKey,
          dataType: 'string',
          description: 'OpenRouter API Key for AI models',
          isPublic: false,
        }),
      });
      
      toast({ title: "API key saved successfully" });
    } catch (error) {
      toast({ title: "Failed to save API key", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="openrouter-key"
              type="password"
              placeholder="Enter OpenRouter API key"
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
            />
            <Button onClick={handleSaveApiKey}>Save</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This key will be used for AI model requests
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsTab({ settings, isLoading }: { settings: SystemSetting[], isLoading: boolean }) {
  if (isLoading) return <div>Loading settings...</div>;

  const settingsByCategory = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  return (
    <div className="space-y-6">
      {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">{category.replace('_', ' ')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorySettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{setting.key}</h4>
                    {setting.description && (
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {setting.dataType}
                    </code>
                    {setting.isPublic && <Badge variant="outline">Public</Badge>}
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
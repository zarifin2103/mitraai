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
import { Checkbox } from "@/components/ui/checkbox";
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

function ModelsTab() {
  const { toast } = useToast();
  const { data: models = [], isLoading, refetch } = useQuery<LlmModel[]>({
    queryKey: ['/api/admin/models'],
  });

  const updateModelMutation = useMutation({
    mutationFn: async ({ modelId, creditCost, isActive }: { modelId: string, creditCost: number, isActive: boolean }) => {
      return apiRequest(`/api/admin/models/${modelId}`, {
        method: 'PATCH',
        body: JSON.stringify({ creditCost, isActive }),
      });
    },
    onSuccess: () => {
      toast({ title: "Model updated successfully" });
      refetch();
    },
    onError: () => {
      toast({ title: "Failed to update model", variant: "destructive" });
    },
  });

  const handleUpdateModel = (modelId: string, creditCost: number, isActive: boolean) => {
    updateModelMutation.mutate({ modelId, creditCost, isActive });
  };

  if (isLoading) return <div>Loading models...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Model Management</CardTitle>
        <CardDescription>
          Configure credit costs and availability for each AI model
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {models.map((model) => (
            <div key={model.modelId} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">{model.name}</h3>
                <p className="text-sm text-gray-500">{model.modelId}</p>
                <p className="text-xs text-gray-400">{model.provider}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Credits:</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    defaultValue={model.creditCost}
                    className="w-20"
                    onBlur={(e) => {
                      const creditCost = parseInt(e.target.value) || 1;
                      if (creditCost !== model.creditCost) {
                        handleUpdateModel(model.modelId, creditCost, model.isActive);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Active:</label>
                  <Switch
                    checked={model.isActive}
                    onCheckedChange={(isActive) => {
                      handleUpdateModel(model.modelId, model.creditCost, isActive);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
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
        <TabsList className="grid w-full grid-cols-6 h-9">
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
            AI Models
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-xl font-bold">{totalUsers}</div>
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
                <div className="text-xl font-bold">{formatRupiah(totalRevenue)}</div>
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
                <div className="text-xl font-bold">{packages.length}</div>
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
                <div className="text-xl font-bold">{settings.length}</div>
                <p className="text-xs text-muted-foreground">
                  System configurations
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-3">
          <UsersTab />
        </TabsContent>

        <TabsContent value="packages" className="space-y-3">
          <PackagesTab packages={packages} isLoading={packagesLoading} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-3">
          <PaymentsTab payments={payments} isLoading={paymentsLoading} />
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-3">
          <ModelsTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-3">
          <SettingsTab settings={settings} isLoading={settingsLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: packages = [] } = useQuery<SubscriptionPackage[]>({
    queryKey: ['/api/admin/packages'],
  });

  if (usersLoading) return <div>Loading users...</div>;

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleAssignPackage = (user: User) => {
    setAssigningUser(user);
    setIsAssignDialogOpen(true);
  };

  const handleAssignUserPackage = async (formData: FormData) => {
    if (!assigningUser) return;

    try {
      const packageId = formData.get('packageId')?.toString();
      const duration = parseInt(formData.get('duration')?.toString() || '30');
      
      await apiRequest('/api/admin/assign-package', {
        method: 'POST',
        body: JSON.stringify({
          userId: assigningUser.id,
          packageId: parseInt(packageId || '0'),
          duration
        }),
      });

      toast({ title: "Package assigned successfully" });
      setIsAssignDialogOpen(false);
      setAssigningUser(null);
      refetchUsers();
    } catch (error) {
      toast({ title: "Failed to assign package", variant: "destructive" });
    }
  };

  const handleCreateUser = async (formData: FormData) => {
    try {
      const userData = {
        username: formData.get('username')?.toString(),
        email: formData.get('email')?.toString(),
        password: formData.get('password')?.toString(),
        firstName: formData.get('firstName')?.toString(),
        lastName: formData.get('lastName')?.toString(),
        isAdmin: formData.get('isAdmin') === 'on',
      };

      await apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      toast({ title: "User created successfully" });
      setIsCreateDialogOpen(false);
      refetchUsers();
    } catch (error) {
      toast({ title: "Failed to create user", variant: "destructive" });
    }
  };

  const handleSaveUser = async (formData: FormData) => {
    if (!editingUser) return;

    try {
      const updates = {
        username: formData.get('username')?.toString(),
        email: formData.get('email')?.toString(),
        firstName: formData.get('firstName')?.toString(),
        lastName: formData.get('lastName')?.toString(),
        isAdmin: formData.get('isAdmin') === 'on',
      };

      await apiRequest(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      toast({ title: "User updated successfully" });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      refetchUsers();
    } catch (error) {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User Management</CardTitle>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{user.username}</h3>
                    {user.isAdmin && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                    <span>Credits: {user.credits ? `${user.credits.remaining}/${user.credits.total}` : 'N/A'}</span>
                    <span>Subscription: {user.subscription ? user.subscription.status : 'None'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="border-green-600 text-green-600 hover:bg-green-50" 
                    size="sm"
                    onClick={() => handleAssignPackage(user)}
                  >
                    Package
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-blue-600 text-blue-600 hover:bg-blue-50" 
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form action={handleSaveUser} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                name="username" 
                defaultValue={editingUser?.username}
                required 
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email"
                defaultValue={editingUser?.email}
              />
            </div>
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                defaultValue={editingUser?.firstName}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                defaultValue={editingUser?.lastName}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="isAdmin" 
                name="isAdmin" 
                defaultChecked={editingUser?.isAdmin}
              />
              <Label htmlFor="isAdmin">Administrator</Label>
            </div>
            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Package to {assigningUser?.username}</DialogTitle>
          </DialogHeader>
          <form action={handleAssignUserPackage} className="space-y-4">
            <div>
              <Label htmlFor="packageId">Select Package</Label>
              <select
                id="packageId"
                name="packageId"
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Choose a package...</option>
                {packages.filter(p => p.isActive).map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - {pkg.credits.toLocaleString()} credits - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(pkg.price / 100)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input 
                id="duration" 
                name="duration" 
                type="number"
                defaultValue="30"
                min="1"
                required 
              />
            </div>
            <Button type="submit" className="w-full">Assign Package</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <form action={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isAdmin" name="isAdmin" />
              <Label htmlFor="isAdmin">Administrator</Label>
            </div>
            <Button type="submit" className="w-full">Create User</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
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
              <Button variant="outline" className="w-full mt-4 border-blue-600 text-blue-600 hover:bg-blue-50" size="sm">
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveApiKey = async () => {
    if (!openRouterKey.trim()) {
      toast({ title: "Please enter an API key", variant: "destructive" });
      return;
    }

    setIsLoading(true);
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
      setOpenRouterKey(""); // Clear the input after saving
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({ title: "Failed to save API key", variant: "destructive" });
    } finally {
      setIsLoading(false);
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
            <Button onClick={handleSaveApiKey} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 space-y-1">
            <p>This key will be used for AI model requests</p>
            <div className="bg-blue-50 p-2 rounded border">
              <p className="font-semibold text-blue-800">Security Policy:</p>
              <p className="text-blue-700">All application secrets are now stored securely in the database instead of environment variables for better admin control and security.</p>
            </div>
          </div>
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
                    <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" size="sm">Edit</Button>
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
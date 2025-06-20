import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Bot, FileText, Search, Edit3 } from "lucide-react";
import { useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/login", data);
      if (response.ok) {
        toast({
          title: "Login berhasil",
          description: "Selamat datang di Mitra AI",
        });
        window.location.reload(); // Refresh to update auth state
      } else {
        const error = await response.json();
        toast({
          title: "Login gagal",
          description: error.message || "Username atau password salah",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/register", data);
      if (response.ok) {
        toast({
          title: "Registrasi berhasil",
          description: "Akun berhasil dibuat, selamat datang di Mitra AI",
        });
        window.location.reload(); // Refresh to update auth state
      } else {
        const error = await response.json();
        toast({
          title: "Registrasi gagal",
          description: error.message || "Terjadi kesalahan saat membuat akun",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat registrasi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Mitra AI</h1>
            </div>
            <p className="text-gray-600">Platform Pembuatan Dokumen Akademik dengan AI</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Masuk ke Akun</CardTitle>
                  <CardDescription>
                    Masukkan username dan password untuk melanjutkan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Masukkan username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Masukkan password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Masuk..." : "Masuk"}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Demo Account:</strong><br />
                      Username: admin<br />
                      Password: hello
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Buat Akun Baru</CardTitle>
                  <CardDescription>
                    Daftarkan akun untuk mulai menggunakan Mitra AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Pilih username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Masukkan email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Depan</FormLabel>
                              <FormControl>
                                <Input placeholder="Nama depan" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Belakang</FormLabel>
                              <FormControl>
                                <Input placeholder="Nama belakang" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Buat password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Mendaftar..." : "Daftar"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Feature showcase */}
      <div className="flex-1 relative text-white p-8 flex items-center justify-center bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/attached_assets/istockphoto-1344939844-612x612_1750426438456.jpg)' }}>
        {/* Blue gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-blue-700/85 to-blue-900/90"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-lg text-center">
          <h2 className="text-3xl font-bold mb-6">
            Revolusi Penulisan Akademik dengan AI
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Tiga mode powerful untuk semua kebutuhan akademik Anda
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Search className="h-8 w-8 text-blue-200" />
              <div className="text-left">
                <h3 className="font-semibold">Mode Riset</h3>
                <p className="text-blue-100 text-sm">Bantuan penelitian dan pencarian literatur</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-blue-200" />
              <div className="text-left">
                <h3 className="font-semibold">Buat Dokumen</h3>
                <p className="text-blue-100 text-sm">Pembuatan dokumen akademik berkualitas tinggi</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Edit3 className="h-8 w-8 text-blue-200" />
              <div className="text-left">
                <h3 className="font-semibold">Edit Dokumen</h3>
                <p className="text-blue-100 text-sm">Perbaikan dan peningkatan dokumen existing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
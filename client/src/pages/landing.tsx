import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, FileText, Search, Edit3, Users, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Mitra AI</h1>
          </div>
          <Button onClick={() => window.location.href = "/api/login"}>
            Masuk
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Platform Pembuatan Dokumen Akademik dengan AI
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Mitra AI membantu Anda dalam penelitian, pembuatan, dan editing dokumen akademik 
            menggunakan kecerdasan buatan terdepan.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary hover:bg-primary/90"
          >
            Mulai Sekarang
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Fitur Utama
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Search className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Mode Riset</h4>
              <p className="text-gray-600">
                Dapatkan bantuan penelitian dengan AI untuk mencari literatur, 
                menganalisis data, dan mengidentifikasi gap penelitian.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Buat Dokumen</h4>
              <p className="text-gray-600">
                Buat dokumen akademik berkualitas tinggi dengan bantuan AI 
                yang mengikuti standar akademik internasional.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Edit3 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Edit Dokumen</h4>
              <p className="text-gray-600">
                Perbaiki dan tingkatkan kualitas dokumen yang sudah ada 
                dengan saran editorial profesional dari AI.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Mengapa Memilih Mitra AI?
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start space-x-4">
              <Users className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold mb-2">Interface Intuitif</h4>
                <p className="text-gray-600">
                  Interface chat yang mudah digunakan memungkinkan interaksi natural 
                  dengan AI untuk semua kebutuhan akademik Anda.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <Shield className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold mb-2">Keamanan Data</h4>
                <p className="text-gray-600">
                  Data dan dokumen Anda tersimpan aman dengan enkripsi tingkat enterprise 
                  dan akses yang terkontrol.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 Mitra AI. Platform Pembuatan Dokumen Akademik dengan AI.</p>
        </div>
      </footer>
    </div>
  );
}

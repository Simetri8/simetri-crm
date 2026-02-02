'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { seedService } from '@/lib/firebase/seed';
import { Database, Loader2, Trash2, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function DevSeedButton() {
  const [isLoading, setIsLoading] = useState(false);

  // Sadece development ortamında göster
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleSeed = async () => {
    if (!confirm('Tüm veriler silinecek ve demo verileri eklenecek. Emin misiniz?')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await seedService.resetAndSeed();
      toast.success('Demo verileri başarıyla yüklendi', {
        description: `${result.customers} müşteri, ${result.projects} proje, ${result.tasks} görev eklendi.`,
      });
      window.location.reload();
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Veri yükleme sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('TÜM VERİLER SİLİNECEK (Müşteriler, Projeler, Görevler vb.). Bu işlem geri alınamaz. Emin misiniz?')) {
      return;
    }

    setIsLoading(true);
    try {
      await seedService.clearAll();
      toast.success('Tüm veriler başarıyla silindi');
      window.location.reload();
    } catch (error) {
      console.error('Clear error:', error);
      toast.error('Veri silme sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="bg-background shadow-lg border-orange-500/50 hover:border-orange-500 text-orange-600 hover:text-orange-700 gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Geliştirici Araçları
            <ChevronUp className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mb-2">
          <DropdownMenuItem onClick={handleSeed} disabled={isLoading} className="cursor-pointer">
            <Database className="h-4 w-4 mr-2 text-orange-600" />
            <span>Demo Verileri Yükle</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleClear} 
            disabled={isLoading} 
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span>Tüm Verileri Sil</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

'use client';

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { LogIn } from "lucide-react"

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center flex flex-col gap-8">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logos/Simetri-CRM-logo-02-cropped.png"
            alt="Simetri CRM Logo"
            width={220}
            height={70}
            priority
            className="block dark:hidden"
          />
          <Image
            src="/logos/Simetri-CRM-logo-03-cropped.png"
            alt="Simetri CRM Logo"
            width={220}
            height={70}
            priority
            className="hidden dark:block"
          />
        </div>
        <p className="mb-8 text-muted-foreground">Müşteri İlişkileri Yönetim Sistemi</p>
        <Button onClick={signInWithGoogle} size="lg" className="gap-2">
          <LogIn className="h-4 w-4" />
          Google ile giriş yap
        </Button>
      </div>
    </div>
  )
}

'use client';

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { LogIn } from "lucide-react"

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Simetri Planner</h1>
        <p className="mb-8 text-muted-foreground">Company Management System</p>
        <Button onClick={signInWithGoogle} size="lg" className="gap-2">
          <LogIn className="h-4 w-4" />
          Login with Google
        </Button>
      </div>
    </div>
  )
}

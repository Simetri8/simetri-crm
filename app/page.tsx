import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Simetri Planner</h1>
        <p className="mb-8 text-muted-foreground">Company Management System</p>
        <Button asChild>
          <Link href="/dashboard">Login with Google</Link>
        </Button>
      </div>
    </div>
  )
}

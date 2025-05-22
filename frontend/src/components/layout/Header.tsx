import { useNavigate } from "react-router-dom"
import { signOut, useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function Header() {
  const navigate = useNavigate()
  const { data: session } = useSession()

  async function handleLogout() {
    await signOut()
    navigate("/")
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <h1 className="text-xl font-semibold">Bootstrap App</h1>
        <div className="flex items-center gap-4">
          {session?.user?.email && (
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
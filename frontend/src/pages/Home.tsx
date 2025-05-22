import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-2xl mx-auto text-center px-4">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Bootstrap App
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          A minimal full-stack application with authentication, user profiles, and a shared counter.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/login">
            <Button size="lg">Login</Button>
          </Link>
          <Link to="/signup">
            <Button size="lg" variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
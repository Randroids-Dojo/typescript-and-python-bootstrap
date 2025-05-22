import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSession } from "@/lib/auth-client"
import { Layout } from "@/components/layout/Layout"
import { UserProfile } from "@/components/features/UserProfile"
import { GlobalCounter } from "@/components/features/GlobalCounter"

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && !session) {
      navigate("/login")
    }
  }, [session, isPending, navigate])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid gap-8 md:grid-cols-2">
          <UserProfile />
          <GlobalCounter />
        </div>
      </div>
    </Layout>
  )
}
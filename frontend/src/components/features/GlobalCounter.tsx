import { useState, useEffect } from "react"
import { counterApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Plus, Users } from "lucide-react"

export function GlobalCounter() {
  const [count, setCount] = useState(0)
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isIncrementing, setIsIncrementing] = useState(false)

  useEffect(() => {
    loadCounter()
    // Poll for updates every 5 seconds
    const interval = setInterval(loadCounter, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadCounter() {
    try {
      const response = await counterApi.getCounter()
      const data = response.data
      setCount(data.count)
      setLastUpdatedBy(data.last_updated_by)
      setLastUpdatedAt(data.last_updated_at)
    } catch (error) {
      console.error("Failed to load counter:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleIncrement() {
    setIsIncrementing(true)
    try {
      const response = await counterApi.incrementCounter()
      const data = response.data
      setCount(data.count)
      setLastUpdatedBy(data.last_updated_by)
      setLastUpdatedAt(data.last_updated_at)
    } catch (error) {
      console.error("Failed to increment counter:", error)
    } finally {
      setIsIncrementing(false)
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading counter...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>Global Counter</CardTitle>
        </div>
        <CardDescription>
          A shared counter that anyone can increment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold mb-4">{count}</div>
            <Button
              size="lg"
              onClick={handleIncrement}
              disabled={isIncrementing}
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              {isIncrementing ? "Incrementing..." : "Increment"}
            </Button>
          </div>
          {lastUpdatedBy && (
            <div className="text-sm text-muted-foreground text-center mt-4">
              Last updated by: {lastUpdatedBy}
              <br />
              at {formatDate(lastUpdatedAt)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function Signup() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null)
    setIsLoading(true)

    try {
      const result = await signUp.email({
        email: values.email,
        password: values.password,
      })
      
      // Check if the result contains an error
      if (result?.error || result?.code || result?.status === "422") {
        // Treat it as an error
        const err = result
        const errorCode = err.code || err.error?.code
        const errorMessage = err.message || err.error?.message
        
        if (errorCode === 'USER_ALREADY_EXISTS' || errorMessage?.includes('already exists')) {
          setError("An account with this email already exists. Please sign in instead.")
        } else if (errorCode === 'WEAK_PASSWORD') {
          setError("Password is too weak. Please use a stronger password.")
        } else if (errorCode === 'INVALID_EMAIL') {
          setError("Please enter a valid email address.")
        } else {
          setError(errorMessage || "Failed to create account. Please try again.")
        }
        return // Don't navigate
      }
      
      // Only navigate if signup was truly successful
      if (result && result.user) {
        navigate("/dashboard")
      }
    } catch (err: any) {
      console.error("Signup error full details:", err)
      console.error("Error response:", err.response)
      console.error("Error data:", err.response?.data)
      
      // Check different error formats
      const errorCode = err.code || err.response?.data?.code || err.error?.code
      const errorMessage = err.message || err.response?.data?.message || err.error?.message
      
      alert("ERROR CODE: " + errorCode + ", MESSAGE: " + errorMessage)
      
      // Better error handling for different error types
      if (errorCode === 'USER_ALREADY_EXISTS' || errorMessage?.includes('already exists')) {
        setError("An account with this email already exists. Please sign in instead.")
      } else if (errorCode === 'WEAK_PASSWORD') {
        setError("Password is too weak. Please use a stronger password.")
      } else if (errorCode === 'INVALID_EMAIL') {
        setError("Please enter a valid email address.")
      } else {
        setError(errorMessage || "Failed to create account. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>
            Create a new account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://localhost:80/auth"
})

export const { useSession, signIn, signUp, signOut } = authClient
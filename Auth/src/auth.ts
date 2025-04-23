import { betterAuth } from "better-auth";
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL, JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION, NODE_ENV } from "./config";

export const auth = betterAuth({
  // Basic configuration
  secret: BETTER_AUTH_SECRET,
  baseUrl: BETTER_AUTH_URL,
  
  emailAndPassword: {    
    enabled: true,
    // Configure password requirements
    passwordRequirements: {
      minLength: 8,
      requireSpecialChars: true,
      requireNumbers: true
    }
  },
  session: {
    // Configure session handling
    strategy: "jwt",
    accessTokenExpiresIn: JWT_ACCESS_EXPIRATION,
    refreshTokenExpiresIn: JWT_REFRESH_EXPIRATION,
    cookieOptions: {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "strict"
    }
  },
  // Optional: Add social login providers when needed
  // socialProviders: {
  //   github: { 
  //     clientId: process.env.GITHUB_CLIENT_ID!, 
  //     clientSecret: process.env.GITHUB_CLIENT_SECRET!
  //   }
  // }
});

export default auth;
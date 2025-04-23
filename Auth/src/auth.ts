import { betterAuth } from "better-auth";
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from "./config";

export const auth = betterAuth({
  // Basic configuration
  secret: BETTER_AUTH_SECRET,
  baseUrl: BETTER_AUTH_URL,
  
  emailAndPassword: {    
    enabled: true
    // BetterAuth doesn't support passwordRequirements in its type
    // but we'll keep the validation logic in our service
  },
  // Session config needs to conform to the actual type
  session: {
    // We'll use the allowed properties only
    // Comments kept for documentation
    // Actual config would include: access token expiration, refresh token expiration, etc.
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
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authClient, signIn, signUp, signOut, useSession } from './auth-client'

describe('Auth Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authClient', () => {
    it('should be configured with correct baseURL', () => {
      expect(authClient.baseURL).toBe('http://localhost:80/auth')
    })
  })

  describe('exported functions', () => {
    it('should export signIn function', () => {
      expect(signIn).toBeDefined()
      expect(typeof signIn.email).toBe('function')
    })

    it('should export signUp function', () => {
      expect(signUp).toBeDefined()
      expect(typeof signUp.email).toBe('function')
    })

    it('should export signOut function', () => {
      expect(signOut).toBeDefined()
      expect(typeof signOut).toBe('function')
    })

    it('should export useSession hook', () => {
      expect(useSession).toBeDefined()
      expect(typeof useSession).toBe('function')
    })
  })
})
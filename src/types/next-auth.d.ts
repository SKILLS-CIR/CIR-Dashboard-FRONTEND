import "next-auth"
import { Role } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: Role
      uid?: string
      isSuperAdmin?: boolean  // Add this
    }
  }

  interface User {
    id: string
    email: string
    role: Role
    uid?: string
    isSuperAdmin?: boolean  // Add this
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    role: Role
    uid?: string
    isSuperAdmin?: boolean  // Add this
  }
}
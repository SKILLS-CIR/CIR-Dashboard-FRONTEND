import NextAuth, { NextAuthOptions, User } from "next-auth"
import { getServerSession } from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { loginSchema } from "@/lib/validations/auth"
import { Role } from "@/types/cir"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    uid?: string
    role: Role
  }
  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    uid?: string
  }
}

// Helper function to parse user agent
function parseUserAgent(ua: string): { deviceType: string, os: string, browser: string } {
  const uaLower = ua.toLowerCase()
  let deviceType = 'Desktop'
  let os = 'Unknown'
  let browser = 'Unknown'

  // Device Type
  if (uaLower.includes('mobile') || uaLower.includes('android') || uaLower.includes('iphone')) {
    deviceType = 'Mobile'
  } else if (uaLower.includes('ipad') || uaLower.includes('tablet')) {
    deviceType = 'Tablet'
  }

  // Operating System
  if (uaLower.includes('windows')) os = 'Windows'
  else if (uaLower.includes('mac')) os = 'macOS'
  else if (uaLower.includes('linux')) os = 'Linux'
  else if (uaLower.includes('android')) os = 'Android'
  else if (uaLower.includes('ios') || uaLower.includes('iphone') || uaLower.includes('ipad')) os = 'iOS'

  // Browser
  if (uaLower.includes('edg')) browser = 'Edge'
  else if (uaLower.includes('chrome')) browser = 'Chrome'
  else if (uaLower.includes('firefox')) browser = 'Firefox'
  else if (uaLower.includes('safari')) browser = 'Safari'
  else if (uaLower.includes('opera')) browser = 'Opera'

  return { deviceType, os, browser }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        uid: { label: "UID", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials, req) {
        try {
          // Validate credentials exist
          if (!credentials) {
            console.error("No credentials provided")
            return null
          }

          const { email, uid, password, role } = credentials as {
            email?: string
            uid?: string
            password: string
            role?: Role
          }

          // Validate required fields
          if (!password) {
            console.error("Password is required")
            return null
          }

          if (!role || !["ADMIN", "MANAGER", "STAFF"].includes(role)) {
            console.error("Invalid role:", role)
            return null
          }

          // Get IP and User Agent from request
          const ipAddress = (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            (req?.headers?.['x-real-ip'] as string) ||
            'unknown'
          const userAgent = (req?.headers?.['user-agent'] as string) || 'unknown'

          // Parse user agent
          const { deviceType, os, browser } = parseUserAgent(userAgent)

          // Find user based on role and credentials
          let user = null

          if (role === "ADMIN") {
            if (!email) {
              console.error("Email is required for ADMIN")
              return null
            }

            user = await prisma.user.findUnique({
              where: { email },
              include: {
                admin: true,
                participant: true,
              },
            })
          } else if (role === "STAFF" || role === "MANAGER") {
            if (!email) {
              console.error("Email is required for STAFF/MANAGER")
              return null
            }

            // Find user by email
            user = await prisma.user.findUnique({
              where: { email },
              include: {
                admin: true,
                participant: true,
              },
            })
          }

          if (!user) {
            console.error("User not found:", email || uid)
            // Log failed attempt
            await prisma.loginLog.create({
              data: {
                email: email || uid || 'unknown',
                ipAddress,
                userAgent,
                deviceType,
                os,
                browser,
                isSuccess: false
              }
            })
            return null  // Return null instead of throwing
          }

          // Verify role matches
          if (user.role !== role) {
            console.error("Role mismatch:", user.role, "!==", role)
            await prisma.loginLog.create({
              data: {
                userId: user.id,
                email: user.email,
                ipAddress,
                userAgent,
                deviceType,
                os,
                browser,
                isSuccess: false
              }
            })
            return null  // Return null instead of throwing
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password)
          if (!isValidPassword) {
            console.error("Invalid password for user:", user.email)
            await prisma.loginLog.create({
              data: {
                userId: user.id,
                email: user.email,
                ipAddress,
                userAgent,
                deviceType,
                os,
                browser,
                isSuccess: false
              }
            })
            return null  // Return null instead of throwing
          }

          // Create successful login log
          await prisma.loginLog.create({
            data: {
              userId: user.id,
              email: user.email,
              ipAddress,
              userAgent,
              deviceType,
              os,
              browser,
              isSuccess: true
            }
          })

          return {
            id: user.id,
            email: user.email,
            uid: user.uid || undefined,
            role: user.role,
            isSuperAdmin: user.admin?.isSuperAdmin || false  // Add this line
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.uid = user.uid
        token.isSuperAdmin = user.isSuperAdmin || false  // Add this line
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.uid = token.uid as string | undefined
        session.user.isSuperAdmin = token.isSuperAdmin as boolean  // Add this line
      }
      return session
    },
  },
}

export default NextAuth(authOptions)

export const auth = () => getServerSession(authOptions)
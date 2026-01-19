// components/auth/role-guard.tsx

"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Role } from "@prisma/client"

interface RoleGuardProps {
  allowedRoles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/login")
      return
    }
    
    if (!allowedRoles.includes(session.user.role as Role)) {
      const dashboardUrl = getDashboardUrl(session.user.role as Role)
      router.push(dashboardUrl)
    }
  }, [session, status, allowedRoles, router])
  
  if (status === "loading") {
    return <div>Loading...</div>
  }
  
  if (!session || !allowedRoles.includes(session.user.role as Role)) {
    return fallback ? <>{fallback}</> : null
  }
  
  return <>{children}</>
}

function getDashboardUrl(role: Role): string {
  const dashboards: Record<Role, string> = {
    ADMIN: "/admin",
    PARTICIPANT: "/participant",
  }
  return dashboards[role] || "/"
}
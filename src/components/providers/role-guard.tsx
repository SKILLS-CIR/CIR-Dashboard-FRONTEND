'use client'

import { useAuth, useRole } from './auth-context'
import { Role } from '@/types/cir'
import { ReactNode } from 'react'

interface RoleGuardProps {
    children: ReactNode
    allowedRoles: Role[]
    fallback?: ReactNode
}

/**
 * Component that renders children only if user has one of the allowed roles
 */
export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
    const { role, isLoading } = useAuth()

    if (isLoading) {
        return null
    }

    if (!role || !allowedRoles.includes(role)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

interface ActionGuardProps {
    children: ReactNode
    action: 'manageUsers' | 'manageDepartments' | 'assignWork' | 'verifyWork' | 'submitWork' | 'viewAllData' | 'viewSubDeptData'
    fallback?: ReactNode
    disableOnly?: boolean
}

/**
 * Component that renders children only if user can perform the specified action
 */
export function ActionGuard({ children, action, fallback = null, disableOnly = false }: ActionGuardProps) {
    const roleInfo = useRole()

    const actionMap: Record<string, boolean> = {
        manageUsers: roleInfo.canManageUsers,
        manageDepartments: roleInfo.canManageDepartments,
        assignWork: roleInfo.canAssignWork,
        verifyWork: roleInfo.canVerifyWork,
        submitWork: roleInfo.canSubmitWork,
        viewAllData: roleInfo.canViewAllData,
        viewSubDeptData: roleInfo.canViewSubDeptData,
    }

    const canPerform = actionMap[action] ?? false

    if (!canPerform) {
        if (disableOnly) {
            // Render children but in disabled state
            return (
                <div className="opacity-50 pointer-events-none cursor-not-allowed">
                    {children}
                </div>
            )
        }
        return <>{fallback}</>
    }

    return <>{children}</>
}

/**
 * Hook to check if current user can perform an action
 */
export function useCanPerform(action: ActionGuardProps['action']): boolean {
    const roleInfo = useRole()

    const actionMap: Record<string, boolean> = {
        manageUsers: roleInfo.canManageUsers,
        manageDepartments: roleInfo.canManageDepartments,
        assignWork: roleInfo.canAssignWork,
        verifyWork: roleInfo.canVerifyWork,
        submitWork: roleInfo.canSubmitWork,
        viewAllData: roleInfo.canViewAllData,
        viewSubDeptData: roleInfo.canViewSubDeptData,
    }

    return actionMap[action] ?? false
}

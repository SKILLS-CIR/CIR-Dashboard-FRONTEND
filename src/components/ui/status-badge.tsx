import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { SubmissionStatus, AssignmentStatus, DayStatus } from "@/types/cir"

const statusBadgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            status: {
                PENDING: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
                SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
                VERIFIED: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
                REJECTED: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
                IN_PROGRESS: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400",
                COMPLETED: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
                OVERDUE: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
                NOT_SUBMITTED: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400",
                PARTIAL: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400",
            },
        },
        defaultVariants: {
            status: "PENDING",
        },
    }
)

const statusIcons: Record<string, string> = {
    PENDING: "⏳",
    SUBMITTED: "📤",
    VERIFIED: "✓",
    REJECTED: "✗",
    IN_PROGRESS: "🔄",
    COMPLETED: "✓",
    OVERDUE: "⚠",
    NOT_SUBMITTED: "○",
    PARTIAL: "◐",
}

const statusLabels: Record<string, string> = {
    PENDING: "Pending",
    SUBMITTED: "Submitted",
    VERIFIED: "Verified",
    REJECTED: "Rejected",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    OVERDUE: "Overdue",
    NOT_SUBMITTED: "Not Submitted",
    PARTIAL: "Partial",
}

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
    showIcon?: boolean
}

function StatusBadge({
    className,
    status,
    showIcon = true,
    children,
    ...props
}: StatusBadgeProps) {
    const statusKey = status || "PENDING"

    return (
        <div className={cn(statusBadgeVariants({ status }), className)} {...props}>
            {showIcon && <span className="mr-1">{statusIcons[statusKey]}</span>}
            {children || statusLabels[statusKey]}
        </div>
    )
}

// Convenience components for specific status types
interface SubmissionStatusBadgeProps extends Omit<StatusBadgeProps, 'status'> {
    status: SubmissionStatus
}

function SubmissionStatusBadge({ status, ...props }: SubmissionStatusBadgeProps) {
    return <StatusBadge status={status} {...props} />
}

interface AssignmentStatusBadgeProps extends Omit<StatusBadgeProps, 'status'> {
    status: AssignmentStatus
}

function AssignmentStatusBadge({ status, ...props }: AssignmentStatusBadgeProps) {
    return <StatusBadge status={status} {...props} />
}

// Day status badge for calendar view
interface DayStatusBadgeProps extends Omit<StatusBadgeProps, 'status'> {
    status: DayStatus
}

function DayStatusBadge({ status, ...props }: DayStatusBadgeProps) {
    return <StatusBadge status={status} {...props} />
}

// Priority badge for responsibilities
const priorityBadgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
    {
        variants: {
            priority: {
                LOW: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
                MEDIUM: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
                HIGH: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400",
                CRITICAL: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
            },
        },
        defaultVariants: {
            priority: "MEDIUM",
        },
    }
)

interface PriorityBadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof priorityBadgeVariants> { }

function PriorityBadge({ className, priority, ...props }: PriorityBadgeProps) {
    return (
        <div className={cn(priorityBadgeVariants({ priority }), className)} {...props}>
            {priority}
        </div>
    )
}

// Role badge
const roleBadgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
    {
        variants: {
            role: {
                ADMIN: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
                MANAGER: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
                STAFF: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
            },
        },
        defaultVariants: {
            role: "STAFF",
        },
    }
)

interface RoleBadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof roleBadgeVariants> { }

function RoleBadge({ className, role, ...props }: RoleBadgeProps) {
    return (
        <div className={cn(roleBadgeVariants({ role }), className)} {...props}>
            {role}
        </div>
    )
}

export {
    StatusBadge,
    SubmissionStatusBadge,
    AssignmentStatusBadge,
    DayStatusBadge,
    PriorityBadge,
    RoleBadge,
    statusBadgeVariants,
    priorityBadgeVariants,
    roleBadgeVariants,
}

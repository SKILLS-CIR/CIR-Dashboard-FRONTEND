"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-context"
import { api } from "@/lib/api"
import { Assignment, WorkSubmission } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SubmissionStatusBadge, AssignmentStatusBadge } from "@/components/ui/status-badge"
import Link from "next/link"
import {
    ClipboardList,
    FileCheck,
    Clock,
    CheckCircle,
    ArrowRight,
    AlertCircle,
} from "lucide-react"

interface DashboardStats {
    totalAssignments: number
    pendingAssignments: number
    completedAssignments: number
    submittedCount: number
    verifiedCount: number
    rejectedCount: number
}

export default function StaffDashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState<DashboardStats>({
        totalAssignments: 0,
        pendingAssignments: 0,
        completedAssignments: 0,
        submittedCount: 0,
        verifiedCount: 0,
        rejectedCount: 0,
    })
    const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([])
    const [recentSubmissions, setRecentSubmissions] = useState<WorkSubmission[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const [assignments, submissions] = await Promise.all([
                    api.assignments.getAll(),
                    api.workSubmissions.getAll(),
                ])

                // Backend scopes to own data for STAFF
                const pending = assignments.filter(a =>
                    a.status === 'PENDING' || a.status === 'IN_PROGRESS'
                )

                setStats({
                    totalAssignments: assignments.length,
                    pendingAssignments: pending.length,
                    completedAssignments: assignments.filter(a => a.status === 'COMPLETED').length,
                    submittedCount: submissions.filter(s => s.status === 'SUBMITTED').length,
                    verifiedCount: submissions.filter(s => s.status === 'VERIFIED').length,
                    rejectedCount: submissions.filter(s => s.status === 'REJECTED').length,
                })

                setPendingAssignments(pending.slice(0, 5))
                setRecentSubmissions(submissions.slice(0, 5))
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, {user?.name || 'Staff'}. Track your work and submissions here.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Assignments</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                        <p className="text-xs text-muted-foreground">
                            Total assignments
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingAssignments}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting completion
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verified</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.verifiedCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Approved submissions
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                        <FileCheck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.submittedCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting review
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Rejected Alert */}
            {stats.rejectedCount > 0 && (
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <AlertCircle className="h-5 w-5" />
                            {stats.rejectedCount} Rejected Submission{stats.rejectedCount > 1 ? 's' : ''}
                        </CardTitle>
                        <CardDescription className="text-red-600 dark:text-red-400">
                            Some of your work requires revision. Please review and resubmit.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            {/* Pending Assignments */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>My Pending Assignments</CardTitle>
                        <CardDescription>Work that needs to be completed</CardDescription>
                    </div>
                    {stats.pendingAssignments > 0 && (
                        <Button asChild>
                            <Link href="/staff/assignments">
                                View All <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {pendingAssignments.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                            <p className="text-muted-foreground">
                                All caught up! No pending assignments.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingAssignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {assignment.responsibility?.title || 'Assignment'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {assignment.dueDate
                                                ? `Due: ${new Date(assignment.dueDate).toLocaleDateString()}`
                                                : 'No due date'
                                            }
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <AssignmentStatusBadge status={assignment.status} />
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/staff/work-submissions?assignment=${assignment.id}`}>
                                                Submit Work
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Submissions</CardTitle>
                        <CardDescription>Your latest work submissions</CardDescription>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/staff/work-submissions">
                            View All <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {recentSubmissions.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                            No submissions yet
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {recentSubmissions.map((submission) => (
                                <div
                                    key={submission.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {submission.assignment?.responsibility?.title || 'Work Submission'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <SubmissionStatusBadge status={submission.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

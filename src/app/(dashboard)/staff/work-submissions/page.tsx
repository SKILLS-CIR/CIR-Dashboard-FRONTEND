"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { WorkSubmission } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubmissionStatusBadge } from "@/components/ui/status-badge"
import { FileCheck, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function StaffWorkSubmissionsPage() {
    const [submissions, setSubmissions] = useState<WorkSubmission[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchSubmissions() {
            try {
                const data = await api.workSubmissions.getAll()
                setSubmissions(data)
            } catch (error) {
                console.error("Failed to fetch submissions:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSubmissions()
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    const groupedSubmissions = {
        pending: submissions.filter(s => s.status === 'PENDING'),
        submitted: submissions.filter(s => s.status === 'SUBMITTED'),
        verified: submissions.filter(s => s.status === 'VERIFIED'),
        rejected: submissions.filter(s => s.status === 'REJECTED'),
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Work Submissions</h1>
                <p className="text-muted-foreground">
                    Track the status of your submitted work
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{groupedSubmissions.pending.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                        <FileCheck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{groupedSubmissions.submitted.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verified</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{groupedSubmissions.verified.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{groupedSubmissions.rejected.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Rejected Submissions Alert */}
            {groupedSubmissions.rejected.length > 0 && (
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                            Rejected Submissions Need Attention
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {groupedSubmissions.rejected.map((submission) => (
                            <div key={submission.id} className="p-3 bg-white dark:bg-red-900 rounded-lg">
                                <p className="font-medium">{submission.assignment?.responsibility?.title}</p>
                                {submission.rejectionReason && (
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                        Reason: {submission.rejectionReason}
                                    </p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* All Submissions */}
            <Card>
                <CardHeader>
                    <CardTitle>All Submissions</CardTitle>
                    <CardDescription>
                        {submissions.length} total submission{submissions.length !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {submissions.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No submissions yet. Start by submitting work for your assignments.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {submissions.map((submission) => (
                                <div
                                    key={submission.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${submission.status === 'VERIFIED' ? 'bg-green-100 dark:bg-green-900' :
                                                submission.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900' :
                                                    submission.status === 'SUBMITTED' ? 'bg-blue-100 dark:bg-blue-900' :
                                                        'bg-amber-100 dark:bg-amber-900'
                                            }`}>
                                            {submission.status === 'VERIFIED' && <CheckCircle className="h-5 w-5 text-green-600" />}
                                            {submission.status === 'REJECTED' && <XCircle className="h-5 w-5 text-red-600" />}
                                            {submission.status === 'SUBMITTED' && <FileCheck className="h-5 w-5 text-blue-600" />}
                                            {submission.status === 'PENDING' && <Clock className="h-5 w-5 text-amber-600" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {submission.assignment?.responsibility?.title || 'Work Submission'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Submitted: {new Date(submission.submittedAt).toLocaleString()}
                                            </p>
                                            {submission.verifiedAt && (
                                                <p className="text-sm text-muted-foreground">
                                                    Verified: {new Date(submission.verifiedAt).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
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

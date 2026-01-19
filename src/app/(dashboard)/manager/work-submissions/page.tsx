"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { WorkSubmission } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SubmissionStatusBadge } from "@/components/ui/status-badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CheckCircle, XCircle, Eye, MessageSquare } from "lucide-react"
import { toast } from "sonner"

export default function ManagerWorkSubmissionsPage() {
    const [submissions, setSubmissions] = useState<WorkSubmission[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>("SUBMITTED")
    const [selectedSubmission, setSelectedSubmission] = useState<WorkSubmission | null>(null)
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")
    const [isVerifying, setIsVerifying] = useState(false)

    useEffect(() => {
        fetchSubmissions()
    }, [])

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

    const filteredSubmissions = statusFilter === "all"
        ? submissions
        : submissions.filter(s => s.status === statusFilter)

    async function handleVerify(status: 'VERIFIED' | 'REJECTED') {
        if (!selectedSubmission) return

        setIsVerifying(true)
        try {
            await api.workSubmissions.verify(selectedSubmission.id, {
                status,
                rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
            })
            toast.success(`Submission ${status.toLowerCase()} successfully`)
            setVerifyDialogOpen(false)
            setSelectedSubmission(null)
            setRejectionReason("")
            fetchSubmissions()
        } catch (error) {
            console.error("Failed to verify submission:", error)
            toast.error("Failed to verify submission")
        } finally {
            setIsVerifying(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Work Submissions</h1>
                <p className="text-muted-foreground">
                    Review and verify work submissions from your team
                </p>
            </div>

            {/* Filter */}
            <Card>
                <CardContent className="pt-6">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="SUBMITTED">Pending Review</SelectItem>
                            <SelectItem value="VERIFIED">Verified</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Submissions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Submissions</CardTitle>
                    <CardDescription>
                        {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredSubmissions.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No submissions found
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Responsibility</TableHead>
                                    <TableHead>Staff</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubmissions.map((submission) => (
                                    <TableRow key={submission.id}>
                                        <TableCell className="font-medium">
                                            {submission.assignment?.responsibility?.title || 'N/A'}
                                        </TableCell>
                                        <TableCell>{submission.employee?.name || 'Unknown'}</TableCell>
                                        <TableCell>
                                            {new Date(submission.submittedAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <SubmissionStatusBadge status={submission.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedSubmission(submission)
                                                        setVerifyDialogOpen(true)
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" /> Review
                                                </Button>
                                                {submission.status === 'SUBMITTED' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-green-600"
                                                            onClick={() => {
                                                                setSelectedSubmission(submission)
                                                                handleVerify('VERIFIED')
                                                            }}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600"
                                                            onClick={() => {
                                                                setSelectedSubmission(submission)
                                                                setVerifyDialogOpen(true)
                                                            }}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Verify Dialog */}
            <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review Submission</DialogTitle>
                        <DialogDescription>
                            {selectedSubmission?.assignment?.responsibility?.title}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSubmission && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-2">Submitted Work:</p>
                                <p className="whitespace-pre-wrap">{selectedSubmission.content}</p>
                            </div>

                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>By: {selectedSubmission.employee?.name}</span>
                                <span>Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}</span>
                            </div>

                            {selectedSubmission.status === 'SUBMITTED' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Rejection Reason (if rejecting):</label>
                                    <Textarea
                                        placeholder="Provide feedback on why this submission is being rejected..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
                            Cancel
                        </Button>
                        {selectedSubmission?.status === 'SUBMITTED' && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleVerify('REJECTED')}
                                    disabled={isVerifying}
                                >
                                    <XCircle className="h-4 w-4 mr-2" /> Reject
                                </Button>
                                <Button
                                    onClick={() => handleVerify('VERIFIED')}
                                    disabled={isVerifying}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" /> Verify
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

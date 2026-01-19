"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Assignment, WorkSubmission } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AssignmentStatusBadge, SubmissionStatusBadge } from "@/components/ui/status-badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ClipboardList, FileCheck, Clock, Send } from "lucide-react"
import { toast } from "sonner"

export default function StaffAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [submissions, setSubmissions] = useState<WorkSubmission[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
    const [workContent, setWorkContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [assignmentsData, submissionsData] = await Promise.all([
                api.assignments.getAll(),
                api.workSubmissions.getAll(),
            ])
            setAssignments(assignmentsData)
            setSubmissions(submissionsData)
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    function getSubmissionForAssignment(assignmentId: string): WorkSubmission | undefined {
        return submissions.find(s => s.assignmentId === assignmentId)
    }

    async function handleSubmit() {
        if (!selectedAssignment || !workContent.trim()) {
            toast.error("Please enter your work content")
            return
        }

        setIsSubmitting(true)
        try {
            await api.workSubmissions.create({
                assignmentId: selectedAssignment.id,
                content: workContent,
            })
            toast.success("Work submitted successfully!")
            setSubmitDialogOpen(false)
            setSelectedAssignment(null)
            setWorkContent("")
            fetchData()
        } catch (error) {
            console.error("Failed to submit work:", error)
            toast.error("Failed to submit work")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    const pendingAssignments = assignments.filter(a =>
        !getSubmissionForAssignment(a.id) ||
        getSubmissionForAssignment(a.id)?.status === 'REJECTED'
    )

    const submittedAssignments = assignments.filter(a => {
        const submission = getSubmissionForAssignment(a.id)
        return submission && ['SUBMITTED', 'VERIFIED'].includes(submission.status)
    })

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
                <p className="text-muted-foreground">
                    View and submit work for your assignments
                </p>
            </div>

            {/* Pending Assignments */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-500" />
                        Pending Work
                    </CardTitle>
                    <CardDescription>
                        Assignments that need your attention
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {pendingAssignments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No pending assignments!
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {pendingAssignments.map((assignment) => {
                                const submission = getSubmissionForAssignment(assignment.id)
                                return (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <ClipboardList className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{assignment.responsibility?.title || 'Assignment'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {assignment.dueDate
                                                        ? `Due: ${new Date(assignment.dueDate).toLocaleDateString()}`
                                                        : 'No due date'
                                                    }
                                                </p>
                                                {submission?.status === 'REJECTED' && (
                                                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-sm">
                                                        <p className="text-red-700 dark:text-red-400 font-medium">Rejected</p>
                                                        {submission.rejectionReason && (
                                                            <p className="text-red-600 dark:text-red-400 mt-1">
                                                                {submission.rejectionReason}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <AssignmentStatusBadge status={assignment.status} />
                                            <Button
                                                onClick={() => {
                                                    setSelectedAssignment(assignment)
                                                    setSubmitDialogOpen(true)
                                                }}
                                            >
                                                <Send className="h-4 w-4 mr-2" />
                                                {submission?.status === 'REJECTED' ? 'Resubmit' : 'Submit Work'}
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Submitted/Verified Assignments */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-green-500" />
                        Completed Submissions
                    </CardTitle>
                    <CardDescription>
                        Work you have already submitted
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {submittedAssignments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No completed submissions yet
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {submittedAssignments.map((assignment) => {
                                const submission = getSubmissionForAssignment(assignment.id)
                                return (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                                <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{assignment.responsibility?.title || 'Assignment'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Submitted: {submission ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        {submission && <SubmissionStatusBadge status={submission.status} />}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Submit Dialog */}
            <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Submit Work</DialogTitle>
                        <DialogDescription>
                            {selectedAssignment?.responsibility?.title}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedAssignment?.notes && (
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-1">Instructions:</p>
                                <p className="text-sm text-muted-foreground">{selectedAssignment.notes}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Your Work *</Label>
                            <Textarea
                                placeholder="Describe your completed work, include any relevant details or references..."
                                value={workContent}
                                onChange={(e) => setWorkContent(e.target.value)}
                                rows={8}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Work"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

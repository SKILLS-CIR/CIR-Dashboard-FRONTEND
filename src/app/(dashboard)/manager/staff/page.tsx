"use client"

import { useEffect, useState, useMemo } from "react"
import { api } from "@/lib/api"
import { Employee, WorkSubmission } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RoleBadge, SubmissionStatusBadge } from "@/components/ui/status-badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { 
    Search, 
    User, 
    Mail, 
    Building,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    ArrowLeft,
    FileText,
    Link2,
    MessageSquare,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

export default function ManagerStaffPage() {
    const [staff, setStaff] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    
    // Staff detail view
    const [selectedStaff, setSelectedStaff] = useState<Employee | null>(null)
    const [staffSubmissions, setStaffSubmissions] = useState<WorkSubmission[]>([])
    const [loadingSubmissions, setLoadingSubmissions] = useState(false)
    
    // Review dialog
    const [selectedSubmission, setSelectedSubmission] = useState<WorkSubmission | null>(null)
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")
    const [isVerifying, setIsVerifying] = useState(false)

    useEffect(() => {
        fetchStaff()
    }, [])

    async function fetchStaff() {
        try {
            const employees = await api.employees.getAll()
            // Backend already scopes to sub-department, filter for STAFF role
            setStaff(employees.filter(e => e.role === 'STAFF'))
        } catch (error) {
            console.error("Failed to fetch staff:", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function fetchStaffSubmissions(staffId: string) {
        setLoadingSubmissions(true)
        try {
            const allSubmissions = await api.workSubmissions.getAll()
            // Filter submissions for this staff member
            const staffSubs = allSubmissions.filter(s => s.employeeId === staffId)
            setStaffSubmissions(staffSubs)
        } catch (error) {
            console.error("Failed to fetch submissions:", error)
            toast.error("Failed to load submissions")
        } finally {
            setLoadingSubmissions(false)
        }
    }

    function handleStaffClick(member: Employee) {
        setSelectedStaff(member)
        fetchStaffSubmissions(member.id)
    }

    function handleBackToList() {
        setSelectedStaff(null)
        setStaffSubmissions([])
    }

    // Group submissions by status
    const groupedSubmissions = useMemo(() => {
        const pending = staffSubmissions.filter(s => s.status === 'SUBMITTED' || s.status === 'PENDING')
        const approved = staffSubmissions.filter(s => s.status === 'VERIFIED')
        const rejected = staffSubmissions.filter(s => s.status === 'REJECTED')
        return { pending, approved, rejected }
    }, [staffSubmissions])

    async function handleVerify(status: 'VERIFIED' | 'REJECTED') {
        if (!selectedSubmission) return

        if (status === 'REJECTED' && !rejectionReason.trim()) {
            toast.error("Rejection reason is required")
            return
        }

        setIsVerifying(true)
        try {
            await api.workSubmissions.verify(selectedSubmission.id, {
                status,
                rejectionReason: status === 'REJECTED' ? rejectionReason.trim() : undefined,
            })
            toast.success(`Submission ${status === 'VERIFIED' ? 'approved' : 'rejected'} successfully`)
            setReviewDialogOpen(false)
            setSelectedSubmission(null)
            setRejectionReason("")
            if (selectedStaff) {
                fetchStaffSubmissions(selectedStaff.id)
            }
        } catch (error: any) {
            console.error("Failed to verify submission:", error)
            toast.error(error.message || "Failed to verify submission")
        } finally {
            setIsVerifying(false)
        }
    }

    function openReviewDialog(submission: WorkSubmission) {
        setSelectedSubmission(submission)
        setRejectionReason("")
        setReviewDialogOpen(true)
    }

    const filteredStaff = staff.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const SubmissionTable = ({ data, showActions = true }: { data: WorkSubmission[], showActions?: boolean }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Responsibility</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No submissions found
                        </TableCell>
                    </TableRow>
                ) : (
                    data.map((submission) => (
                        <TableRow key={submission.id}>
                            <TableCell className="font-medium">
                                {submission.assignment?.responsibility?.title || 'N/A'}
                            </TableCell>
                            <TableCell>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {(submission as any).hoursWorked || '-'}h
                                </span>
                            </TableCell>
                            <TableCell>
                                {format(new Date(submission.submittedAt), "MMM d, h:mm a")}
                            </TableCell>
                            <TableCell>
                                <SubmissionStatusBadge status={submission.status} />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openReviewDialog(submission)}
                                    >
                                        <Eye className="h-4 w-4 mr-1" /> Review
                                    </Button>
                                    {showActions && (submission.status === 'SUBMITTED' || submission.status === 'PENDING') && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
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
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => openReviewDialog(submission)}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    // Staff Detail View
    if (selectedStaff) {
        return (
            <div className="p-6 space-y-6">
                {/* Back Button and Header */}
                <div>
                    <Button variant="ghost" size="sm" onClick={handleBackToList} className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Staff List
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">{selectedStaff.name}</h1>
                    <p className="text-muted-foreground">Staff member details and submissions</p>
                </div>

                {/* Staff Info Card */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-6">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-8 w-8 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedStaff.email}</span>
                                </div>
                                {selectedStaff.subDepartment && (
                                    <div className="flex items-center gap-2">
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedStaff.subDepartment.name}</span>
                                    </div>
                                )}
                                <RoleBadge role={selectedStaff.role} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Submissions Tabs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Submissions</CardTitle>
                        <CardDescription>
                            {staffSubmissions.length} total submission{staffSubmissions.length !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingSubmissions ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <Tabs defaultValue="pending">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="pending" className="gap-2">
                                        Pending
                                        {groupedSubmissions.pending.length > 0 && (
                                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">
                                                {groupedSubmissions.pending.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="approved" className="gap-2">
                                        Approved
                                        {groupedSubmissions.approved.length > 0 && (
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                                                {groupedSubmissions.approved.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="rejected" className="gap-2">
                                        Rejected
                                        {groupedSubmissions.rejected.length > 0 && (
                                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                                                {groupedSubmissions.rejected.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="pending">
                                    <SubmissionTable data={groupedSubmissions.pending} />
                                </TabsContent>

                                <TabsContent value="approved">
                                    <SubmissionTable data={groupedSubmissions.approved} showActions={false} />
                                </TabsContent>

                                <TabsContent value="rejected">
                                    <SubmissionTable data={groupedSubmissions.rejected} showActions={false} />
                                </TabsContent>
                            </Tabs>
                        )}
                    </CardContent>
                </Card>

                {/* Review Dialog */}
                <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Review Submission</DialogTitle>
                            <DialogDescription>
                                {selectedSubmission?.assignment?.responsibility?.title}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedSubmission && (
                            <div className="space-y-4">
                                {/* Submission Info */}
                                <div className="text-sm text-muted-foreground border-b pb-3">
                                    Submitted: {format(new Date(selectedSubmission.submittedAt), "PPP 'at' h:mm a")}
                                </div>

                                {/* Hours Worked */}
                                {(selectedSubmission as any).hoursWorked && (
                                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Hours Worked:</span>
                                        <span>{(selectedSubmission as any).hoursWorked} hours</span>
                                    </div>
                                )}

                                {/* Staff Comment */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <MessageSquare className="h-4 w-4" />
                                        Staff Comments:
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="whitespace-pre-wrap">
                                            {(selectedSubmission as any).staffComment || selectedSubmission.content || 'No comments provided'}
                                        </p>
                                    </div>
                                </div>

                                {/* Work Proof */}
                                {((selectedSubmission as any).workProofUrl || (selectedSubmission as any).workProofText || (selectedSubmission.attachments && selectedSubmission.attachments.length > 0)) && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <FileText className="h-4 w-4" />
                                            Work Proof:
                                        </div>
                                        <div className="p-4 bg-muted rounded-lg">
                                            {(selectedSubmission as any).workProofText && (
                                                <p className="whitespace-pre-wrap">{(selectedSubmission as any).workProofText}</p>
                                            )}
                                            {(selectedSubmission as any).workProofUrl && (
                                                <a 
                                                    href={(selectedSubmission as any).workProofUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    <Link2 className="h-4 w-4" />
                                                    View attachment
                                                </a>
                                            )}
                                            {selectedSubmission.attachments?.map((attachment, idx) => (
                                                <a 
                                                    key={idx}
                                                    href={attachment} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    <Link2 className="h-4 w-4" />
                                                    Attachment {idx + 1}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Rejection Reason (for rejected) */}
                                {selectedSubmission.status === 'REJECTED' && selectedSubmission.rejectionReason && (
                                    <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                                            Rejection Reason:
                                        </p>
                                        <p className="text-red-600 dark:text-red-300">
                                            {selectedSubmission.rejectionReason}
                                        </p>
                                    </div>
                                )}

                                {/* Rejection Reason Input */}
                                {(selectedSubmission.status === 'SUBMITTED' || selectedSubmission.status === 'PENDING') && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Rejection Reason <span className="text-red-500">*</span>
                                            <span className="text-muted-foreground font-normal"> (required if rejecting)</span>
                                        </label>
                                        <Textarea
                                            placeholder="Provide feedback on why this submission is being rejected..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                                Cancel
                            </Button>
                            {selectedSubmission && (selectedSubmission.status === 'SUBMITTED' || selectedSubmission.status === 'PENDING') && (
                                <>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleVerify('REJECTED')}
                                        disabled={isVerifying || !rejectionReason.trim()}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" /> Reject
                                    </Button>
                                    <Button
                                        onClick={() => handleVerify('VERIFIED')}
                                        disabled={isVerifying}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" /> Approve
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    // Staff List View
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Staff</h1>
                <p className="text-muted-foreground">
                    View staff members and their work submissions
                </p>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Staff List */}
            <Card>
                <CardHeader>
                    <CardTitle>Staff Members</CardTitle>
                    <CardDescription>
                        {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''} - Click to view submissions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredStaff.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No staff members found
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredStaff.map((member) => (
                                <Card 
                                    key={member.id} 
                                    className="p-4 cursor-pointer hover:shadow-md transition-shadow hover:border-primary"
                                    onClick={() => handleStaffClick(member)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{member.name}</p>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                                <Mail className="h-3 w-3" />
                                                <span className="truncate">{member.email}</span>
                                            </div>
                                            {member.subDepartment && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                    <Building className="h-3 w-3" />
                                                    <span className="truncate">{member.subDepartment.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

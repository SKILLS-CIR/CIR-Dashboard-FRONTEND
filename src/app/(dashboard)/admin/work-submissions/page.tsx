"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { WorkSubmission } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, Eye } from "lucide-react"

export default function AdminWorkSubmissionsPage() {
    const [submissions, setSubmissions] = useState<WorkSubmission[]>([])
    const [filteredSubmissions, setFilteredSubmissions] = useState<WorkSubmission[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    useEffect(() => {
        async function fetchSubmissions() {
            try {
                const data = await api.workSubmissions.getAll()
                setSubmissions(data)
                setFilteredSubmissions(data)
            } catch (error) {
                console.error("Failed to fetch submissions:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSubmissions()
    }, [])

    useEffect(() => {
        let filtered = submissions

        if (searchQuery) {
            filtered = filtered.filter(s =>
                s.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.assignment?.responsibility?.title?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(s => s.status === statusFilter)
        }

        setFilteredSubmissions(filtered)
    }, [searchQuery, statusFilter, submissions])

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
                    View all work submissions across the system
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by employee or responsibility..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                <SelectItem value="VERIFIED">Verified</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Submissions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Submissions</CardTitle>
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
                                    <TableHead>Employee</TableHead>
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
                                            <Button variant="ghost" size="sm">
                                                <Eye className="h-4 w-4 mr-1" /> View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

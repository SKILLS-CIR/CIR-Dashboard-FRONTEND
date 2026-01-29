"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/components/providers/auth-context"
import { api } from "@/lib/api"
import { Employee, Assignment, WorkSubmission, Responsibility, SubDepartment } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SubmissionStatusBadge } from "@/components/ui/status-badge"
import { CreateResponsibilityDialog } from "@/components/manager/create-responsibility-dialog"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Users,
    ClipboardList,
    FileCheck,
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight,
    Plus,
    Briefcase,
    BarChart3,
    TrendingUp,
    Target,
    Activity,
    Calendar as CalendarIcon,
    Award,
    AlertCircle,
} from "lucide-react"
import { getSubmissionsForDate, getToday } from "@/lib/responsibility-status"
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement, Filler } from 'chart.js'
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement, Filler)

type DateRange = {
    from: Date
    to: Date
}

export default function ManagerDashboardPage() {
    const { user } = useAuth()
    const [pendingSubmissions, setPendingSubmissions] = useState<WorkSubmission[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [submissions, setSubmissions] = useState<WorkSubmission[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [staffList, setStaffList] = useState<Employee[]>([])
    const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
    const [subDepartment, setSubDepartment] = useState<SubDepartment | null>(null)
    const [selectedStaffId, setSelectedStaffId] = useState<string>("all")
    const [selectedResponsibilityId, setSelectedResponsibilityId] = useState<string>("all")
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })
    
    const today = useMemo(() => getToday(), [])

    // SINGLE unified data fetching function
    useEffect(() => {
        async function fetchData() {
            if (!user?.subDepartmentId) return
            
            try {
                setIsLoading(true)
                const [allSubmissions, allAssignments, allEmployees, allResponsibilities, allSubDepts] = await Promise.all([
                    api.workSubmissions.getAll(),
                    api.assignments.getAll(),
                    api.employees.getAll(),
                    api.responsibilities.getAll(),
                    api.subDepartments.getAll(),
                ])
                
                // Get manager's sub-department
                const managerSubDept = allSubDepts.find(sd => String(sd.id) === String(user.subDepartmentId))
                setSubDepartment(managerSubDept || null)
                
                // Filter staff in manager's sub-department
                const deptStaff = allEmployees.filter(e => 
                    String(e.subDepartmentId) === String(user.subDepartmentId) && e.role === 'STAFF'
                )
                setStaffList(deptStaff)
                
                // Get staff IDs
                const staffIds = deptStaff.map(s => String(s.id))
                
                // Filter submissions and assignments for staff in this sub-department
                const deptSubmissions = allSubmissions.filter(s => staffIds.includes(String(s.staffId)))
                setSubmissions(deptSubmissions)
                setAssignments(allAssignments.filter(a => staffIds.includes(String(a.staffId))))
                
                // Filter responsibilities for this sub-department
                setResponsibilities(allResponsibilities.filter(r => 
                    String(r.subDepartmentId) === String(user.subDepartmentId)
                ))

                // Get pending submissions (SUBMITTED status)
                const allPending = deptSubmissions.filter(s => 
                    s.status === 'SUBMITTED' || s.assignment?.status === 'SUBMITTED'
                )
                setPendingSubmissions(allPending.slice(0, 5))

            } catch (error) {
                console.error("Failed to fetch analytics data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [user])

    // Filter by date and optionally by selected staff
    const filteredSubmissions = useMemo(() => {
        return submissions.filter(s => {
            const date = new Date(s.workDate || s.submittedAt)
            const inDateRange = date >= dateRange.from && date <= dateRange.to
            const matchesStaff = selectedStaffId === "all" || String(s.staffId) === selectedStaffId
            return inDateRange && matchesStaff
        })
    }, [submissions, dateRange, selectedStaffId])

    // Filter by responsibility
    const filteredByResponsibility = useMemo(() => {
        if (selectedResponsibilityId === "all") return filteredSubmissions
        return filteredSubmissions.filter(s => {
            const assignment = assignments.find(a => String(a.id) === String(s.assignmentId))
            return assignment && String(assignment.responsibilityId) === selectedResponsibilityId
        })
    }, [filteredSubmissions, selectedResponsibilityId, assignments])

    // Dashboard stats (for top cards - based on TODAY only)
    const dashboardStats = useMemo(() => {
        const todaySubmissions = getSubmissionsForDate(submissions, today)
        
        return {
            teamSize: staffList.length,
            totalAssignments: assignments.length,
            pendingVerifications: todaySubmissions.filter(s => 
                s.status === 'SUBMITTED' || s.assignment?.status === 'SUBMITTED'
            ).length,
            verifiedCount: todaySubmissions.filter(s => 
                s.status === 'VERIFIED' || s.assignment?.status === 'VERIFIED'
            ).length,
            rejectedCount: todaySubmissions.filter(s => 
                s.status === 'REJECTED' || s.assignment?.status === 'REJECTED'
            ).length,
        }
    }, [submissions, staffList, assignments, today])

    // Analytics stats (for charts - based on filtered date range)
    const analyticsStats = useMemo(() => {
        const total = filteredSubmissions.length
        const verified = filteredSubmissions.filter(s => s.status === 'VERIFIED').length
        const pending = filteredSubmissions.filter(s => s.status === 'SUBMITTED' || s.status === 'PENDING').length
        const rejected = filteredSubmissions.filter(s => s.status === 'REJECTED').length
        const totalHours = filteredSubmissions.reduce((sum, s) => sum + ((s as any).hoursWorked || 0), 0)
        const verifiedHours = filteredSubmissions
            .filter(s => s.status === 'VERIFIED')
            .reduce((sum, s) => sum + ((s as any).hoursWorked || 0), 0)
        const approvalRate = total > 0 ? Math.round((verified / total) * 100) : 0
        
        return { total, verified, pending, rejected, totalHours, verifiedHours, approvalRate }
    }, [filteredSubmissions])

    // Per-staff stats
    const staffStats = useMemo(() => {
        return staffList.map(staff => {
            const staffSubmissions = filteredSubmissions.filter(s => String(s.staffId) === String(staff.id))
            const verified = staffSubmissions.filter(s => s.status === 'VERIFIED').length
            const pending = staffSubmissions.filter(s => s.status === 'SUBMITTED' || s.status === 'PENDING').length
            const rejected = staffSubmissions.filter(s => s.status === 'REJECTED').length
            const hours = staffSubmissions
                .filter(s => s.status === 'VERIFIED')
                .reduce((sum, s) => sum + ((s as any).hoursWorked || 0), 0)
            const approvalRate = staffSubmissions.length > 0 ? Math.round((verified / staffSubmissions.length) * 100) : 0
            
            return {
                ...staff,
                total: staffSubmissions.length,
                verified,
                pending,
                rejected,
                hours: Math.round(hours * 10) / 10,
                approvalRate,
            }
        }).sort((a, b) => b.total - a.total)
    }, [staffList, filteredSubmissions])

    // Daily data for charts
    const dailyData = useMemo(() => {
        const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
        
        return days.map(day => {
            const daySubmissions = filteredSubmissions.filter(s => 
                isSameDay(new Date(s.workDate || s.submittedAt), day)
            )
            const verified = daySubmissions.filter(s => s.status === 'VERIFIED').length
            const pending = daySubmissions.filter(s => s.status === 'SUBMITTED' || s.status === 'PENDING').length
            const rejected = daySubmissions.filter(s => s.status === 'REJECTED').length
            const hours = daySubmissions.reduce((sum, s) => sum + ((s as any).hoursWorked || 0), 0)
            
            return {
                date: format(day, 'MMM d'),
                fullDate: format(day, 'yyyy-MM-dd'),
                submissions: daySubmissions.length,
                verified,
                pending,
                rejected,
                hours: Math.round(hours * 10) / 10,
            }
        })
    }, [filteredSubmissions, dateRange])

    // Responsibility stats
    const responsibilityStats = useMemo(() => {
        return responsibilities.map(resp => {
            const respAssignments = assignments.filter(a => String(a.responsibilityId) === String(resp.id))
            const assignedStaff = new Set(respAssignments.map(a => String(a.staffId))).size
            const respSubmissions = filteredSubmissions.filter(s => 
                respAssignments.some(a => String(a.id) === String(s.assignmentId))
            )
            const verified = respSubmissions.filter(s => s.status === 'VERIFIED').length
            const pending = respSubmissions.filter(s => s.status === 'SUBMITTED' || s.status === 'PENDING').length
            const rejected = respSubmissions.filter(s => s.status === 'REJECTED').length
            
            return {
                ...resp,
                assignedStaff,
                totalSubmissions: respSubmissions.length,
                verified,
                pending,
                rejected,
                completionRate: respSubmissions.length > 0 ? Math.round((verified / respSubmissions.length) * 100) : 0,
            }
        }).sort((a, b) => b.totalSubmissions - a.totalSubmissions)
    }, [responsibilities, assignments, filteredSubmissions])

    // Chart Data
    const statusPieData = {
        labels: ['Verified', 'Pending', 'Rejected'],
        datasets: [{
            data: [analyticsStats.verified, analyticsStats.pending, analyticsStats.rejected],
            backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(239, 68, 68, 0.8)'],
            borderColor: ['rgba(34, 197, 94, 1)', 'rgba(251, 191, 36, 1)', 'rgba(239, 68, 68, 1)'],
            borderWidth: 2,
            hoverOffset: 8,
        }]
    }

    const dailySubmissionsData = {
        labels: dailyData.map(d => d.date),
        datasets: [{
            label: 'Total Submissions',
            data: dailyData.map(d => d.submissions),
            borderColor: 'rgba(99, 102, 241, 1)',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
        }, {
            label: 'Verified',
            data: dailyData.map(d => d.verified),
            borderColor: 'rgba(34, 197, 94, 1)',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
        }]
    }

    const staffComparisonData = {
        labels: staffStats.slice(0, 10).map(s => s.name.split(' ')[0]),
        datasets: [{
            label: 'Verified',
            data: staffStats.slice(0, 10).map(s => s.verified),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderRadius: 4,
        }, {
            label: 'Pending',
            data: staffStats.slice(0, 10).map(s => s.pending),
            backgroundColor: 'rgba(251, 191, 36, 0.8)',
            borderRadius: 4,
        }, {
            label: 'Rejected',
            data: staffStats.slice(0, 10).map(s => s.rejected),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderRadius: 4,
        }]
    }

    const hoursChartData = {
        labels: dailyData.map(d => d.date),
        datasets: [{
            label: 'Hours Worked',
            data: dailyData.map(d => d.hours),
            borderColor: 'rgba(139, 92, 246, 1)',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
        }]
    }

    // Staff Performance Analytics Charts
    const staffDistributionData = {
        labels: staffStats.slice(0, 8).map(s => s.name.split(' ')[0]),
        datasets: [{
            label: 'Total Submissions',
            data: staffStats.slice(0, 8).map(s => s.total),
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(99, 102, 241, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(168, 85, 247, 0.8)',
                'rgba(236, 72, 153, 0.8)',
                'rgba(244, 63, 94, 0.8)',
                'rgba(251, 146, 60, 0.8)',
                'rgba(34, 197, 94, 0.8)',
            ],
            borderWidth: 2,
            hoverOffset: 8,
        }]
    }

    const staffHoursData = {
        labels: staffStats.slice(0, 10).map(s => s.name.split(' ')[0]),
        datasets: [{
            label: 'Verified Hours',
            data: staffStats.slice(0, 10).map(s => s.hours),
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 2,
            borderRadius: 6,
        }]
    }

    const staffApprovalData = {
        labels: staffStats.map(s => s.name.split(' ')[0]),
        datasets: [{
            label: 'Approval Rate (%)',
            data: staffStats.map(s => s.approvalRate),
            borderColor: 'rgba(34, 197, 94, 1)',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: staffStats.map(s => 
                s.approvalRate >= 80 ? 'rgba(34, 197, 94, 1)' : 
                s.approvalRate >= 50 ? 'rgba(251, 191, 36, 1)' : 
                'rgba(239, 68, 68, 1)'
            ),
        }]
    }

    // Responsibility Analytics Charts
    const responsibilityDistributionData = {
        labels: responsibilityStats.slice(0, 6).map(r => r.title.length > 15 ? r.title.substring(0, 15) + '...' : r.title),
        datasets: [{
            label: 'Submissions',
            data: responsibilityStats.slice(0, 6).map(r => r.totalSubmissions),
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(236, 72, 153, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(251, 191, 36, 0.8)',
                'rgba(239, 68, 68, 0.8)',
            ],
            borderWidth: 2,
            hoverOffset: 8,
        }]
    }

    const responsibilityStatusData = {
        labels: responsibilityStats.slice(0, 8).map(r => r.title.length > 12 ? r.title.substring(0, 12) + '...' : r.title),
        datasets: [{
            label: 'Verified',
            data: responsibilityStats.slice(0, 8).map(r => r.verified),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderRadius: 4,
        }, {
            label: 'Pending',
            data: responsibilityStats.slice(0, 8).map(r => r.pending),
            backgroundColor: 'rgba(251, 191, 36, 0.8)',
            borderRadius: 4,
        }, {
            label: 'Rejected',
            data: responsibilityStats.slice(0, 8).map(r => r.rejected),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderRadius: 4,
        }]
    }

    const responsibilityCompletionData = {
        labels: responsibilityStats.map(r => r.title.length > 12 ? r.title.substring(0, 12) + '...' : r.title),
        datasets: [{
            label: 'Completion Rate (%)',
            data: responsibilityStats.map(r => r.completionRate),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: responsibilityStats.map(r => 
                r.completionRate >= 80 ? 'rgba(34, 197, 94, 1)' : 
                r.completionRate >= 50 ? 'rgba(251, 191, 36, 1)' : 
                'rgba(239, 68, 68, 1)'
            ),
        }]
    }

    // Chart Options
    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' as const, labels: { padding: 20, usePointStyle: true } },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                callbacks: {
                    label: function(context: any) {
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                        const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0
                        return `${context.label}: ${context.raw} (${percentage}%)`
                    }
                }
            },
        },
    }

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const, labels: { padding: 15, usePointStyle: true } },
            tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', padding: 12, mode: 'index' as const, intersect: false },
        },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
        },
        interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
    }

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const, labels: { padding: 15, usePointStyle: true } },
            tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', padding: 12 },
        },
        scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
        },
    }

    const horizontalBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', padding: 12 },
        },
        scales: {
            x: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
            y: { grid: { display: false } },
        },
    }

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
                <Skeleton className="h-[400px]" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight"> Welcome back, {user?.role|| 'Manager'}👋</h1>
                    <p className="text-muted-foreground">
                     Manage your team's work here.
                    </p>
                </div>
            </div>

            {/* Analytics Header with Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* <div>
                    <h2 className="text-2xl font-bold tracking-tight">Team Analytics</h2>
                    <p className="text-muted-foreground">
                        {subDepartment?.name || 'Sub-Department'} performance metrics and insights
                    </p>
                </div> */}
                <div className="flex items-center gap-2">
                    {/* Staff Filter */}
                    <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                        <SelectTrigger className="w-[180px]">
                            <Users className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Select staff" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Staff</SelectItem>
                            {staffList.map(staff => (
                                <SelectItem key={staff.id} value={String(staff.id)}>
                                    {staff.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Date Range Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <div className="flex gap-2 p-3 border-b">
                                <Button size="sm" variant="outline" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>
                                    7 days
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>
                                    30 days
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>
                                    This Month
                                </Button>
                            </div>
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange.from}
                                selected={dateRange}
                                onSelect={(range) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                                numberOfMonths={1}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Analytics Stats Cards (based on filtered date range) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{staffList.length}</div>
                        <p className="text-xs text-muted-foreground">Active in sub-department</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">{analyticsStats.total}</div>
                        <p className="text-xs text-muted-foreground">{analyticsStats.totalHours.toFixed(1)} hours logged</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{analyticsStats.approvalRate}%</div>
                        <p className="text-xs text-muted-foreground">{analyticsStats.verified} verified of {analyticsStats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{analyticsStats.pending}</div>
                        <p className="text-xs text-muted-foreground">Awaiting verification</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verified Hours</CardTitle>
                        <FileCheck className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{analyticsStats.verifiedHours.toFixed(1)}h</div>
                        <p className="text-xs text-muted-foreground">Approved work hours</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="gap-2">
                        <Users className="h-4 w-4" />
                        Staff Performance
                    </TabsTrigger>
                    <TabsTrigger value="responsibilities" className="gap-2">
                        <Briefcase className="h-4 w-4" />
                        Responsibilities
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-indigo-500" />
                                    Daily Submissions
                                </CardTitle>
                                <CardDescription>Submissions trend over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <Line data={dailySubmissionsData} options={lineChartOptions} />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-green-500" />
                                    Status Distribution
                                </CardTitle>
                                <CardDescription>Breakdown by submission status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    {analyticsStats.total > 0 ? (
                                        <Doughnut data={statusPieData} options={pieChartOptions} />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-muted-foreground">
                                            No submissions in selected period
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-purple-500" />
                                Hours Trend
                            </CardTitle>
                            <CardDescription>Daily hours worked</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <Line data={hoursChartData} options={lineChartOptions} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Staff Performance Tab - ENHANCED */}
                <TabsContent value="staff" className="space-y-4">
                    {/* Top Stats for Staff */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                                <Award className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-yellow-600">
                                    {staffStats[0]?.name.split(' ')[0] || 'N/A'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {staffStats[0]?.total || 0} submissions
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg Approval</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-green-600">
                                    {staffStats.length > 0 ? Math.round(staffStats.reduce((sum, s) => sum + s.approvalRate, 0) / staffStats.length) : 0}%
                                </div>
                                <p className="text-xs text-muted-foreground">Team average</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                                <Clock className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-purple-600">
                                    {staffStats.reduce((sum, s) => sum + s.hours, 0).toFixed(1)}h
                                </div>
                                <p className="text-xs text-muted-foreground">All staff combined</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                                <Users className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-blue-600">
                                    {staffStats.filter(s => s.total > 0).length}
                                </div>
                                <p className="text-xs text-muted-foreground">With submissions</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-500" />
                                    Submission Distribution
                                </CardTitle>
                                <CardDescription>Top performers by submission count</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    {staffStats.length > 0 ? (
                                        <Pie data={staffDistributionData} options={pieChartOptions} />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-muted-foreground">
                                            No staff data available
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-indigo-500" />
                                    Status Breakdown
                                </CardTitle>
                                <CardDescription>Verified, pending, and rejected by staff</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <Bar data={staffComparisonData} options={barChartOptions} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-purple-500" />
                                    Hours Worked
                                </CardTitle>
                                <CardDescription>Verified hours by staff member</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <Bar data={staffHoursData} options={horizontalBarOptions} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    Approval Rates
                                </CardTitle>
                                <CardDescription>Approval rate trend across staff</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <Line data={staffApprovalData} options={lineChartOptions} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Staff Details Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Staff Details</CardTitle>
                            <CardDescription>Individual performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-3">
                                    {staffStats.map((staff, index) => (
                                        <div 
                                            key={staff.id} 
                                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                                        {staff.name.charAt(0)}
                                                    </div>
                                                    {index < 3 && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center text-xs font-bold">
                                                            {index + 1}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{staff.name}</p>
                                                    <p className="text-sm text-muted-foreground">{staff.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-center">
                                                    <p className="text-lg font-semibold">{staff.total}</p>
                                                    <p className="text-xs text-muted-foreground">Submissions</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        {/* <CheckCircle className="h-3 w-3 mr-1" /> */}
                                                        VERIFIED: 
                                                        {staff.verified}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                        {/* <Clock className="h-3 w-3 mr-1" /> */}
                                                        NOT VERIFIED: 
                                                        {staff.pending}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                        {/* <XCircle className="h-3 w-3 mr-1" /> */}
                                                        REJECTED: 
                                                        {staff.rejected}
                                                    </Badge>
                                                </div>
                                                <div className="text-center min-w-[60px]">
                                                    <p className="text-lg font-semibold text-purple-600">Total Hours: {staff.hours}h</p>
                                                    <p className="text-xs text-muted-foreground">Hours</p>
                                                </div>
                                                <div className="text-center min-w-[60px]">
                                                    <p className={`text-lg font-semibold ${staff.approvalRate >= 80 ? 'text-green-600' : staff.approvalRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                        {staff.approvalRate}%
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Approval</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {staffStats.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No staff members found in your sub-department
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Responsibilities Tab - ENHANCED */}
                <TabsContent value="responsibilities" className="space-y-4">
                    {/* Responsibility Filter */}
                    {/* <div className="flex items-center gap-2">
                        <Select value={selectedResponsibilityId} onValueChange={setSelectedResponsibilityId}>
                            <SelectTrigger className="w-[250px]">
                                <Briefcase className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Select responsibility" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Responsibilities</SelectItem>
                                {responsibilities.map(resp => (
                                    <SelectItem key={resp.id} value={String(resp.id)}>
                                        {resp.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div> */}

                    {/* Top Stats for Responsibilities */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                                <Target className="h-4 w-4 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-indigo-600">
                                    {responsibilities.filter(r => r.isActive).length}
                                </div>
                                <p className="text-xs text-muted-foreground">Active responsibilities</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Most Active</CardTitle>
                                <Award className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-yellow-600 truncate">
                                    {responsibilityStats[0]?.title.substring(0, 15) || 'N/A'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {responsibilityStats[0]?.totalSubmissions || 0} submissions
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-green-600">
                                    {responsibilityStats.length > 0 ? Math.round(responsibilityStats.reduce((sum, r) => sum + r.completionRate, 0) / responsibilityStats.length) : 0}%
                                </div>
                                <p className="text-xs text-muted-foreground">Overall average</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Staff Coverage</CardTitle>
                                <Users className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-blue-600">
                                    {responsibilityStats.reduce((sum, r) => sum + r.assignedStaff, 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">Total assignments</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-500" />
                                    Activity Distribution
                                </CardTitle>
                                <CardDescription>Submissions by responsibility</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    {responsibilityStats.length > 0 ? (
                                        <Doughnut data={responsibilityDistributionData} options={pieChartOptions} />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-muted-foreground">
                                            No responsibility data available
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-indigo-500" />
                                    Status Breakdown
                                </CardTitle>
                                <CardDescription>Verified, pending, rejected by task</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <Bar data={responsibilityStatusData} options={barChartOptions} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {/* <Target className="h-5 w-5 text-green-500" /> */}
                                    Completion Rates
                                </CardTitle>
                                <CardDescription>Success rate trend across responsibilities</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <Line data={responsibilityCompletionData} options={lineChartOptions} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Responsibilities Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-indigo-500" />
                                Responsibilities Overview
                            </CardTitle>
                            <CardDescription>Performance by responsibility</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px]">
                                <div className="space-y-3">
                                    {responsibilityStats.map((resp, index) => (
                                        <div 
                                            key={resp.id} 
                                            className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="relative">
                                                        <Target className="h-4 w-4 text-indigo-500" />
                                                        {index < 3 && (
                                                            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-yellow-400 border border-white flex items-center justify-center text-[10px] font-bold">
                                                                {index + 1}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-medium">{resp.title}</span>
                                                </div>
                                                <Badge variant={resp.isActive ? "default" : "secondary"}>
                                                    {resp.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            {resp.description && (
                                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{resp.description}</p>
                                            )}
                                            <div className="grid grid-cols-4 gap-4 text-center">
                                                <div className="p-2 rounded bg-muted">
                                                    <p className="text-lg font-semibold text-blue-600">{resp.assignedStaff}</p>
                                                    <p className="text-xs text-muted-foreground">Assigned</p>
                                                </div>
                                                <div className="p-2 rounded bg-muted">
                                                    <p className="text-lg font-semibold text-indigo-600">{resp.totalSubmissions}</p>
                                                    <p className="text-xs text-muted-foreground">Submissions</p>
                                                </div>
                                                <div className="p-2 rounded bg-muted">
                                                    <p className="text-lg font-semibold text-green-600">{resp.verified}</p>
                                                    <p className="text-xs text-muted-foreground">Verified</p>
                                                </div>
                                                <div className="p-2 rounded bg-muted">
                                                    <p className={`text-lg font-semibold ${resp.completionRate >= 80 ? 'text-green-600' : resp.completionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                        {resp.completionRate}%
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Completion</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {responsibilityStats.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No responsibilities found for your sub-department
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dashboard Stats Cards (based on TODAY) */}
            {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               <p>Todays  Stats: </p>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.pendingVerifications}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting verification (Today)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verified Today</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.verifiedCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Completed verifications
                        </p>
                    </CardContent>
                </Card>
            </div> */}

            {/* Pending Verifications */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Pending Verifications</CardTitle>
                        <CardDescription>Submissions awaiting your review</CardDescription>
                    </div>
                    {dashboardStats.pendingVerifications > 0 && (
                        <Button asChild>
                            <Link href="/manager/submissions">
                                View All <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {pendingSubmissions.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                            <p className="text-muted-foreground">
                                All caught up! No pending verifications.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Review {pendingSubmissions.length} pending submissions in the Submissions section.
                            </p>

                            <Button asChild className="mt-4">
                                <Link href="/manager/submissions" className="flex items-center">
                                    View all submissions
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <Link href="/manager/submissions">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileCheck className="h-5 w-5" />
                                Review Submissions
                            </CardTitle>
                            <CardDescription>
                                Review and approve staff work submissions
                            </CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <Link href="/manager/assignments">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5" />
                                Manage Assignments
                            </CardTitle>
                            <CardDescription>
                                Create and manage work assignments for your team
                            </CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <Link href="/manager/staff">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                My Staff
                            </CardTitle>
                            <CardDescription>
                                View staff members and their submissions
                            </CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <Link href="/manager/responsibilities">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5" />
                                Responsibilities
                            </CardTitle>
                            <CardDescription>
                                Create and manage work responsibilities
                            </CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
            </div>
        </div>
    )
}
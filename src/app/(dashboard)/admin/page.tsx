"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-context"
import { api } from "@/lib/api"
import { Employee, Department, WorkSubmission, SubDepartment, CreateResponsibilityDto } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { SubmissionStatusBadge } from "@/components/ui/status-badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Users,
  Building2,
  FileCheck,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  CalendarIcon,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface DashboardStats {
  totalEmployees: number
  totalDepartments: number
  totalSubmissions: number
  pendingSubmissions: number
  verifiedSubmissions: number
  rejectedSubmissions: number
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalDepartments: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    verifiedSubmissions: 0,
    rejectedSubmissions: 0,
  })
  const [recentSubmissions, setRecentSubmissions] = useState<WorkSubmission[]>([])
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Create Responsibility form state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [cycle, setCycle] = useState("")
  const [selectedSubDepartment, setSelectedSubDepartment] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    // Auto-generate cycle from current month
    const now = new Date()
    setCycle(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const [employees, departments, submissions, subDepts] = await Promise.all([
        api.employees.getAll(),
        api.departments.getAll(),
        api.workSubmissions.getAll(),
        api.subDepartments.getAll(),
      ])

      setStats({
        totalEmployees: employees.length,
        totalDepartments: departments.length,
        totalSubmissions: submissions.length,
        pendingSubmissions: submissions.filter(s => s.status === 'PENDING').length,
        verifiedSubmissions: submissions.filter(s => s.status === 'VERIFIED').length,
        rejectedSubmissions: submissions.filter(s => s.status === 'REJECTED').length,
      })

      setSubDepartments(subDepts)
      // Get recent submissions (last 5)
      setRecentSubmissions(submissions.slice(0, 5))
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function resetForm() {
    setTitle("")
    setDescription("")
    const now = new Date()
    setCycle(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    setSelectedSubDepartment("")
    setStartDate(undefined)
    setEndDate(undefined)
  }

  async function handleCreateResponsibility() {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!cycle.trim() || !/^\d{4}-\d{2}$/.test(cycle)) {
      toast.error("Cycle must be in YYYY-MM format")
      return
    }
    if (!selectedSubDepartment) {
      toast.error("Sub-department is required")
      return
    }
    if (!user?.id) {
      toast.error("User authentication required")
      return
    }

    setIsCreating(true)
    try {
      const payload: CreateResponsibilityDto = {
        title: title.trim(),
        cycle: cycle.trim(),
        createdBy: { connect: { id: parseInt(user.id) } },
        subDepartment: { connect: { id: parseInt(selectedSubDepartment) } },
        description: description.trim() || undefined,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
      }

      await api.responsibilities.create(payload)
      toast.success("Responsibility created successfully")
      setCreateDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error("Failed to create responsibility:", error)
      toast.error(error.message || "Failed to create responsibility")
    } finally {
      setIsCreating(false)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'Admin'}. Here's an overview of the system.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Responsibility
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Responsibility</DialogTitle>
              <DialogDescription>
                Create a responsibility and assign it to a sub-department
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="admin-title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="admin-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Monthly Report Preparation"
                />
              </div>

              {/* Cycle */}
              <div className="space-y-2">
                <Label htmlFor="admin-cycle">
                  Cycle (YYYY-MM) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="admin-cycle"
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                  placeholder="e.g., 2026-01"
                />
              </div>

              {/* Sub-Department */}
              <div className="space-y-2">
                <Label>
                  Sub-Department <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedSubDepartment} onValueChange={setSelectedSubDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sub-department" />
                  </SelectTrigger>
                  <SelectContent>
                    {subDepartments.map((sd) => (
                      <SelectItem key={sd.id} value={sd.id}>
                        {sd.name} {sd.department?.name ? `(${sd.department.name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate ? date < startDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="admin-description">Description (Optional)</Label>
                <Textarea
                  id="admin-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this responsibility entails..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateResponsibility} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Responsibility"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              Active departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Work submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submission Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSubmissions}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedSubmissions}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedSubmissions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Work Submissions</CardTitle>
          <CardDescription>Latest submissions across the system</CardDescription>
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
                      By {submission.staff?.name || 'Unknown'} •
                      {new Date(submission.submittedAt).toLocaleDateString()}
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
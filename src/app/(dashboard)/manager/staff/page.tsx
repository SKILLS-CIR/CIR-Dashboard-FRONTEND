"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Employee } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RoleBadge } from "@/components/ui/status-badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Search, User, Mail } from "lucide-react"

export default function ManagerStaffPage() {
    const [staff, setStaff] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
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

        fetchStaff()
    }, [])

    const filteredStaff = staff.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                <h1 className="text-3xl font-bold tracking-tight">My Team</h1>
                <p className="text-muted-foreground">
                    View staff members in your sub-department
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
                        {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''}
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
                                <Card key={member.id} className="p-4">
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
                                            <RoleBadge role={member.role} className="mt-2" />
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

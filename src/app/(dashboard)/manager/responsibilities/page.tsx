"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Responsibility } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PriorityBadge } from "@/components/ui/status-badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Search, Briefcase } from "lucide-react"

export default function ManagerResponsibilitiesPage() {
    const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        async function fetchResponsibilities() {
            try {
                const data = await api.responsibilities.getAll()
                setResponsibilities(data)
            } catch (error) {
                console.error("Failed to fetch responsibilities:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchResponsibilities()
    }, [])

    const filteredResponsibilities = responsibilities.filter(r =>
        r.title?.toLowerCase().includes(searchQuery.toLowerCase())
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
                <h1 className="text-3xl font-bold tracking-tight">Responsibilities</h1>
                <p className="text-muted-foreground">View available work responsibilities</p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search responsibilities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Available Responsibilities</CardTitle>
                    <CardDescription>
                        {filteredResponsibilities.length} responsibilit{filteredResponsibilities.length !== 1 ? 'ies' : 'y'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredResponsibilities.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No responsibilities found</p>
                    ) : (
                        <div className="space-y-4">
                            {filteredResponsibilities.map((resp) => (
                                <div key={resp.id} className="flex items-start gap-4 p-4 border rounded-lg">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium">{resp.title}</p>
                                            <PriorityBadge priority={resp.priority} />
                                        </div>
                                        {resp.description && (
                                            <p className="text-sm text-muted-foreground">{resp.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

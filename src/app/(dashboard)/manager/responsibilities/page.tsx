"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Responsibility } from "@/types/cir"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CreateResponsibilityDialog } from "@/components/manager/create-responsibility-dialog"
import { Search, Briefcase, Calendar } from "lucide-react"
import { format } from "date-fns"

export default function ManagerResponsibilitiesPage() {
    const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

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

    useEffect(() => {
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Responsibilities</h1>
                    <p className="text-muted-foreground">Manage work responsibilities for your sub-department</p>
                </div>
                <CreateResponsibilityDialog onSuccess={fetchResponsibilities} />
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
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No responsibilities found</p>
                            <CreateResponsibilityDialog 
                                onSuccess={fetchResponsibilities}
                                triggerButton={
                                    <span className="text-primary underline cursor-pointer">
                                        Create your first responsibility
                                    </span>
                                }
                            />
                        </div>
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
                                            {resp.cycle && (
                                                <Badge variant="outline">{resp.cycle}</Badge>
                                            )}
                                        </div>
                                        {resp.description && (
                                            <p className="text-sm text-muted-foreground">{resp.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            {resp.cycle && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Cycle: {resp.cycle}
                                                </span>
                                            )}
                                            {resp.startDate && resp.endDate && (
                                                <span>
                                                    {format(new Date(resp.startDate), "MMM d")} - {format(new Date(resp.endDate), "MMM d, yyyy")}
                                                </span>
                                            )}
                                        </div>
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

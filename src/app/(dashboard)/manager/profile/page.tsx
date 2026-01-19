"use client"

import { useAuth } from "@/components/providers/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RoleBadge } from "@/components/ui/status-badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Building2, Key } from "lucide-react"
import { useState } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"

export default function ProfilePage() {
    const { user, role } = useAuth()
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    async function handleChangePassword() {
        if (newPassword !== confirmPassword) {
            toast.error("New passwords don't match")
            return
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }
        setIsLoading(true)
        try {
            await api.employees.changePassword({ currentPassword, newPassword })
            toast.success("Password changed successfully")
            setIsChangingPassword(false)
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch {
            toast.error("Failed to change password")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">Manage your account settings</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">{user?.name || 'User'}</h3>
                            {role && <RoleBadge role={role} className="mt-1" />}
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{user?.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Security</CardTitle>
                </CardHeader>
                <CardContent>
                    {!isChangingPassword ? (
                        <Button onClick={() => setIsChangingPassword(true)}>Change Password</Button>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Current Password</Label>
                                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                                <Button onClick={handleChangePassword} disabled={isLoading}>{isLoading ? "Saving..." : "Save"}</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

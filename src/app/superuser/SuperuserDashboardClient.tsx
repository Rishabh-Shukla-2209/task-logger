"use client"

import { useState } from "react"
import { Role } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, KeyRound, ShieldAlert, Check, X, Loader2 } from "lucide-react"
import { createUser, toggleUserStatus, updateUserRole, resetUserPassword } from "@/actions/superuser"
import { handleError } from "@/lib/errorHandler"
import { toast } from "sonner"

export function SuperuserDashboardClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await createUser(formData)
      toast.success("User created successfully")
      setIsCreateOpen(false)
      // Hard refresh to fetch updated list if needed, or rely on router.refresh
      window.location.reload()
    } catch (err) {
      handleError(err, "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoadingId(userId)
    try {
      await toggleUserStatus(userId, !currentStatus)
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`)
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u))
    } catch (err) {
      handleError(err, "Failed to update status")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoadingId(userId)
    try {
      await updateUserRole(userId, newRole as Role)
      toast.success("Role updated successfully")
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err) {
      handleError(err, "Failed to update role")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt("Enter new password for this user:")
    if (!newPassword) return
    
    setActionLoadingId(userId)
    try {
      await resetUserPassword(userId, newPassword)
      toast.success("Password reset successfully")
    } catch (err) {
      handleError(err, "Failed to reset password")
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> Add New User
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input name="username" required placeholder="john.doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Temporary Password</label>
                <Input name="password" required type="password" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select name="role" required defaultValue="EMPLOYEE">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Role).map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  <Select 
                    value={user.role} 
                    onValueChange={(val) => handleRoleChange(user.id, val)}
                    disabled={actionLoadingId === user.id}
                  >
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Role).map(r => (
                        <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {user.is_active ? (
                    <Badge variant="outline" className="text-green-600 bg-green-50">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 bg-red-50">Deactivated</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    title="Reset Password"
                    disabled={actionLoadingId === user.id}
                    onClick={() => handleResetPassword(user.id)}
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={user.is_active ? "outline" : "default"} 
                    size="icon" 
                    className={`h-8 w-8 ${user.is_active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'bg-green-600 hover:bg-green-700'}`}
                    title={user.is_active ? "Deactivate User" : "Activate User"}
                    disabled={actionLoadingId === user.id}
                    onClick={() => handleToggleStatus(user.id, user.is_active)}
                  >
                    {actionLoadingId === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : user.is_active ? (
                      <ShieldAlert className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

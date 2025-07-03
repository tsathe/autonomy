'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { getUsersInInstitution, getCurrentUserProfile, supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/lib/utils'
import { Users, Plus, Edit, Trash2, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface UserManagementProps {}

export function UserManagement({}: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'resident',
    pgyYear: '',
    department: '',
    password: ''
  })

  const queryClient = useQueryClient()

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUserProfile
  })

  // Fetch all users in institution
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['users', currentUser?.institution_id],
    queryFn: () => currentUser?.institution_id ? getUsersInInstitution(currentUser.institution_id) : [],
    enabled: !!currentUser?.institution_id
  })

  // Filter users based on search and role
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = searchTerm === '' || 
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          role: userData.role,
          first_name: userData.firstName,
          last_name: userData.lastName
        }
      })

      if (authError) throw authError

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          pgy_year: userData.role === 'resident' ? parseInt(userData.pgyYear) : null,
          department: userData.department,
          institution_id: currentUser?.institution_id
        })

      if (profileError) throw profileError

      return authData
    },
    onSuccess: () => {
      toast.success('User created successfully')
      setIsAddUserOpen(false)
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        role: 'resident',
        pgyYear: '',
        department: '',
        password: ''
      })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      toast.error(`Failed to create user: ${error.message}`)
    }
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          pgy_year: userData.role === 'resident' ? parseInt(userData.pgyYear) || null : null,
          department: userData.department
        })
        .eq('id', userData.id)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('User updated successfully')
      setIsEditUserOpen(false)
      setSelectedUser(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      toast.error(`Failed to update user: ${error.message}`)
    }
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) throw authError
    },
    onSuccess: () => {
      toast.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      toast.error(`Failed to delete user: ${error.message}`)
    }
  })

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName || !newUser.password) {
      toast.error('Please fill in all required fields')
      return
    }

    if (newUser.role === 'resident' && !newUser.pgyYear) {
      toast.error('PGY Year is required for residents')
      return
    }

    createUserMutation.mutate(newUser)
  }

  const handleEditUser = (user: any) => {
    setSelectedUser({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      pgyYear: user.pgy_year?.toString() || '',
      department: user.department || ''
    })
    setIsEditUserOpen(true)
  }

  const handleUpdateUser = () => {
    if (!selectedUser.firstName || !selectedUser.lastName) {
      toast.error('Please fill in all required fields')
      return
    }

    updateUserMutation.mutate(selectedUser)
  }

  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId)
    }
  }

  const getUserStatusBadge = (user: any) => {
    // Could add logic to determine user status based on recent activity
    return <Badge variant="outline">Active</Badge>
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive',
      faculty: 'default',
      resident: 'secondary'
    } as const

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'outline'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage residents, faculty, and administrators</p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account for the institution</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resident">Resident</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newUser.role === 'resident' && (
                  <div>
                    <Label htmlFor="pgyYear">PGY Year *</Label>
                    <Select value={newUser.pgyYear} onValueChange={(value) => setNewUser({ ...newUser, pgyYear: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">PGY-1</SelectItem>
                        <SelectItem value="2">PGY-2</SelectItem>
                        <SelectItem value="3">PGY-3</SelectItem>
                        <SelectItem value="4">PGY-4</SelectItem>
                        <SelectItem value="5">PGY-5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="resident">Resident</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.filter(u => u.role === 'faculty').length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Residents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.filter(u => u.role === 'resident').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={getAvatarUrl(user)} />
                    <AvatarFallback>
                      {user.first_name[0]}{user.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.first_name} {user.last_name}</span>
                      {getRoleBadge(user.role)}
                      {user.role === 'resident' && user.pgy_year && (
                        <Badge variant="outline">PGY-{user.pgy_year}</Badge>
                      )}
                      {getUserStatusBadge(user)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                      {user.department && ` • ${user.department}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                    disabled={user.id === currentUser?.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name *</Label>
                  <Input
                    id="editFirstName"
                    value={selectedUser.firstName}
                    onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name *</Label>
                  <Input
                    id="editLastName"
                    value={selectedUser.lastName}
                    onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editRole">Role *</Label>
                  <Select value={selectedUser.role} onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resident">Resident</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedUser.role === 'resident' && (
                  <div>
                    <Label htmlFor="editPgyYear">PGY Year</Label>
                    <Select value={selectedUser.pgyYear} onValueChange={(value) => setSelectedUser({ ...selectedUser, pgyYear: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">PGY-1</SelectItem>
                        <SelectItem value="2">PGY-2</SelectItem>
                        <SelectItem value="3">PGY-3</SelectItem>
                        <SelectItem value="4">PGY-4</SelectItem>
                        <SelectItem value="5">PGY-5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="editDepartment">Department</Label>
                <Input
                  id="editDepartment"
                  value={selectedUser.department}
                  onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

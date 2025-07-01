'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { getCurrentUserProfile, supabase, type UserProfile } from '@/lib/supabase'
import { cn, getAvatarUrl } from '@/lib/utils'
import { 
  Menu, 
  X, 
  Home, 
  Inbox, 
  Clock, 
  BarChart3, 
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  LogOut,
  Camera
} from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
  active?: boolean
}

interface SidebarProps {
  items: SidebarItem[]
  activeSection: string
  onSectionChange: (section: string) => void
  onNewEvaluation: () => void
}

export function Sidebar({ items, activeSection, onSectionChange, onNewEvaluation }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const userProfile = await getCurrentUserProfile()
        setCurrentUser(userProfile)
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'faculty': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'resident': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-background border border-border rounded-lg shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-background border-r border-border transition-all duration-300 ease-in-out flex flex-col",
        // Desktop behavior
        "lg:relative lg:translate-x-0",
        // Mobile behavior
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        // Width behavior
        isCollapsed ? "w-16 lg:w-16" : "w-64 lg:w-64"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          {!isCollapsed ? (
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent font-inter">
                Autonomy
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentUser?.role === 'faculty' ? 'Faculty Portal' : 
                 currentUser?.role === 'admin' ? 'Admin Portal' : 'Resident Portal'}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent font-inter">
                A.
              </h2>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* New Evaluation Button */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <Button 
            onClick={onNewEvaluation}
            variant="outline"
            className={cn("w-full", isCollapsed && "px-2")}
            size={isCollapsed ? "sm" : "default"}
          >
            <Plus className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">New Evaluation</span>}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id)
                    setIsMobileOpen(false) // Close mobile menu when item is selected
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation",
                    isActive 
                      ? "bg-muted text-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.count !== undefined && item.count > 0 && (
                        <Badge 
                          variant={isActive ? "outline" : "secondary"}
                          className="h-5 text-xs"
                        >
                          {item.count}
                        </Badge>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* User Section at Bottom */}
        {currentUser && (
          <div className="p-4 border-t border-border flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors",
                  isCollapsed ? "justify-center px-2" : ""
                )}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={getAvatarUrl(currentUser.id)} 
                      alt={`${currentUser.first_name} ${currentUser.last_name}`}
                    />
                    <AvatarFallback className="text-xs">
                      {currentUser.first_name?.[0]}{currentUser.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium truncate">
                        {currentUser.first_name} {currentUser.last_name}
                        {currentUser.pgy_year && (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            PGY-{currentUser.pgy_year}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", getRoleColor(currentUser.role))}>
                          {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={getAvatarUrl(currentUser.id)} 
                      alt={`${currentUser.first_name} ${currentUser.last_name}`}
                    />
                    <AvatarFallback>
                      {currentUser.first_name?.[0]}{currentUser.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {currentUser.first_name} {currentUser.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Camera className="h-4 w-4 mr-2" />
                  Change Avatar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </>
  )
}

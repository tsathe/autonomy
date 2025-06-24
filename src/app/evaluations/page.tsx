'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEvaluations, getCurrentUserProfile } from '@/lib/supabase'
import { Navigation } from '@/components/layout/navigation'
import { EvaluationForm } from '@/components/evaluations/evaluation-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatEntrustmentLevel, formatComplexityLevel, formatDomain, getEntrustmentLevelColor, getComplexityLevelColor } from '@/lib/utils'
import { Plus, Search, Filter, Eye, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { Toaster } from 'sonner'

export default function EvaluationsPage() {
  const [showEvaluationForm, setShowEvaluationForm] = useState(false)
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null)
  const [formMode, setFormMode] = useState<'create' | 'respond' | 'view'>('create')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [complexityFilter, setComplexityFilter] = useState<string>('all')

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUserProfile
  })

  // Fetch evaluations based on user role
  const { data: allEvaluations = [], isLoading } = useQuery({
    queryKey: ['evaluations', currentUser?.id, currentUser?.role],
    queryFn: () => {
      if (!currentUser) return []
      
      if (currentUser.role === 'resident') {
        return getEvaluations({ resident_id: currentUser.id })
      } else if (currentUser.role === 'faculty') {
        return getEvaluations({ faculty_id: currentUser.id })
      } else {
        // Admin sees all evaluations
        return getEvaluations()
      }
    },
    enabled: !!currentUser
  })

  // Filter evaluations
  const filteredEvaluations = allEvaluations.filter(evaluation => {
    // Status filter
    if (statusFilter === 'completed' && !evaluation.is_completed) return false
    if (statusFilter === 'pending' && evaluation.is_completed) return false

    // Complexity filter
    if (complexityFilter !== 'all' && evaluation.complexity !== complexityFilter) return false

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const residentName = `${evaluation.resident?.first_name} ${evaluation.resident?.last_name}`.toLowerCase()
      const facultyName = `${evaluation.faculty?.first_name} ${evaluation.faculty?.last_name}`.toLowerCase()
      const epaTitle = evaluation.epa?.title?.toLowerCase() || ''
      
      if (!residentName.includes(searchLower) && 
          !facultyName.includes(searchLower) && 
          !epaTitle.includes(searchLower)) {
        return false
      }
    }

    return true
  })

  const handleNewEvaluation = () => {
    setSelectedEvaluation(null)
    setFormMode('create')
    setShowEvaluationForm(true)
  }

  const handleRespondToEvaluation = (evaluation: any) => {
    setSelectedEvaluation(evaluation)
    setFormMode('respond')
    setShowEvaluationForm(true)
  }

  const handleViewEvaluation = (evaluation: any) => {
    setSelectedEvaluation(evaluation)
    setFormMode('view')
    setShowEvaluationForm(true)
  }

  const canRespond = (evaluation: any) => {
    if (!currentUser) return false
    
    if (currentUser.role === 'resident') {
      return evaluation.resident_id === currentUser.id && !evaluation.resident_completed_at
    } else if (currentUser.role === 'faculty') {
      return evaluation.faculty_id === currentUser.id && !evaluation.faculty_completed_at
    }
    
    return false
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto py-6">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 w-64 bg-muted rounded mb-4"></div>
              <div className="grid gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Evaluations</h1>
              <p className="text-muted-foreground">
                Manage and track EPA evaluations
              </p>
            </div>
            <Button onClick={handleNewEvaluation}>
              <Plus className="h-4 w-4 mr-2" />
              New Evaluation
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search evaluations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Complexity</label>
                  <Select value={complexityFilter} onValueChange={setComplexityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Complexity</SelectItem>
                      <SelectItem value="straightforward">Straightforward</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="complex">Complex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                      setComplexityFilter('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluations List */}
          <div className="space-y-4">
            {filteredEvaluations.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No evaluations found</h3>
                    <p className="text-muted-foreground">
                      {allEvaluations.length === 0 
                        ? "Get started by creating your first evaluation."
                        : "Try adjusting your filters to see more results."
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredEvaluations.map((evaluation) => (
                <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline" className="font-mono">
                            {evaluation.epa?.code}
                          </Badge>
                          <h3 className="font-semibold text-lg">{evaluation.epa?.title}</h3>
                          <Badge className={getComplexityLevelColor(evaluation.complexity)}>
                            {formatComplexityLevel(evaluation.complexity)}
                          </Badge>
                          {evaluation.is_custom && (
                            <Badge variant="secondary">Custom Case</Badge>
                          )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Resident:</span>
                            <p className="font-medium">
                              {evaluation.resident?.first_name} {evaluation.resident?.last_name}
                              {evaluation.resident?.pgy_year && ` (PGY-${evaluation.resident.pgy_year})`}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-sm text-muted-foreground">Faculty:</span>
                            <p className="font-medium">
                              {evaluation.faculty?.first_name} {evaluation.faculty?.last_name}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm text-muted-foreground">Domains:</span>
                            <p className="font-medium">
                              {evaluation.domains.map(formatDomain).join(', ')}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm text-muted-foreground">Date:</span>
                            <p className="font-medium">
                              {format(new Date(evaluation.created_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>

                        {evaluation.is_completed && (
                          <div className="flex gap-4 mb-4">
                            {evaluation.resident_entrustment_level && (
                              <div>
                                <span className="text-sm text-muted-foreground">Resident Assessment:</span>
                                <Badge className={getEntrustmentLevelColor(evaluation.resident_entrustment_level)}>
                                  {formatEntrustmentLevel(evaluation.resident_entrustment_level)}
                                </Badge>
                              </div>
                            )}
                            
                            {evaluation.faculty_entrustment_level && (
                              <div>
                                <span className="text-sm text-muted-foreground">Faculty Assessment:</span>
                                <Badge className={getEntrustmentLevelColor(evaluation.faculty_entrustment_level)}>
                                  {formatEntrustmentLevel(evaluation.faculty_entrustment_level)}
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}

                        {evaluation.custom_case_text && (
                          <div className="mb-4">
                            <span className="text-sm text-muted-foreground">Custom Case:</span>
                            <p className="text-sm bg-muted p-2 rounded mt-1">
                              {evaluation.custom_case_text}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {evaluation.is_completed ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Pending
                          </Badge>
                        )}

                        <div className="flex flex-col gap-2">
                          {canRespond(evaluation) && (
                            <Button 
                              onClick={() => handleRespondToEvaluation(evaluation)} 
                              size="sm"
                            >
                              Respond
                            </Button>
                          )}
                          
                          <Button 
                            onClick={() => handleViewEvaluation(evaluation)} 
                            variant="outline" 
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Evaluation Form Modal */}
        <EvaluationForm
          open={showEvaluationForm}
          onOpenChange={setShowEvaluationForm}
          evaluation={selectedEvaluation}
          mode={formMode}
        />
      </main>
      <Toaster />
    </div>
  )
}

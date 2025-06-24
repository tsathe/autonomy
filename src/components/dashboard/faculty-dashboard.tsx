'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEvaluations, getCurrentUserProfile, mapCustomCaseToEPA } from '@/lib/supabase'
import { formatEntrustmentLevel, formatComplexityLevel, formatDomain, getEntrustmentLevelColor, getComplexityLevelColor, exportToCSV } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EvaluationForm } from '@/components/evaluations/evaluation-form'
import { Plus, Download, Clock, CheckCircle, TrendingUp, Users, Award } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ScatterChart, Scatter } from 'recharts'
import { format } from 'date-fns'

export function FacultyDashboard() {
  const [showEvaluationForm, setShowEvaluationForm] = useState(false)
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null)
  const [formMode, setFormMode] = useState<'create' | 'respond' | 'view'>('create')

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUserProfile
  })

  // Fetch evaluations
  const { data: allEvaluations = [], isLoading } = useQuery({
    queryKey: ['evaluations', currentUser?.id],
    queryFn: () => currentUser ? getEvaluations({ faculty_id: currentUser.id }) : [],
    enabled: !!currentUser
  })

  const completedEvaluations = allEvaluations.filter(e => e.is_completed)
  const pendingEvaluations = allEvaluations.filter(e => !e.is_completed)

  // Analytics data
  const supervisionTrends = completedEvaluations.map((evaluation, index) => ({
    evaluation: index + 1,
    entrustment: evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
                 evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
                 evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1,
    date: format(new Date(evaluation.created_at), 'MMM dd')
  }))

  const residentProgress = completedEvaluations.reduce((acc, evaluation) => {
    const residentName = `${evaluation.resident?.first_name} ${evaluation.resident?.last_name}`
    if (!acc[residentName]) {
      acc[residentName] = []
    }
    acc[residentName].push({
      date: evaluation.created_at,
      entrustment: evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
                   evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
                   evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1
    })
    return acc
  }, {} as Record<string, any[]>)

  const autonomyPatterns = completedEvaluations.map(evaluation => ({
    complexity: evaluation.complexity === 'complex' ? 3 : evaluation.complexity === 'moderate' ? 2 : 1,
    entrustment: evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
                 evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
                 evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1,
    resident: `${evaluation.resident?.first_name} ${evaluation.resident?.last_name}`,
    pgy: evaluation.resident?.pgy_year || 1
  }))

  const averageEntrustmentByPGY = completedEvaluations.reduce((acc, evaluation) => {
    const pgy = evaluation.resident?.pgy_year || 1
    if (!acc[pgy]) {
      acc[pgy] = { total: 0, count: 0 }
    }
    const entrustment = evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
                       evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
                       evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1
    acc[pgy].total += entrustment
    acc[pgy].count += 1
    return acc
  }, {} as Record<number, { total: number, count: number }>)

  const pgyChartData = Object.entries(averageEntrustmentByPGY).map(([pgy, data]) => ({
    pgy: `PGY-${pgy}`,
    average: data.total / data.count,
    count: data.count
  }))

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

  const handleExportData = () => {
    const exportData = completedEvaluations.map(evaluation => ({
      Date: format(new Date(evaluation.created_at), 'yyyy-MM-dd'),
      EPA: evaluation.epa?.code,
      'EPA Title': evaluation.epa?.title,
      'Resident Name': `${evaluation.resident?.first_name} ${evaluation.resident?.last_name}`,
      'PGY Year': evaluation.resident?.pgy_year,
      Domains: evaluation.domains.map(formatDomain).join(', '),
      Complexity: formatComplexityLevel(evaluation.complexity),
      'Resident Entrustment': formatEntrustmentLevel(evaluation.resident_entrustment_level || ''),
      'Faculty Entrustment': formatEntrustmentLevel(evaluation.faculty_entrustment_level || ''),
      'Resident Comment': evaluation.resident_comment,
      'Faculty Comment': evaluation.faculty_comment,
      'Custom Case': evaluation.custom_case_text || ''
    }))

    exportToCSV(exportData, `faculty-evaluations-${format(new Date(), 'yyyy-MM-dd')}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="animate-pulse h-4 w-20 bg-muted rounded"></div>
                <div className="animate-pulse h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse h-8 w-16 bg-muted rounded mb-2"></div>
                <div className="animate-pulse h-3 w-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const uniqueResidents = new Set(completedEvaluations.map(evaluation => evaluation.resident_id)).size
  const averageEntrustment = completedEvaluations.length > 0 ? 
    completedEvaluations.reduce((sum, evaluation) => {
      const level = evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
                   evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
                   evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1
      return sum + level
    }, 0) / completedEvaluations.length : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, Dr. {currentUser?.last_name}! Monitor resident progress and supervision patterns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={handleNewEvaluation}>
            <Plus className="h-4 w-4 mr-2" />
            New Evaluation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEvaluations.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingEvaluations.length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Residents Supervised</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueResidents}</div>
            <p className="text-xs text-muted-foreground">
              Unique residents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Autonomy Given</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageEntrustment.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 4.0 scale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingEvaluations.length}</div>
            <p className="text-xs text-muted-foreground">
              Require your input
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="supervision">Supervision Patterns</TabsTrigger>
          <TabsTrigger value="residents">Resident Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Supervision Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Supervision Trends</CardTitle>
                <CardDescription>Your entrustment levels over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={supervisionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[1, 4]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="entrustment" stroke="#8884d8" name="Entrustment Level" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Autonomy by PGY */}
            <Card>
              <CardHeader>
                <CardTitle>Autonomy by Training Level</CardTitle>
                <CardDescription>Average entrustment by PGY year</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pgyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="pgy" />
                    <YAxis domain={[1, 4]} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inbox" className="space-y-4">
          {/* Pending Evaluations */}
          {pendingEvaluations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Pending Evaluations</CardTitle>
                <CardDescription>Evaluations waiting for your response</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingEvaluations.map((evaluation) => (
                    <div key={evaluation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{evaluation.epa?.code}</Badge>
                          <span className="font-medium">{evaluation.epa?.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          With {evaluation.resident?.first_name} {evaluation.resident?.last_name} (PGY-{evaluation.resident?.pgy_year}) • 
                          {format(new Date(evaluation.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Button onClick={() => handleRespondToEvaluation(evaluation)} size="sm">
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Pending Evaluations</CardTitle>
                <CardDescription>All evaluations are up to date</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Great job staying on top of your evaluations!</p>
              </CardContent>
            </Card>
          )}

          {/* Recent Completed Evaluations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Evaluations</CardTitle>
              <CardDescription>Your recently completed evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedEvaluations.slice(0, 10).map((evaluation) => (
                  <div key={evaluation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{evaluation.epa?.code}</Badge>
                        <span className="font-medium">{evaluation.epa?.title}</span>
                        <Badge className={getComplexityLevelColor(evaluation.complexity)}>
                          {formatComplexityLevel(evaluation.complexity)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm">
                          {evaluation.resident?.first_name} {evaluation.resident?.last_name} (PGY-{evaluation.resident?.pgy_year})
                        </span>
                        <Badge className={getEntrustmentLevelColor(evaluation.faculty_entrustment_level || '')}>
                          {formatEntrustmentLevel(evaluation.faculty_entrustment_level || '')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(evaluation.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                    <Button onClick={() => handleViewEvaluation(evaluation)} variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supervision" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Autonomy vs Complexity</CardTitle>
              <CardDescription>How entrustment levels correlate with case complexity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={autonomyPatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="complexity" domain={[1, 3]} tickFormatter={(value) => 
                    value === 1 ? 'Simple' : value === 2 ? 'Moderate' : 'Complex'
                  } />
                  <YAxis dataKey="entrustment" domain={[1, 4]} tickFormatter={(value) => 
                    value === 1 ? 'Obs' : value === 2 ? 'Direct' : value === 3 ? 'Indirect' : 'Ready'
                  } />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'complexity') {
                      return value === 1 ? 'Straightforward' : value === 2 ? 'Moderate' : 'Complex'
                    }
                    if (name === 'entrustment') {
                      return value === 1 ? 'Observation' : value === 2 ? 'Direct' : value === 3 ? 'Indirect' : 'Practice Ready'
                    }
                    return value
                  }} />
                  <Scatter dataKey="entrustment" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="residents" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(residentProgress).map(([residentName, progress]) => {
              const avgEntrustment = progress.reduce((sum, p) => sum + p.entrustment, 0) / progress.length
              const trend = progress.length > 1 ? 
                (progress[progress.length - 1].entrustment - progress[0].entrustment) / (progress.length - 1) : 0

              return (
                <Card key={residentName}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{residentName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Avg: {avgEntrustment.toFixed(1)}
                        </Badge>
                        <Badge variant={trend > 0 ? "default" : trend < 0 ? "destructive" : "secondary"}>
                          {trend > 0 ? "↗" : trend < 0 ? "↘" : "→"} Trend
                        </Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {progress.length} evaluations • Progress over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={progress.map((p, i) => ({ ...p, evaluation: i + 1 }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="evaluation" />
                        <YAxis domain={[1, 4]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="entrustment" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Evaluation Form Modal */}
      <EvaluationForm
        open={showEvaluationForm}
        onOpenChange={setShowEvaluationForm}
        evaluation={selectedEvaluation}
        mode={formMode}
      />
    </div>
  )
}

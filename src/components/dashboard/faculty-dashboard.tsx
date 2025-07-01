'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEvaluations, getCurrentUserProfile } from '@/lib/supabase'
import { EvaluationForm } from '@/components/evaluations/evaluation-form'
import { EvaluationView } from '@/components/evaluations/evaluation-view'
import { Sidebar } from '@/components/layout/sidebar'
import { FeedSection } from '@/components/dashboard/feed-section'
import { InboxSection } from '@/components/dashboard/inbox-section'
import { PendingSection } from '@/components/dashboard/pending-section'
import { Home, Inbox, Clock, BarChart3, Users, Award, TrendingUp } from 'lucide-react'

// Faculty-specific analytics components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEntrustmentLevel, formatComplexityLevel, exportToCSV } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ScatterChart, Scatter } from 'recharts'
import { Download } from 'lucide-react'
import { format } from 'date-fns'

interface FacultyAnalyticsProps {
  evaluations: any[]
  onExport: () => void
}

function FacultyAnalytics({ evaluations, onExport }: FacultyAnalyticsProps) {
  const completedEvaluations = evaluations.filter(e => e.is_completed)

  // Supervision trends - how faculty entrustment levels change over time
  const supervisionTrends = completedEvaluations.map((evaluation, index) => ({
    evaluation: index + 1,
    entrustment: evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
                 evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
                 evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1,
    date: format(new Date(evaluation.created_at), 'MMM dd')
  }))

  // Resident progress tracking
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

  // Autonomy vs complexity patterns
  const autonomyPatterns = completedEvaluations.map(evaluation => ({
    complexity: evaluation.faculty_complexity === 'complex' ? 3 : 
                evaluation.faculty_complexity === 'moderate' ? 2 : 1,
    entrustment: evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
                 evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
                 evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1,
    resident: `${evaluation.resident?.first_name} ${evaluation.resident?.last_name}`,
    pgy: evaluation.resident?.pgy_year || 1
  }))

  // Average entrustment by PGY level
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

  const pgyChartData = (Object.entries(averageEntrustmentByPGY) as [string, { total: number, count: number }][]).map(([pgy, data]) => ({
    pgy: `PGY-${pgy}`,
    avgEntrustment: data.total / data.count,
    evaluations: data.count
  }))

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluations.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedEvaluations.length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Residents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(evaluations.map(e => e.resident_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all PGY levels
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Entrustment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedEvaluations.length > 0 ? 
                (supervisionTrends.reduce((sum, e) => sum + e.entrustment, 0) / supervisionTrends.length).toFixed(1) : 
                'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Faculty assessments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Export Data</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button onClick={onExport} variant="outline" size="sm" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Supervision Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Supervision Trends</CardTitle>
          <CardDescription>Faculty entrustment levels over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={supervisionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[1, 4]} tickFormatter={(value) => 
                value === 1 ? 'Obs' : value === 2 ? 'Direct' : value === 3 ? 'Indirect' : 'Ready'
              } />
              <Tooltip formatter={(value) => {
                const level = value === 1 ? 'Observation Only' : 
                             value === 2 ? 'Direct Supervision' : 
                             value === 3 ? 'Indirect Supervision' : 'Practice Ready'
                return [level, 'Entrustment Level']
              }} />
              <Line type="monotone" dataKey="entrustment" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* PGY Level Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by PGY Level</CardTitle>
          <CardDescription>Average entrustment levels across training years</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pgyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pgy" />
              <YAxis domain={[1, 4]} />
              <Tooltip />
              <Bar dataKey="avgEntrustment" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Autonomy vs Complexity Scatter */}
      <Card>
        <CardHeader>
          <CardTitle>Autonomy vs Case Complexity</CardTitle>
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

      {/* Individual Resident Progress */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Individual Resident Progress</h3>
        {(Object.entries(residentProgress) as [string, any[]][]).map(([residentName, progress]) => {
          const avgEntrustment = progress.reduce((sum: number, p: any) => sum + p.entrustment, 0) / progress.length
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
                  <LineChart data={progress.map((p: any, i: number) => ({ ...p, evaluation: i + 1 }))}>
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
    </div>
  )
}

export function FacultyDashboard() {
  const [showEvaluationForm, setShowEvaluationForm] = useState(false)
  const [showEvaluationView, setShowEvaluationView] = useState(false)
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null)
  const [formMode, setFormMode] = useState<'create' | 'respond' | 'view'>('create')
  const [activeSection, setActiveSection] = useState('feed')

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUserProfile
  })

  // Fetch evaluations for faculty (all evaluations they're involved in)
  const { data: allEvaluations = [], isLoading } = useQuery({
    queryKey: ['evaluations', currentUser?.id],
    queryFn: () => currentUser ? getEvaluations({ faculty_id: currentUser.id }) : [],
    enabled: !!currentUser
  })

  // Categorize evaluations
  const completedEvaluations = allEvaluations.filter(evaluation => evaluation.is_completed)
  
  const inboxEvaluations = allEvaluations.filter(evaluation => 
    !evaluation.is_completed && 
    evaluation.initiated_by !== currentUser?.id && 
    !evaluation.faculty_completed_at
  )
  
  const sentToResidentEvaluations = allEvaluations.filter(evaluation => 
    !evaluation.is_completed && 
    evaluation.initiated_by === currentUser?.id && 
    !evaluation.resident_completed_at
  )

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
    setShowEvaluationView(true)
  }

  const handleExportData = () => {
    const exportData = completedEvaluations.map(evaluation => ({
      Date: format(new Date(evaluation.created_at), 'yyyy-MM-dd'),
      EPA: evaluation.epa?.code,
      'EPA Title': evaluation.epa?.title,
      'Resident Name': `${evaluation.resident?.first_name} ${evaluation.resident?.last_name}`,
      'PGY Year': evaluation.resident?.pgy_year,
      'Resident Entrustment': formatEntrustmentLevel(evaluation.resident_entrustment_level || ''),
      'Faculty Entrustment': formatEntrustmentLevel(evaluation.faculty_entrustment_level || ''),
      'Resident Comment': evaluation.resident_comment,
      'Faculty Comment': evaluation.faculty_comment
    }))

    exportToCSV(exportData, `faculty-evaluations-${format(new Date(), 'yyyy-MM-dd')}`)
  }

  // Sidebar items for faculty
  const sidebarItems = [
    {
      id: 'feed',
      label: 'Feed',
      icon: Home,
      count: completedEvaluations.length
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      count: inboxEvaluations.length
    },
    {
      id: 'pending',
      label: 'Pending',
      icon: Clock,
      count: sentToResidentEvaluations.length
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3
    }
  ]

  // Faculty-specific analytics component
  const FacultyAnalyticsSection = () => (
    <FacultyAnalytics evaluations={allEvaluations} onExport={handleExportData} />
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'inbox':
        return <InboxSection evaluations={inboxEvaluations} onRespondToEvaluation={handleRespondToEvaluation} />
      case 'pending':
        return <PendingSection evaluations={sentToResidentEvaluations} onViewEvaluation={handleViewEvaluation} />
      case 'analytics':
        return <FacultyAnalyticsSection />
      default:
        return <FeedSection evaluations={completedEvaluations} onViewEvaluation={handleViewEvaluation} />
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        items={sidebarItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onNewEvaluation={handleNewEvaluation}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl pt-16 lg:pt-3">
          {renderContent()}
        </div>
      </main>

      {/* Evaluation Form Modal */}
      <EvaluationForm
        open={showEvaluationForm}
        onOpenChange={setShowEvaluationForm}
        evaluation={selectedEvaluation}
        mode={formMode}
      />

      {/* Evaluation View Modal */}
      <EvaluationView
        open={showEvaluationView}
        onOpenChange={setShowEvaluationView}
        evaluation={selectedEvaluation}
      />
    </div>
  )
}

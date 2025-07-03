'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatEntrustmentLevel, formatComplexityLevel, formatDomain } from '@/lib/utils'
import { Download, Users, TrendingUp, Award } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { format, subDays, isAfter } from 'date-fns'

interface AdminAnalyticsProps {
  evaluations: any[]
  allUsers: any[]
  onExport: () => void
}

export function AdminAnalytics({ evaluations, allUsers, onExport }: AdminAnalyticsProps) {
  const completedEvaluations = evaluations.filter(e => e.is_completed)
  const residents = allUsers.filter(u => u.role === 'resident')
  const faculty = allUsers.filter(u => u.role === 'faculty')

  // Resident performance analysis
  const residentPerformance = residents.map(resident => {
    const residentEvals = completedEvaluations.filter(e => e.resident_id === resident.id)
    const avgEntrustment = residentEvals.length > 0 ? 
      residentEvals.reduce((sum, evaluation) => {
        const level = evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
                     evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
                     evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1
        return sum + level
      }, 0) / residentEvals.length : 0

    const recentEvals = residentEvals.filter(e => 
      isAfter(new Date(e.created_at), subDays(new Date(), 30))
    )

    return {
      id: resident.id,
      name: `${resident.first_name} ${resident.last_name}`,
      pgy: resident.pgy_year,
      totalEvaluations: residentEvals.length,
      avgEntrustment,
      recentEvaluations: recentEvals.length,
      status: avgEntrustment >= 3 ? 'high' : avgEntrustment >= 2 ? 'average' : 'needs_attention'
    }
  })

  // Faculty activity analysis
  const facultyActivity = faculty.map(facultyMember => {
    const facultyEvals = completedEvaluations.filter(e => e.faculty_id === facultyMember.id)
    const recentEvals = facultyEvals.filter(e => 
      isAfter(new Date(e.created_at), subDays(new Date(), 30))
    )

    return {
      id: facultyMember.id,
      name: `${facultyMember.first_name} ${facultyMember.last_name}`,
      totalEvaluations: facultyEvals.length,
      recentEvaluations: recentEvals.length,
      avgEntrustmentGiven: facultyEvals.length > 0 ? 
        facultyEvals.reduce((sum, evaluation) => {
          const level = evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
                       evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
                       evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1
          return sum + level
        }, 0) / facultyEvals.length : 0,
      status: recentEvals.length >= 5 ? 'active' : recentEvals.length >= 2 ? 'moderate' : 'inactive'
    }
  })

  // EPA distribution
  const epaDistribution = completedEvaluations.reduce((acc, evaluation) => {
    const epaCode = evaluation.epa?.code || 'Unknown'
    acc[epaCode] = (acc[epaCode] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const epaChartData = Object.entries(epaDistribution).map(([epa, count]) => ({
    epa,
    count
  }))

  // Trends over time
  const monthlyTrends = completedEvaluations.reduce((acc, evaluation) => {
    const month = format(new Date(evaluation.created_at), 'MMM yyyy')
    if (!acc[month]) {
      acc[month] = { evaluations: 0, avgEntrustment: 0, entrustmentSum: 0 }
    }
    acc[month].evaluations += 1
    const level = evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
                 evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
                 evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1
    acc[month].entrustmentSum += level
    acc[month].avgEntrustment = acc[month].entrustmentSum / acc[month].evaluations
    return acc
  }, {} as Record<string, any>)

  const trendsChartData = Object.entries(monthlyTrends).map(([month, data]) => ({
    month,
    evaluations: data.evaluations,
    avgEntrustment: data.avgEntrustment
  }))

  // Calculate summary statistics
  const totalEvaluations = completedEvaluations.length
  const averageEntrustment = completedEvaluations.length > 0 ? 
    completedEvaluations.reduce((sum, evaluation) => {
      const level = evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
                   evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
                   evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1
      return sum + level
    }, 0) / completedEvaluations.length : 0

  const uniqueResidents = new Set(completedEvaluations.map(e => e.resident_id)).size
  const uniqueFaculty = new Set(completedEvaluations.map(e => e.faculty_id)).size

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Institution Analytics</h2>
          <p className="text-muted-foreground">Comprehensive evaluation analytics for all residents and faculty</p>
        </div>
        <Button onClick={onExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              {evaluations.filter(e => !e.is_completed).length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Residents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueResidents}</div>
            <p className="text-xs text-muted-foreground">
              {residents.length} total residents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueFaculty}</div>
            <p className="text-xs text-muted-foreground">
              {faculty.length} total faculty
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Entrustment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageEntrustment.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Institution average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* EPA Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>EPA Distribution</CardTitle>
            <CardDescription>Evaluation coverage by EPA</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={epaChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ epa, percent }) => `${epa} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {epaChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Evaluation volume and quality over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="evaluations" fill="#8884d8" />
                <Line yAxisId="right" type="monotone" dataKey="avgEntrustment" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resident Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Resident Performance Overview</CardTitle>
          <CardDescription>Performance metrics for all residents in the program</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {residentPerformance.map((resident) => (
              <div key={resident.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{resident.name}</span>
                    {resident.pgy && <Badge variant="outline">PGY-{resident.pgy}</Badge>}
                    <Badge variant={resident.status === 'high' ? 'default' : 
                                  resident.status === 'average' ? 'secondary' : 'destructive'}>
                      {resident.status === 'high' ? 'High Performer' : 
                       resident.status === 'average' ? 'Average' : 'Needs Attention'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {resident.totalEvaluations} evaluations • Avg entrustment: {resident.avgEntrustment.toFixed(1)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{resident.recentEvaluations} recent</div>
                  <div className="text-xs text-muted-foreground">Last 30 days</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Faculty Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Faculty Activity Overview</CardTitle>
          <CardDescription>Activity metrics for all faculty in the program</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {facultyActivity.map((faculty) => (
              <div key={faculty.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{faculty.name}</span>
                    <Badge variant={faculty.status === 'active' ? 'default' : 
                                  faculty.status === 'moderate' ? 'secondary' : 'destructive'}>
                      {faculty.status === 'active' ? 'Active' : 
                       faculty.status === 'moderate' ? 'Moderate' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {faculty.totalEvaluations} evaluations • Avg entrustment given: {faculty.avgEntrustmentGiven.toFixed(1)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{faculty.recentEvaluations} recent</div>
                  <div className="text-xs text-muted-foreground">Last 30 days</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

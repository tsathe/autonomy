'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEvaluations, getCurrentUserProfile, getUsersInInstitution, exportToCSV } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { formatEntrustmentLevel, formatComplexityLevel, formatDomain, getEntrustmentLevelColor, getComplexityLevelColor } from '@/lib/utils'
import { Download, Users, TrendingUp, AlertTriangle, Award, Search, Filter } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts'
import { format, subDays, isAfter } from 'date-fns'

export function AdminDashboard() {
  const [selectedResident, setSelectedResident] = useState<string>('all')
  const [selectedEPA, setSelectedEPA] = useState<string>('all')
  const [selectedPGY, setSelectedPGY] = useState<string>('all')
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUserProfile
  })

  // Fetch all evaluations in institution
  const { data: allEvaluations = [], isLoading } = useQuery({
    queryKey: ['evaluations', 'admin', currentUser?.institution_id],
    queryFn: () => getEvaluations(),
    enabled: !!currentUser?.institution_id
  })

  // Fetch all users in institution
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users', currentUser?.institution_id],
    queryFn: () => currentUser?.institution_id ? getUsersInInstitution(currentUser.institution_id) : [],
    enabled: !!currentUser?.institution_id
  })

  const residents = allUsers.filter(u => u.role === 'resident')
  const faculty = allUsers.filter(u => u.role === 'faculty')

  // Apply filters
  const filteredEvaluations = allEvaluations.filter(evaluation => {
    // Date filter
    if (dateRange !== 'all') {
      const days = parseInt(dateRange)
      const cutoffDate = subDays(new Date(), days)
      if (!isAfter(new Date(evaluation.created_at), cutoffDate)) return false
    }

    // Resident filter
    if (selectedResident !== 'all' && evaluation.resident_id !== selectedResident) return false

    // EPA filter
    if (selectedEPA !== 'all' && evaluation.epa_id !== selectedEPA) return false

    // PGY filter
    if (selectedPGY !== 'all' && evaluation.resident?.pgy_year?.toString() !== selectedPGY) return false

    // Complexity filter
    if (selectedComplexity !== 'all' && evaluation.complexity !== selectedComplexity) return false

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

  const completedEvaluations = filteredEvaluations.filter(e => e.is_completed)
  const pendingEvaluations = filteredEvaluations.filter(e => !e.is_completed)

  // Analytics calculations
  const totalEvaluations = completedEvaluations.length
  const uniqueResidents = new Set(completedEvaluations.map(e => e.resident_id)).size
  const uniqueFaculty = new Set(completedEvaluations.map(e => e.faculty_id)).size
  const averageEntrustment = completedEvaluations.length > 0 ? 
    completedEvaluations.reduce((sum, evaluation) => {
      const level = evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
                   evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
                   evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1
      return sum + level
    }, 0) / completedEvaluations.length : 0

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

  const handleExportAll = () => {
    const exportData = completedEvaluations.map(evaluation => ({
      Date: format(new Date(evaluation.created_at), 'yyyy-MM-dd'),
      EPA: evaluation.epa?.code,
      'EPA Title': evaluation.epa?.title,
      'Resident Name': `${evaluation.resident?.first_name} ${evaluation.resident?.last_name}`,
      'PGY Year': evaluation.resident?.pgy_year,
      'Faculty Name': `${evaluation.faculty?.first_name} ${evaluation.faculty?.last_name}`,
      Domains: evaluation.domains.map(formatDomain).join(', '),
      Complexity: formatComplexityLevel(evaluation.complexity),
      'Resident Entrustment': formatEntrustmentLevel(evaluation.resident_entrustment_level || ''),
      'Faculty Entrustment': formatEntrustmentLevel(evaluation.faculty_entrustment_level || ''),
      'Resident Comment': evaluation.resident_comment,
      'Faculty Comment': evaluation.faculty_comment,
      'Custom Case': evaluation.custom_case_text || ''
    }))

    exportToCSV(exportData, `institution-evaluations-${format(new Date(), 'yyyy-MM-dd')}`)
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Institution-wide analytics and performance insights
          </p>
        </div>
        <Button onClick={handleExportAll}>
          <Download className="h-4 w-4 mr-2" />
          Export All Data
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search residents, faculty, EPAs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Resident</label>
              <Select value={selectedResident} onValueChange={setSelectedResident}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Residents</SelectItem>
                  {residents.map(resident => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.first_name} {resident.last_name} (PGY-{resident.pgy_year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">PGY Year</label>
              <Select value={selectedPGY} onValueChange={setSelectedPGY}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="1">PGY-1</SelectItem>
                  <SelectItem value="2">PGY-2</SelectItem>
                  <SelectItem value="3">PGY-3</SelectItem>
                  <SelectItem value="4">PGY-4</SelectItem>
                  <SelectItem value="5">PGY-5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="180">Last 6 Months</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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
              {pendingEvaluations.length} pending
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

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="residents">Residents</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="residents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resident Performance</CardTitle>
              <CardDescription>Individual resident progress and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {residentPerformance.map((resident) => (
                  <div key={resident.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{resident.name}</span>
                        <Badge variant="outline">PGY-{resident.pgy}</Badge>
                        <Badge variant={
                          resident.status === 'high' ? 'default' : 
                          resident.status === 'average' ? 'secondary' : 'destructive'
                        }>
                          {resident.status === 'high' ? 'High Performer' : 
                           resident.status === 'average' ? 'On Track' : 'Needs Attention'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{resident.totalEvaluations} total evaluations</span>
                        <span>{resident.recentEvaluations} recent (30 days)</span>
                        <span>Avg entrustment: {resident.avgEntrustment.toFixed(1)}</span>
                      </div>
                    </div>
                    {resident.status === 'needs_attention' && (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faculty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faculty Activity</CardTitle>
              <CardDescription>Faculty engagement and evaluation patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {facultyActivity.map((facultyMember) => (
                  <div key={facultyMember.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{facultyMember.name}</span>
                        <Badge variant={
                          facultyMember.status === 'active' ? 'default' : 
                          facultyMember.status === 'moderate' ? 'secondary' : 'destructive'
                        }>
                          {facultyMember.status === 'active' ? 'Active' : 
                           facultyMember.status === 'moderate' ? 'Moderate' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{facultyMember.totalEvaluations} total evaluations</span>
                        <span>{facultyMember.recentEvaluations} recent (30 days)</span>
                        <span>Avg entrustment given: {facultyMember.avgEntrustmentGiven.toFixed(1)}</span>
                      </div>
                    </div>
                    {facultyMember.status === 'inactive' && (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Volume Trends</CardTitle>
                <CardDescription>Monthly evaluation counts over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="evaluations" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Trends</CardTitle>
                <CardDescription>Average entrustment levels over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[1, 4]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgEntrustment" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

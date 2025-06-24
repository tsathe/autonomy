'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FilterBar } from './filter-bar'
import { formatEntrustmentLevel, formatComplexityLevel, formatDomain, getEntrustmentLevelColor, getComplexityLevelColor, getAvatarUrl } from '@/lib/utils'
import { Clock, UserCheck, Settings, Send, Eye, Users, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import type { Evaluation, DomainType } from '@/lib/supabase'
import { exportEvaluationsToCSV } from '@/lib/csv-export'

interface PendingSectionProps {
  evaluations: Evaluation[]
  onViewEvaluation: (evaluation: Evaluation) => void
}

export function PendingSection({ evaluations, onViewEvaluation }: PendingSectionProps) {
  const [dateFilter, setDateFilter] = useState<string | null>(null)
  const [facultyFilter, setFacultyFilter] = useState<string | null>(null)
  const [epaFilter, setEpaFilter] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(false)

  const uniqueFaculty = Array.from(new Map(
    evaluations.map(e => [e.faculty?.id, e.faculty])
  ).values()).filter(Boolean)
  const uniqueEpas = Array.from(new Set(evaluations.map(e => e.epa?.code).filter(Boolean))) as string[]

  let filtered = evaluations
  if (dateFilter) filtered = filtered.filter(e => e.created_at.startsWith(dateFilter))
  if (facultyFilter) filtered = filtered.filter(e => e.faculty?.id === facultyFilter)
  if (epaFilter) filtered = filtered.filter(e => e.epa?.code === epaFilter)
  const sorted = [...filtered].sort((a,b)=> sortAsc ? new Date(a.created_at).getTime()-new Date(b.created_at).getTime() : new Date(b.created_at).getTime()-new Date(a.created_at).getTime())

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No pending evaluations</p>
          <p className="text-sm">Evaluations you've sent will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col mb-4 gap-1">
        <h2 className="text-2xl font-bold mb-2">Pending</h2>
        <FilterBar
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          facultyFilter={facultyFilter}
          setFacultyFilter={setFacultyFilter}
          epaFilter={epaFilter}
          setEpaFilter={setEpaFilter}
          sortAsc={sortAsc}
          toggleSort={() => setSortAsc(!sortAsc)}
          uniqueFaculty={uniqueFaculty as any}
          uniqueEpas={uniqueEpas}
          onExport={() => exportEvaluationsToCSV(sorted, 'pending-evaluations.csv')}
        />
      </div>
      <div className="space-y-0">
        {sorted.map((evaluation) => (
          <div 
            key={evaluation.id}
            className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors duration-200 cursor-pointer"
            onClick={() => onViewEvaluation(evaluation)}
          >
            <div className="p-6">
              {/* Header with overlapping avatars */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {/* Overlapping Avatars */}
                  <div className="flex -space-x-2">
                    <Avatar className="h-10 w-10 border-2 border-background relative z-10">
                      <AvatarImage 
                        src={getAvatarUrl(evaluation.resident?.id)} 
                        alt={`${evaluation.resident?.first_name} ${evaluation.resident?.last_name}`}
                      />
                      <AvatarFallback className="text-sm">
                        {evaluation.resident?.first_name?.[0]}{evaluation.resident?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="h-10 w-10 border-2 border-background relative z-0">
                      <AvatarImage 
                        src={getAvatarUrl(evaluation.faculty?.id)} 
                        alt={`${evaluation.faculty?.first_name} ${evaluation.faculty?.last_name}`}
                      />
                      <AvatarFallback className="text-sm">
                        {evaluation.faculty?.first_name?.[0]}{evaluation.faculty?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-foreground">
                        {evaluation.resident?.first_name} {evaluation.resident?.last_name}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Dr. {evaluation.faculty?.last_name}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Sent {format(new Date(evaluation.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Badge className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <Clock className="h-3 w-3" />
                    Awaiting Response
                  </Badge>
                </div>
              </div>

              {/* EPA Information */}
              <div className="mb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {evaluation.epa?.code}
                  </Badge>
                  <span className="font-medium text-foreground">
                    {evaluation.epa?.title}
                  </span>
                </div>
                {evaluation.custom_case_text && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {evaluation.custom_case_text}
                  </p>
                )}
              </div>

              {/* Domains */}
              <div className="flex flex-wrap gap-1 mt-3">
                {evaluation.domains?.map((domain: DomainType) => (
                  <Badge key={domain} variant="secondary" className="text-xs">
                    {formatDomain(domain)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

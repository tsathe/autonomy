'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatEntrustmentLevel, formatComplexityLevel, formatDomain, getEntrustmentLevelColor, getComplexityLevelColor, getAvatarUrl } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useState } from 'react'
import { FilterBar } from './filter-bar'
import { format } from 'date-fns'
import { 
  Eye, 
  Stethoscope, 
  Calendar,
  UserCheck,
  Settings,
  Download
} from 'lucide-react'
import type { Evaluation, DomainType } from '@/lib/supabase'
import { exportEvaluationsToCSV } from '@/lib/csv-export'

interface FeedSectionProps {
  evaluations: Evaluation[]
  onViewEvaluation: (evaluation: Evaluation) => void
}

export function FeedSection({ evaluations, onViewEvaluation }: FeedSectionProps) {
  const [dateFilter, setDateFilter] = useState<string | null>(null)
  const [facultyFilter, setFacultyFilter] = useState<string | null>(null)
  const [epaFilter, setEpaFilter] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'entrustment'>('date')

  const uniqueFaculty = Array.from(new Map(
    evaluations.map(e => [e.faculty?.id, e.faculty])
  ).values()).filter(Boolean)

  const uniqueEpas = Array.from(new Set(evaluations.map(e => e.epa?.code).filter(Boolean))) as string[]

  let filtered = evaluations
  if (dateFilter) filtered = filtered.filter(e => e.created_at.startsWith(dateFilter))
  if (facultyFilter) filtered = filtered.filter(e => e.faculty?.id === facultyFilter)
  if (epaFilter) filtered = filtered.filter(e => e.epa?.code === epaFilter)
  
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'entrustment') {
      const entrustmentOrder = { 'observation_only': 1, 'direct_supervision': 2, 'indirect_supervision': 3, 'practice_ready': 4 }
      const aLevel = entrustmentOrder[a.faculty_entrustment_level || a.resident_entrustment_level || 'observation_only']
      const bLevel = entrustmentOrder[b.faculty_entrustment_level || b.resident_entrustment_level || 'observation_only']
      return sortAsc ? aLevel - bLevel : bLevel - aLevel
    } else {
      return sortAsc ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime() : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">No completed evaluations yet</p>
          <p className="text-sm">Start by creating your first evaluation</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col mb-4 gap-1">
        <h2 className="text-2xl font-bold">Completed Evaluations</h2>
        <FilterBar
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          facultyFilter={facultyFilter}
          setFacultyFilter={setFacultyFilter}
          epaFilter={epaFilter}
          setEpaFilter={setEpaFilter}
          sortAsc={sortAsc}
          toggleSort={() => setSortAsc(!sortAsc)}
          sortBy={sortBy}
          setSortBy={setSortBy}
          uniqueFaculty={uniqueFaculty as any}
          uniqueEpas={uniqueEpas}
          onExport={() => exportEvaluationsToCSV(sorted, 'completed-evaluations.csv')}
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
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(evaluation.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* Badges on the right */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge 
                  className={`${getEntrustmentLevelColor(evaluation.faculty_entrustment_level || '')} flex items-center space-x-1`}
                >
                  <UserCheck className="h-3 w-3" />
                  <span>{formatEntrustmentLevel(evaluation.faculty_entrustment_level || '')}</span>
                </Badge>
                <Badge 
                  className={`${getComplexityLevelColor(evaluation.faculty_complexity || '')} flex items-center space-x-1`}
                >
                  <Settings className="h-3 w-3" />
                  <span>{formatComplexityLevel(evaluation.faculty_complexity || '')}</span>
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

            {/* Faculty feedback */}
            {evaluation.faculty_comment && (
              <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/20 dark:border-blue-800/20">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground leading-relaxed">
                      {evaluation.faculty_comment}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

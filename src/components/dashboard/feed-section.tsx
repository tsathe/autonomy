'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatEntrustmentLevel, formatComplexityLevel, getEntrustmentLevelColor, getComplexityLevelColor } from '@/lib/utils'
import { format } from 'date-fns'
import { 
  Eye, 
  Stethoscope, 
  Calendar,
  UserCheck,
  Settings
} from 'lucide-react'

interface FeedSectionProps {
  evaluations: any[]
  onViewEvaluation: (evaluation: any) => void
}

export function FeedSection({ evaluations, onViewEvaluation }: FeedSectionProps) {
  const getAvatarUrl = (userId?: string, style: string = 'avataaars') => {
    if (!userId) return ''
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  }

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Stethoscope className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Ready to showcase your skills?</h3>
        <p className="text-muted-foreground mb-4">Your completed EPA evaluations will appear here</p>
        <p className="text-sm text-muted-foreground">
          Complete your first evaluation to start building your surgical portfolio! 🏥
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Recent Evaluations</h2>
        <p className="text-muted-foreground">Your completed EPA assessments</p>
      </div>
      
      <div className="divide-y divide-border">
        {evaluations.map((evaluation, index) => (
          <div 
            key={evaluation.id} 
            className="py-6 px-4 -mx-4 hover:bg-muted/30 transition-colors rounded-lg cursor-pointer group"
            onClick={() => onViewEvaluation(evaluation)}
          >
            {/* Header with Overlapping Avatars and Badges on Right */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4 flex-1 min-w-0 mr-6">
                {/* Overlapping Avatars */}
                <div className="flex items-center flex-shrink-0">
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage 
                      src={getAvatarUrl(evaluation.resident?.id)} 
                      alt={`${evaluation.resident?.first_name} ${evaluation.resident?.last_name}`}
                    />
                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                      {evaluation.resident?.first_name?.[0]}{evaluation.resident?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Avatar className="h-10 w-10 -ml-3 border-2 border-background">
                    <AvatarImage 
                      src={getAvatarUrl(evaluation.faculty?.id)} 
                      alt={`${evaluation.faculty?.first_name} ${evaluation.faculty?.last_name}`}
                    />
                    <AvatarFallback className="bg-purple-500 text-white text-sm">
                      {evaluation.faculty?.first_name?.[0]}{evaluation.faculty?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {evaluation.resident?.first_name} {evaluation.resident?.last_name}
                    </span>
                    <span className="text-sm text-muted-foreground">with</span>
                    <span className="font-medium">
                      {evaluation.faculty?.first_name} {evaluation.faculty?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(evaluation.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
              
              {/* Right Side: Badges and Action Button */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Entrustment and Complexity Badges */}
                <div className="flex flex-col items-end gap-1">
                  <Badge className={getEntrustmentLevelColor(evaluation.faculty_entrustment_level)}>
                    <UserCheck className="h-4 w-4 mr-1" />
                    {formatEntrustmentLevel(evaluation.faculty_entrustment_level)}
                  </Badge>
                  <Badge className={getComplexityLevelColor(evaluation.faculty_complexity)} variant="outline">
                    <Settings className="h-4 w-4 mr-1" />
                    {formatComplexityLevel(evaluation.faculty_complexity)}
                  </Badge>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewEvaluation(evaluation)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Case and EPA Info */}
            <div className="mb-4 ml-16">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-medium">
                  {evaluation.epa?.code}
                </Badge>
                <span className="font-semibold">
                  {evaluation.custom_case_text || evaluation.epa?.title}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {evaluation.epa?.title}
              </p>
            </div>

            {/* Faculty Feedback - More Prominent */}
            {evaluation.faculty_comment && (
              <div className="ml-16 mr-16 mt-3">
                <div className="bg-muted/20 rounded-lg p-4 border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Faculty Feedback</p>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {evaluation.faculty_comment}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { MessageSquare, Clock, Calendar } from 'lucide-react'

interface InboxSectionProps {
  evaluations: any[]
  onRespondToEvaluation: (evaluation: any) => void
}

export function InboxSection({ evaluations, onRespondToEvaluation }: InboxSectionProps) {
  const getAvatarUrl = (userId?: string, style: string = 'avataaars') => {
    if (!userId) return ''
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  }

  if (evaluations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inbox</h2>
          <p className="text-muted-foreground">Evaluations requiring your response</p>
        </div>
        
        <div className="text-center py-12">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground">No evaluations waiting for your response</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inbox</h2>
        <p className="text-muted-foreground">{evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''} requiring your response</p>
      </div>
      
      <div className="divide-y divide-border">
        {evaluations.map((evaluation) => (
          <div 
            key={evaluation.id} 
            className="py-6 px-4 -mx-4 hover:bg-muted/30 transition-colors rounded-lg cursor-pointer group"
            onClick={() => onRespondToEvaluation(evaluation)}
          >
            {/* Header with Avatar and Action Button */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4 flex-1 min-w-0 mr-6">
                {/* Faculty Avatar */}
                <Avatar className="h-10 w-10 border-2 border-background flex-shrink-0">
                  <AvatarImage 
                    src={getAvatarUrl(evaluation.faculty?.id)} 
                    alt={`${evaluation.faculty?.first_name} ${evaluation.faculty?.last_name}`}
                  />
                  <AvatarFallback className="bg-orange-500 text-white text-sm">
                    {evaluation.faculty?.first_name?.[0]}{evaluation.faculty?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {evaluation.faculty?.first_name} {evaluation.faculty?.last_name}
                    </span>
                    <span className="text-sm text-muted-foreground">requested response</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(evaluation.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
              
              {/* Right Side: Status Badge and Action Button */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  <Clock className="h-3 w-3" />
                  Pending
                </Badge>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRespondToEvaluation(evaluation)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Case Info */}
            <div className="mb-3 ml-16">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-medium">
                  {evaluation.epa?.code}
                </Badge>
                <span className="font-semibold">
                  {evaluation.custom_case_text || evaluation.epa?.title}
                </span>
              </div>
            </div>

            {/* Faculty Note */}
            {evaluation.faculty_comment && (
              <div className="ml-16 mr-16">
                <div className="bg-muted/20 rounded-lg p-3 border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Faculty Note</p>
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

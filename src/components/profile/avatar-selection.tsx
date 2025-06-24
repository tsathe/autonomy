'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Shuffle, Check } from 'lucide-react'

interface AvatarSelectionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
  onAvatarSelect: (avatarUrl: string) => void
}

export function AvatarSelection({ open, onOpenChange, userId, userName, onAvatarSelect }: AvatarSelectionProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>('avataaars')

  const avatarStyles = [
    { id: 'avataaars', name: 'Cartoon', description: 'Fun cartoon-style avatars' },
    { id: 'adventurer', name: 'Adventure', description: 'Bold adventurer style' },
    { id: 'personas', name: 'Personas', description: 'Professional personas' },
    { id: 'lorelei', name: 'Illustrated', description: 'Hand-drawn illustration style' },
    { id: 'big-smile', name: 'Cheerful', description: 'Always smiling faces' },
    { id: 'fun-emoji', name: 'Emoji', description: 'Emoji-style faces' },
    { id: 'open-peeps', name: 'Minimal', description: 'Clean minimal style' },
    { id: 'bottts', name: 'Robot', description: 'Cute robot avatars' }
  ]

  const getAvatarUrl = (style: string, seed?: string) => {
    const actualSeed = seed || userId
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${actualSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  }

  const generateRandomSeed = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  const handleSelectAvatar = (style: string, seed?: string) => {
    const avatarUrl = getAvatarUrl(style, seed)
    onAvatarSelect(avatarUrl)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {avatarStyles.map((style) => (
            <div key={style.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{style.name}</h3>
                  <p className="text-sm text-muted-foreground">{style.description}</p>
                </div>
                <Badge variant={selectedStyle === style.id ? "default" : "outline"}>
                  {selectedStyle === style.id && <Check className="h-3 w-3 mr-1" />}
                  {style.name}
                </Badge>
              </div>
              
              <div className="grid grid-cols-6 gap-3">
                {/* Current user avatar */}
                <button
                  onClick={() => handleSelectAvatar(style.id)}
                  className="flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-muted transition-colors border-2 border-primary"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={getAvatarUrl(style.id)} alt="Your avatar" />
                    <AvatarFallback className="text-xs">You</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-center font-medium text-primary">Current</span>
                </button>
                
                {/* 5 random variations */}
                {Array.from({ length: 5 }, (_, i) => {
                  const randomSeed = generateRandomSeed()
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectAvatar(style.id, randomSeed)}
                      className="flex flex-col items-center space-y-2 p-2 rounded-lg hover:bg-muted transition-colors border-2 border-transparent hover:border-muted-foreground"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={getAvatarUrl(style.id, randomSeed)} alt={`Variation ${i + 1}`} />
                        <AvatarFallback className="text-xs">{i + 1}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-center text-muted-foreground">Alt {i + 1}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => setSelectedStyle(avatarStyles[Math.floor(Math.random() * avatarStyles.length)].id)}>
            <Shuffle className="h-4 w-4 mr-2" />
            Random Style
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

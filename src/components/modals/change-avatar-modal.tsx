'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Upload, User, Users, Palette, Camera, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ChangeAvatarModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: any
  onAvatarChange: (newAvatarUrl: string) => void
}

export function ChangeAvatarModal({ isOpen, onClose, currentUser, onAvatarChange }: ChangeAvatarModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  // Pre-built avatar options using different styles
  const avatarOptions = [
    {
      id: 'professional-1',
      url: `https://api.dicebear.com/7.x/professional/svg?seed=${currentUser?.id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      label: 'Professional Style'
    },
    {
      id: 'avataaars-1', 
      url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      label: 'Cartoon Style'
    },
    {
      id: 'personas-1',
      url: `https://api.dicebear.com/7.x/personas/svg?seed=${currentUser?.id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      label: 'Modern Style'
    },
    {
      id: 'initials-1',
      url: `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.first_name}${currentUser?.last_name}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      label: 'Initials Style'
    },
    {
      id: 'thumbs-1',
      url: `https://api.dicebear.com/7.x/thumbs/svg?seed=${currentUser?.id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      label: 'Abstract Style'
    },
    {
      id: 'bottts-1',
      url: `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      label: 'Robot Style'
    },
    {
      id: 'fun-emoji-1',
      url: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${currentUser?.id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      label: 'Emoji Style'
    },
    {
      id: 'lorelei-1',
      url: `https://api.dicebear.com/7.x/lorelei/svg?seed=${currentUser?.id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      label: 'Illustrated Style'
    }
  ]

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (error) {
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setUploadedImage(publicUrl)
      setSelectedAvatar('custom-upload')
      toast.success('Image uploaded successfully!')

    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedAvatar) {
      toast.error('Please select an avatar')
      return
    }

    let avatarUrl = ''
    
    if (selectedAvatar === 'custom-upload') {
      avatarUrl = uploadedImage || ''
    } else {
      const option = avatarOptions.find(opt => opt.id === selectedAvatar)
      avatarUrl = option?.url || ''
    }

    try {
      // Update user profile in database
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', currentUser.id)

      if (error) {
        throw error
      }

      onAvatarChange(avatarUrl)
      toast.success('Avatar updated successfully!')
      onClose()

    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to update avatar')
    }
  }

  const currentAvatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.first_name}${currentUser?.last_name}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Change Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Avatar */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Current Avatar</p>
            <Avatar className="h-20 w-20 mx-auto">
              <AvatarImage src={currentAvatarUrl} alt="Current avatar" />
              <AvatarFallback className="text-lg">
                {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Avatar Options */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4" />
              <h3 className="font-medium">Choose a Style</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {avatarOptions.map((option) => (
                <div key={option.id} className="text-center">
                  <button
                    onClick={() => setSelectedAvatar(option.id)}
                    className={cn(
                      "relative p-2 rounded-lg border-2 hover:border-primary/50 transition-colors",
                      selectedAvatar === option.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarImage src={option.url} alt={option.label} />
                      <AvatarFallback>
                        {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {selectedAvatar === option.id && (
                      <CheckCircle className="absolute top-1 right-1 h-5 w-5 text-primary" />
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground mt-1">{option.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Upload */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-4 w-4" />
              <h3 className="font-medium">Upload Custom Image</h3>
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              {uploadedImage ? (
                <div className="space-y-4">
                  <Avatar className="h-20 w-20 mx-auto">
                    <AvatarImage src={uploadedImage} alt="Uploaded avatar" />
                    <AvatarFallback>Upload</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Image uploaded successfully</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedAvatar('custom-upload')}
                    disabled={selectedAvatar === 'custom-upload'}
                  >
                    {selectedAvatar === 'custom-upload' ? 'Selected' : 'Use This Image'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Upload your own image</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <label htmlFor="avatar-upload">
                    <Button variant="outline" disabled={isUploading} asChild>
                      <span className="cursor-pointer">
                        {isUploading ? 'Uploading...' : 'Choose File'}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!selectedAvatar || isUploading}
            >
              Save Avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

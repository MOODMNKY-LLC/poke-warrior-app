'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function AvatarUpload({
  uid,
  url,
  size = 150,
  onUpload,
}: {
  uid: string | null
  url: string | null
  size?: number
  onUpload: (url: string) => void
}) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function downloadImage(path: string) {
      try {
        const { data, error } = await supabase.storage.from('avatars').download(path)
        if (error) throw error
        const url = URL.createObjectURL(data)
        setAvatarUrl(url)
      } catch (error) {
        console.error('Error downloading image: ', error)
        toast.error('Error downloading image')
      }
    }

    if (url) downloadImage(url)
  }, [url, supabase])

  const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      
      if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExt ?? '')) {
        throw new Error('Please upload an image file (JPG, PNG, or GIF)')
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB')
      }

      const filePath = `${uid}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      onUpload(filePath)
      toast.success('Avatar uploaded successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error uploading avatar'
      toast.error(errorMessage)
      console.error('Error uploading avatar:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar 
          className={cn(
            "border-2 border-primary/20"
          )}
          style={{ 
            width: size, 
            height: size,
            minWidth: size,
            minHeight: size 
          }}
        >
          <AvatarImage src={avatarUrl ?? undefined} alt="Profile" />
          <AvatarFallback 
            style={{ fontSize: Math.max(size / 3, 16) }}
          >
            {uid?.charAt(0).toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="mt-4">
          <Button
            variant="outline"
            className="relative w-full"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Change Avatar
              </>
            )}
            <input
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              type="file"
              id="single"
              accept="image/*"
              onChange={uploadAvatar}
              disabled={uploading}
            />
          </Button>
        </div>
      </div>
    </div>
  )
}
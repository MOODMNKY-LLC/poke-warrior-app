'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { AvatarUpload } from '@/app/account/avatar'

interface Role {
  id: number
  name: string
  description: string | null
}

interface FamilyMemberFormProps {
  familyId: string
  roles: Role[]
  onSuccess?: () => void
}

export function FamilyMemberForm({ familyId, roles, onSuccess }: FamilyMemberFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    display_name: '',
    full_name: '',
    role_id: '',
    birth_date: '',
    favorite_color: '',
    avatar_url: null as string | null,
    pin: ''
  })

  console.log('Available roles:', roles)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)

      if (!formData.display_name || formData.display_name.length < 2) {
        throw new Error('Display name must be at least 2 characters long')
      }

      if (!formData.role_id) {
        throw new Error('Please select a role')
      }

      if (formData.pin && !/^\d{6}$/.test(formData.pin)) {
        throw new Error('PIN must be exactly 6 digits')
      }

      const { error } = await supabase
        .from('family_members')
        .insert({
          family_id: familyId,
          ...formData,
          role_id: parseInt(formData.role_id),
          pin: formData.pin || null
        })

      if (error) throw error

      toast.success('Family member added successfully!')
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center">
        <AvatarUpload
          uid={null}
          url={formData.avatar_url}
          size={100}
          onUpload={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display_name">
            Display Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              display_name: e.target.value 
            }))}
            placeholder="Ash"
            required
            minLength={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              full_name: e.target.value 
            }))}
            placeholder="Ash Ketchum"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">
            Role <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.role_id}
            onValueChange={(value) => {
              console.log('Selected role:', value)
              setFormData(prev => ({ 
                ...prev, 
                role_id: value 
              }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles?.length > 0 ? (
                roles.map((role) => (
                  <SelectItem 
                    key={role.id} 
                    value={role.id.toString()}
                  >
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    {role.description && (
                      <span className="ml-2 text-muted-foreground text-xs">
                        ({role.description})
                      </span>
                    )}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  No roles available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birth_date">Birth Date</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              birth_date: e.target.value 
            }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="favorite_color">Favorite Color</Label>
          <Input
            id="favorite_color"
            value={formData.favorite_color}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              favorite_color: e.target.value 
            }))}
            placeholder="Blue"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin">
            Security PIN
            <span className="ml-1 text-xs text-muted-foreground">
              (6 digits)
            </span>
          </Label>
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={formData.pin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              setFormData(prev => ({ 
                ...prev, 
                pin: value 
              }))
            }}
            placeholder="123456"
            title="Please enter exactly 6 digits"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            This PIN will be used by the family member to access their account
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Adding...' : 'Add Family Member'}
      </Button>
    </form>
  )
} 
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FamilyMemberForm } from './family-member-form'

interface Role {
  id: number
  name: string
  description: string | null
}

export function AddFamilyMemberDialog({ 
  familyId,
  roles 
}: { 
  familyId: string
  roles: Role[]
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const onSuccess = () => {
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Trainer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Family Member</DialogTitle>
          <DialogDescription>
            Add a new member to your family. They'll receive an invitation to join.
          </DialogDescription>
        </DialogHeader>
        <FamilyMemberForm 
          familyId={familyId}
          roles={roles}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
} 
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Metadata } from "next"

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  
  const { data: member } = await supabase
    .from('family_members')
    .select('display_name')
    .eq('id', id)
    .single()

  return {
    title: member ? `${member.display_name} - Profile` : 'Trainer Profile',
    description: 'View and manage your trainer profile'
  }
}

export default async function TrainerProfilePage({ 
  params,
  searchParams 
}: PageProps) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()

  // Fetch the family member details with role info
  const { data: member, error } = await supabase
    .from('family_members')
    .select(`
      *,
      roles (
        name,
        description
      )
    `)
    .eq('id', id)
    .single()

  if (error || !member) {
    redirect('/protected')
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <GlassCard className="p-8">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback>
                {member.display_name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{member.display_name}</h1>
              <p className="text-muted-foreground capitalize">
                {member.roles.name} Trainer
              </p>
            </div>
          </div>

          {/* Add more profile content here */}
        </GlassCard>
      </div>
    </div>
  )
} 
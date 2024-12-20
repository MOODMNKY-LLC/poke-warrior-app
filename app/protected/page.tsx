import { createClient } from "@/utils/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Settings, Plus, Swords, CalendarDays } from "lucide-react"
import { PokeBall } from "@/components/icons/pokeball"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AddFamilyMemberDialog } from './components/add-family-member-dialog'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from 'date-fns'
import { JsonObject } from 'type-fest'

// Types based on our SQL schema
interface FamilyProfile {
  id: string
  family_name: string
  family_motto: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  theme_color: string | null
  timezone: string
  locale: string
  settings: JsonObject | null
}

interface FamilyMember {
  id: string
  display_name: string
  full_name: string
  birth_date: string | null
  favorite_color: string | null
  current_status: string
  avatar_url: string | null
  created_at: string
  roles: {
    name: string
    description: string | null
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/sign-in")

  // Fetch family profile with all fields
  const { data: familyProfile } = await supabase
    .from('family_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch roles for the form
  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .order('id')

  // Fetch family members with role info
  const { data: familyMembers } = await supabase
    .from('family_members')
    .select(`
      *,
      roles (
        name,
        description
      )
    `)
    .eq('family_id', user.id)

  if (!familyProfile || !roles) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <GlassCard className="p-8">
          <p className="text-muted-foreground">
            Unable to load family profile. Please try again later.
          </p>
        </GlassCard>
      </div>
    )
  }

  // Debug logging
  console.log('Family Profile:', familyProfile)
  console.log('Family Members:', familyMembers)
  console.log('Roles:', roles)

  // Get member counts by role
  const membersByRole = familyMembers?.reduce((acc, member) => {
    const role = member.roles.name
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Add loading states for family members
  const familyMembersLoading = !familyMembers

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Hero Section with Family Profile */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-background/10 to-background/80" />
        <div className="relative p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24 border-2 border-primary/20">
              <AvatarImage src={familyProfile?.avatar_url || undefined} />
              <AvatarFallback>
                {familyProfile?.family_name?.[0].toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  The {familyProfile?.family_name}
                </h1>
                {familyProfile?.family_motto && (
                  <p className="text-muted-foreground italic mt-1">
                    "{familyProfile.family_motto}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  Established {new Date(familyProfile?.created_at).getFullYear()}
                </Badge>
                <Badge variant="secondary">
                  {familyMembers?.length || 0} Members
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/account">
                  <Settings className="h-4 w-4 mr-2" />
                  Family Settings
                </Link>
              </Button>
              <AddFamilyMemberDialog 
                familyId={user.id} 
                roles={roles || []} // Pass the fetched roles
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Members</p>
              <h3 className="text-2xl font-bold">{familyMembers?.length || 0}</h3>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Parents</p>
              <h3 className="text-2xl font-bold">{membersByRole?.parent || 0}</h3>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Teens</p>
              <h3 className="text-2xl font-bold">{membersByRole?.teen || 0}</h3>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Children</p>
              <h3 className="text-2xl font-bold">{membersByRole?.child || 0}</h3>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </GlassCard>
      </div>

      {/* Family Members Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Family Members</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {familyMembers?.map((member) => (
            <Link 
              key={member.id}
              href={`/protected/trainers/${member.id}`}
              className="block group"
            >
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.display_name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{member.display_name}</CardTitle>
                      <CardDescription className="capitalize">
                        {member.roles.name} Trainer
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="capitalize font-medium">{member.current_status}</dd>
                    </div>
                    {member.birth_date && (
                      <div>
                        <dt className="text-muted-foreground">Birth Date</dt>
                        <dd className="font-medium">
                          {new Date(member.birth_date).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    {member.favorite_color && (
                      <div>
                        <dt className="text-muted-foreground">Favorite Color</dt>
                        <dd className="font-medium capitalize">{member.favorite_color}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground">Member Since</dt>
                      <dd className="font-medium">
                        {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

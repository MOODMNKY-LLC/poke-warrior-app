-- Migration: Family Management Starter
-- Description: Initial schema setup for the Way of the Warrior Family Management System
-- Author: MOODMNKY LLC

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create a table for roles
create table roles (
  id bigint generated always as identity primary key,
  name text unique not null,
  description text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
comment on table roles is 'Defines the available roles for family members';

-- Create a table for family profiles
create table family_profiles (
  id uuid references auth.users on delete cascade primary key,
  family_name text not null,
  family_motto text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  theme_color text,
  timezone text default 'UTC' not null,
  locale text default 'en' not null,
  settings jsonb default '{}'::jsonb,
  
  constraint family_name_length check (char_length(family_name) >= 2),
  constraint unique_family_name unique (family_name)
);
comment on table family_profiles is 'Stores family profile information and preferences';

-- Create a table for family members
create table family_members (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references family_profiles(id) on delete cascade not null,
  display_name text not null,
  full_name text not null,
  role_id bigint references roles(id) not null,
  birth_date date,
  favorite_color text,
  current_status text default 'offline',
  avatar_url text,
  pin char(6),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  constraint display_name_length check (char_length(display_name) >= 2),
  constraint pin_format check (
    pin is null or (
      length(pin) = 6 
      and pin ~ '^[0-9]{6}$'
    )
  )
);
comment on table family_members is 'Stores individual family member profiles and their relationships';

-- Insert default roles
insert into roles (name, description) values
('admin', 'Full access to manage family settings and members'),
('parent', 'Can manage children and family settings'),
('teen', 'Limited access with some privileges'),
('child', 'Basic access with parental controls');

-- After inserting roles, let's verify they exist
do $$
begin
  if not exists (
    select 1 from roles where name in ('admin', 'parent', 'teen', 'child')
  ) then
    raise exception 'Roles were not properly created';
  end if;
end
$$;

-- Enable Row Level Security
alter table family_profiles enable row level security;
alter table family_members enable row level security;
alter table roles enable row level security;

-- Drop existing policies first to avoid conflicts
drop policy if exists "Users can view their own family profile" on family_profiles;
drop policy if exists "Users can update their own family profile" on family_profiles;
drop policy if exists "Users can insert their own family profile" on family_profiles;
drop policy if exists "Users can view their family members" on family_members;
drop policy if exists "Users can create family members" on family_members;
drop policy if exists "Users can update their family members" on family_members;
drop policy if exists "Roles are viewable by everyone" on roles;
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;

-- Family Profiles policies
create policy "Users can view their own family profile"
  on family_profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own family profile"
  on family_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own family profile"
  on family_profiles for update
  using (auth.uid() = id);

-- Family Members policies
create policy "Users can view family members"
  on family_members for select
  using (
    exists (
      select 1
      from family_profiles
      where id = family_members.family_id
      and id = auth.uid()
    )
  );

create policy "Users can create family members"
  on family_members for insert
  with check (
    exists (
      select 1
      from family_profiles
      where id = family_members.family_id
      and id = auth.uid()
    )
  );

create policy "Users can update family members"
  on family_members for update
  using (
    exists (
      select 1
      from family_profiles
      where id = family_members.family_id
      and id = auth.uid()
    )
  );

-- Roles policies (public reference data)
create policy "Roles are viewable by everyone"
  on roles for select
  using (true);

-- Create storage bucket for avatars if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies for avatars (simplified and corrected)
create policy "Public avatar access"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Users can update their own avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Create function to handle new user registration
create or replace function handle_new_user_registration()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  admin_role_id bigint;
begin
  -- Get the admin role id
  select id into admin_role_id from roles where name = 'admin';
  
  -- Create family profile
  insert into family_profiles (id, family_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'family_name', 'New Family'));
  
  -- Create initial admin family member
  insert into family_members (
    id,
    family_id,
    display_name,
    full_name,
    role_id
  )
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    admin_role_id
  );
  
  return new;
end;
$$;

-- Create trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user_registration();

-- Create updated_at triggers
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_family_profiles_updated_at
  before update on family_profiles
  for each row execute procedure update_updated_at_column();

create trigger update_family_members_updated_at
  before update on family_members
  for each row execute procedure update_updated_at_column();

create trigger update_roles_updated_at
  before update on roles
  for each row execute procedure update_updated_at_column();
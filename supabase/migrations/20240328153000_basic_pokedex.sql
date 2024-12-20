-- Basic Pokédex Migration
-- This migration sets up the complete database schema for storing Pokemon data from PokeAPI

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create enums for various Pokemon attributes
create type pokemon_type as enum (
  'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel',
  'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'
);

create type sprite_category as enum (
  'default', 'shiny', 'female', 'shiny_female'
);

create type game_generation as enum (
  'generation-i', 'generation-ii', 'generation-iii', 'generation-iv',
  'generation-v', 'generation-vi', 'generation-vii', 'generation-viii'
);

-- Create base Pokemon table
create table pokemon (
  id bigint primary key,
  name text not null unique,
  base_experience integer,
  height integer,
  weight integer,
  is_default boolean default true,
  order_number integer,
  species_name text,
  species_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create Pokemon abilities table
create table pokemon_abilities (
  id uuid primary key default uuid_generate_v4(),
  pokemon_id bigint references pokemon(id) on delete cascade,
  ability_name text not null,
  ability_url text not null,
  is_hidden boolean default false,
  slot integer not null,
  created_at timestamptz default now() not null,
  unique(pokemon_id, ability_name)
);

-- Create Pokemon cries table
create table pokemon_cries (
  id uuid primary key default uuid_generate_v4(),
  pokemon_id bigint references pokemon(id) on delete cascade,
  latest_url text,
  legacy_url text,
  created_at timestamptz default now() not null,
  unique(pokemon_id)
);

-- Create Pokemon forms table
create table pokemon_forms (
  id uuid primary key default uuid_generate_v4(),
  pokemon_id bigint references pokemon(id) on delete cascade,
  form_name text not null,
  form_url text not null,
  created_at timestamptz default now() not null
);

-- Create Pokemon game indices table
create table pokemon_game_indices (
  id uuid primary key default uuid_generate_v4(),
  pokemon_id bigint references pokemon(id) on delete cascade,
  game_index integer not null,
  version_name text not null,
  version_url text not null,
  created_at timestamptz default now() not null
);

-- Create Pokemon held items table
create table pokemon_held_items (
  id uuid primary key default uuid_generate_v4(),
  pokemon_id bigint references pokemon(id) on delete cascade,
  item_name text not null,
  item_url text not null,
  rarity integer,
  version_name text not null,
  version_url text not null,
  created_at timestamptz default now() not null
);

-- Create Pokemon stats table
create table pokemon_stats (
  id uuid primary key default uuid_generate_v4(),
  pokemon_id bigint references pokemon(id) on delete cascade,
  stat_name text not null,
  base_stat integer not null,
  effort integer not null,
  stat_url text not null,
  created_at timestamptz default now() not null,
  unique(pokemon_id, stat_name)
);

-- Create Pokemon types table
create table pokemon_types (
  id uuid primary key default uuid_generate_v4(),
  pokemon_id bigint references pokemon(id) on delete cascade,
  type pokemon_type not null,
  slot integer not null,
  type_url text not null,
  created_at timestamptz default now() not null,
  unique(pokemon_id, type)
);

-- Create comprehensive sprite storage system
create table pokemon_sprites (
  id uuid primary key default uuid_generate_v4(),
  pokemon_id bigint references pokemon(id) on delete cascade,
  category text not null,
  generation game_generation,
  version_group text,
  sprite_type sprite_category,
  url text not null,
  is_animated boolean default false,
  created_at timestamptz default now() not null
);

-- Add comments
comment on table pokemon is 'Base Pokemon information';
comment on table pokemon_abilities is 'Pokemon abilities and their properties';
comment on table pokemon_cries is 'Pokemon cry sound files';
comment on table pokemon_forms is 'Different forms a Pokemon can take';
comment on table pokemon_game_indices is 'Game-specific indices for Pokemon';
comment on table pokemon_held_items is 'Items that can be held by Pokemon';
comment on table pokemon_stats is 'Pokemon base stats and effort values';
comment on table pokemon_types is 'Pokemon types (can have up to 2 types)';
comment on table pokemon_sprites is 'Comprehensive sprite storage for all Pokemon images';

-- Enable Row Level Security
alter table pokemon enable row level security;
alter table pokemon_abilities enable row level security;
alter table pokemon_cries enable row level security;
alter table pokemon_forms enable row level security;
alter table pokemon_game_indices enable row level security;
alter table pokemon_held_items enable row level security;
alter table pokemon_stats enable row level security;
alter table pokemon_types enable row level security;
alter table pokemon_sprites enable row level security;

-- Create RLS Policies
create policy "Allow public read access"
  on pokemon for select
  to anon, authenticated
  using (true);

create policy "Allow authenticated users to insert"
  on pokemon for insert
  to authenticated
  with check (true);

-- Repeat similar policies for other tables
create policy "Allow public read access to abilities"
  on pokemon_abilities for select
  to anon, authenticated
  using (true);

-- Create updated_at trigger function
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Add updated_at triggers
create trigger handle_pokemon_updated_at
  before update on pokemon
  for each row
  execute function handle_updated_at();

-- Create indexes for better query performance
create index idx_pokemon_name on pokemon(name);
create index idx_pokemon_abilities_pokemon_id on pokemon_abilities(pokemon_id);
create index idx_pokemon_sprites_pokemon_id on pokemon_sprites(pokemon_id);
create index idx_pokemon_stats_pokemon_id on pokemon_stats(pokemon_id);
create index idx_pokemon_types_pokemon_id on pokemon_types(pokemon_id); 
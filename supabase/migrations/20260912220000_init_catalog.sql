-- MagAI catalog base schema: profiles, categories, prompts, favorites.
create extension if not exists pgcrypto;

-- profiles: one row per authenticated user
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles are editable by owner"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

-- categories: catalog taxonomy
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories are viewable by everyone"
  on public.categories for select
  using (true);

-- prompts: catalog items
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  image_url text,
  category_id uuid references public.categories (id) on delete set null,
  is_premium boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists prompts_category_id_idx on public.prompts (category_id);

alter table public.prompts enable row level security;

create policy "active prompts are viewable by everyone"
  on public.prompts for select
  using (is_active = true);

-- favorites: user <-> prompt
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, prompt_id)
);

alter table public.favorites enable row level security;

create policy "favorites are viewable by owner"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "favorites are insertable by owner"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "favorites are deletable by owner"
  on public.favorites for delete
  using (auth.uid() = user_id);

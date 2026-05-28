-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table malls (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  address     text not null,
  city        text not null,
  state       text not null,
  total_floors int default 4,
  logo_url    text,
  created_at  timestamptz default now()
);

create table zones (
  id          uuid default uuid_generate_v4() primary key,
  mall_id     uuid references malls(id) on delete cascade not null,
  name        text not null,
  level       text not null,
  color_code  text default '#3B82F6',
  total_slots int not null,
  created_at  timestamptz default now()
);

create table parking_slots (
  id          uuid default uuid_generate_v4() primary key,
  zone_id     uuid references zones(id) on delete cascade not null,
  slot_number text not null,
  status      text default 'available'
              check (status in ('available','occupied','reserved','maintenance')),
  type        text default 'regular'
              check (type in ('regular','disabled','ev','family')),
  created_at  timestamptz default now()
);

create table profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  full_name     text,
  phone         text,
  vehicle_plates text[] default '{}',
  role          text default 'user'
                check (role in ('user','admin','operator')),
  created_at    timestamptz default now()
);

create table rates (
  id               uuid default uuid_generate_v4() primary key,
  mall_id          uuid references malls(id) on delete cascade not null,
  first_hour_myr   numeric(10,2) default 2.00,
  per_hour_myr     numeric(10,2) default 1.00,
  daily_max_myr    numeric(10,2) default 20.00,
  ev_surcharge_myr numeric(10,2) default 2.00,
  created_at       timestamptz default now()
);

create table parking_sessions (
  id               uuid default uuid_generate_v4() primary key,
  slot_id          uuid references parking_slots(id) not null,
  user_id          uuid references auth.users(id),
  plate_number     text not null,
  entry_time       timestamptz default now(),
  exit_time        timestamptz,
  duration_minutes int,
  fee_myr          numeric(10,2),
  status           text default 'active'
                   check (status in ('active','completed','unpaid')),
  created_at       timestamptz default now()
);

create table payments (
  id          uuid default uuid_generate_v4() primary key,
  session_id  uuid references parking_sessions(id) not null,
  amount_myr  numeric(10,2) not null,
  method      text check (method in ('fpx','card','tng','cash','pending')),
  billplz_id  text,
  status      text default 'pending'
              check (status in ('pending','paid','failed','refunded')),
  paid_at     timestamptz,
  created_at  timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table malls            enable row level security;
alter table zones            enable row level security;
alter table parking_slots    enable row level security;
alter table profiles         enable row level security;
alter table rates            enable row level security;
alter table parking_sessions enable row level security;
alter table payments         enable row level security;

-- Public read: malls, zones, slots, rates
create policy "public_read_malls"  on malls         for select using (true);
create policy "public_read_zones"  on zones         for select using (true);
create policy "public_read_slots"  on parking_slots for select using (true);
create policy "public_read_rates"  on rates         for select using (true);

-- Profiles
create policy "users_read_own_profile"   on profiles for select using (auth.uid() = id);
create policy "users_update_own_profile" on profiles for update using (auth.uid() = id);
create policy "users_insert_own_profile" on profiles for insert with check (auth.uid() = id);

-- Sessions: users read own, operators read all
create policy "users_read_own_sessions" on parking_sessions
  for select using (auth.uid() = user_id);

-- Payments: users read own
create policy "users_read_own_payments" on payments
  for select using (
    session_id in (select id from parking_sessions where user_id = auth.uid())
  );

-- ============================================================
-- ADMIN / SERVICE ROLE POLICIES (via service role key)
-- ============================================================

create policy "service_manage_sessions" on parking_sessions
  for all using (true) with check (true);

create policy "service_manage_slots" on parking_slots
  for all using (true) with check (true);

create policy "service_manage_payments" on payments
  for all using (true) with check (true);

create policy "service_manage_zones" on zones
  for all using (true) with check (true);

create policy "service_manage_malls" on malls
  for all using (true) with check (true);

create policy "service_manage_rates" on rates
  for all using (true) with check (true);

-- ============================================================
-- REALTIME
-- ============================================================

alter publication supabase_realtime add table parking_slots;
alter publication supabase_realtime add table parking_sessions;

-- ============================================================
-- TRIGGER: auto-create profile on user sign up
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

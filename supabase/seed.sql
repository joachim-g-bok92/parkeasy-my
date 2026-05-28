-- ============================================================
-- SEED DATA — Demo Mall: ParkEasy @ Mid Valley KL
-- ============================================================

-- Insert mall
insert into malls (id, name, address, city, state, total_floors)
values (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'ParkEasy @ Mid Valley',
  'Mid Valley City, Lingkaran Syed Putra',
  'Kuala Lumpur',
  'Wilayah Persekutuan',
  5
);

-- Insert mall 2
insert into malls (id, name, address, city, state, total_floors)
values (
  'a1b2c3d4-0000-0000-0000-000000000002',
  'ParkEasy @ Pavilion KL',
  '168, Jalan Bukit Bintang',
  'Kuala Lumpur',
  'Wilayah Persekutuan',
  4
);

-- Insert mall 3
insert into malls (id, name, address, city, state, total_floors)
values (
  'a1b2c3d4-0000-0000-0000-000000000003',
  'ParkEasy @ Sunway Pyramid',
  '3, Jalan PJS 11/15, Bandar Sunway',
  'Petaling Jaya',
  'Selangor',
  6
);

-- ============================================================
-- RATES
-- ============================================================

insert into rates (mall_id, first_hour_myr, per_hour_myr, daily_max_myr, ev_surcharge_myr)
values
  ('a1b2c3d4-0000-0000-0000-000000000001', 2.00, 1.00, 20.00, 2.00),
  ('a1b2c3d4-0000-0000-0000-000000000002', 3.00, 2.00, 30.00, 2.00),
  ('a1b2c3d4-0000-0000-0000-000000000003', 2.50, 1.50, 25.00, 2.00);

-- ============================================================
-- ZONES — Mall 1 (Mid Valley)
-- ============================================================

insert into zones (id, mall_id, name, level, color_code, total_slots) values
  ('z1000001-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Zone A', 'P1', '#3B82F6', 50),
  ('z1000001-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Zone B', 'P1', '#8B5CF6', 40),
  ('z1000001-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Zone C', 'P2', '#EC4899', 60),
  ('z1000001-0000-0000-0000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001', 'Zone D', 'P2', '#F59E0B', 50),
  ('z1000001-0000-0000-0000-000000000005', 'a1b2c3d4-0000-0000-0000-000000000001', 'Zone E (EV)', 'P3', '#10B981', 20);

-- ============================================================
-- PARKING SLOTS — Zone A (50 slots, mix of statuses)
-- ============================================================

do $$
declare
  i int;
  s_type text;
  s_status text;
begin
  for i in 1..50 loop
    -- Types
    if i <= 2 then s_type := 'disabled';
    elsif i <= 4 then s_type := 'family';
    else s_type := 'regular';
    end if;
    -- Statuses: ~60% available, ~35% occupied, ~5% maintenance
    if i % 20 = 0 then s_status := 'maintenance';
    elsif i % 3 = 0 then s_status := 'occupied';
    else s_status := 'available';
    end if;
    insert into parking_slots (zone_id, slot_number, status, type) values (
      'z1000001-0000-0000-0000-000000000001',
      'A-' || lpad(i::text, 3, '0'),
      s_status,
      s_type
    );
  end loop;
end $$;

-- Zone B (40 slots)
do $$
declare
  i int;
  s_status text;
begin
  for i in 1..40 loop
    if i % 15 = 0 then s_status := 'maintenance';
    elsif i % 4 = 0 then s_status := 'occupied';
    else s_status := 'available';
    end if;
    insert into parking_slots (zone_id, slot_number, status, type) values (
      'z1000001-0000-0000-0000-000000000002',
      'B-' || lpad(i::text, 3, '0'),
      s_status,
      'regular'
    );
  end loop;
end $$;

-- Zone C (60 slots, busier)
do $$
declare
  i int;
  s_status text;
begin
  for i in 1..60 loop
    if i % 2 = 0 then s_status := 'occupied';
    elsif i % 10 = 0 then s_status := 'reserved';
    else s_status := 'available';
    end if;
    insert into parking_slots (zone_id, slot_number, status, type) values (
      'z1000001-0000-0000-0000-000000000003',
      'C-' || lpad(i::text, 3, '0'),
      s_status,
      'regular'
    );
  end loop;
end $$;

-- Zone D (50 slots)
do $$
declare
  i int;
  s_status text;
begin
  for i in 1..50 loop
    if i % 3 = 0 then s_status := 'available';
    else s_status := 'occupied';
    end if;
    insert into parking_slots (zone_id, slot_number, status, type) values (
      'z1000001-0000-0000-0000-000000000004',
      'D-' || lpad(i::text, 3, '0'),
      s_status,
      'regular'
    );
  end loop;
end $$;

-- Zone E — EV Slots (20 slots)
do $$
declare
  i int;
  s_status text;
begin
  for i in 1..20 loop
    if i <= 10 then s_status := 'available';
    else s_status := 'occupied';
    end if;
    insert into parking_slots (zone_id, slot_number, status, type) values (
      'z1000001-0000-0000-0000-000000000005',
      'E-' || lpad(i::text, 3, '0'),
      s_status,
      'ev'
    );
  end loop;
end $$;

-- ============================================================
-- ZONES — Mall 2 (Pavilion)
-- ============================================================

insert into zones (id, mall_id, name, level, color_code, total_slots) values
  ('z2000001-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'Zone A', 'LG', '#3B82F6', 80),
  ('z2000001-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000002', 'Zone B', 'G',  '#8B5CF6', 60),
  ('z2000001-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000002', 'Zone C', 'L1', '#EC4899', 70);

do $$
declare i int; s_status text;
begin
  for i in 1..80 loop
    if i % 3 = 0 then s_status := 'occupied'; else s_status := 'available'; end if;
    insert into parking_slots (zone_id, slot_number, status, type) values (
      'z2000001-0000-0000-0000-000000000001', 'A-' || lpad(i::text,3,'0'), s_status, 'regular');
  end loop;
end $$;

do $$
declare i int; s_status text;
begin
  for i in 1..60 loop
    if i % 2 = 0 then s_status := 'occupied'; else s_status := 'available'; end if;
    insert into parking_slots (zone_id, slot_number, status, type) values (
      'z2000001-0000-0000-0000-000000000002', 'B-' || lpad(i::text,3,'0'), s_status, 'regular');
  end loop;
end $$;

-- ============================================================
-- ZONES — Mall 3 (Sunway)
-- ============================================================

insert into zones (id, mall_id, name, level, color_code, total_slots) values
  ('z3000001-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000003', 'Zone A', 'B1', '#3B82F6', 100),
  ('z3000001-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000003', 'Zone B', 'B2', '#8B5CF6', 80),
  ('z3000001-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000003', 'Zone EV', 'B1', '#10B981', 30);

do $$
declare i int; s_status text;
begin
  for i in 1..100 loop
    if i % 4 = 0 then s_status := 'available'; else s_status := 'occupied'; end if;
    insert into parking_slots (zone_id, slot_number, status, type) values (
      'z3000001-0000-0000-0000-000000000001', 'A-' || lpad(i::text,3,'0'), s_status, 'regular');
  end loop;
end $$;

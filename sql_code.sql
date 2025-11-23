-- incidents: all complaints
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  priority text not null default 'medium',
  status text not null default 'new', -- new | in_progress | resolved

  building text,
  room text,
  lat double precision,
  lng double precision,

  reporter_name text,
  reporter_email text,

  assigned_technician_id text, -- 'tech1', 'tech2', etc.

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- technicians: list of technicians (you can expand later)
create table if not exists technicians (
  id text primary key,           -- 'tech1', 'tech2'
  display_name text not null,
  specialization text
);

-- optional: insert demo technicians (matching your frontend)
insert into technicians (id, display_name, specialization)
values
  ('tech1', 'Technician 1', 'Lifts & Electrical'),
  ('tech2', 'Technician 2', 'Plumbing & Civil')
on conflict (id) do nothing;

-- Run this once in your Supabase project (if not already enabled)
create extension if not exists "uuid-ossp";


create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),

  -- unique college identifier
  usn text not null unique,

  -- basic profile
  name text not null,
  email text unique,

  -- DEMO ONLY: plain-text password
  -- (for real apps this MUST be a hashed password)
  password text not null,

  created_at timestamptz not null default now()
);



insert into public.students (usn, name, email, password)
values
  ('1BY24AI140', 'Satvika', '24ug1byai224@bmsit.in', '17144'),
  ('1TD24AI057', 'Lalith', '24ug1byai190@bmsit.in', '17610'),
  ('1TD24AI081', 'Asritha', '24ug1byai002@bmsit.in', '16079'),
  ('1BY24AI014', 'Amrutesh', '24ug1byai267@bmsit.in', '17329');


-- STUDENTS (with password)
DROP TABLE IF EXISTS public.students;

CREATE TABLE public.students (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usn        text NOT NULL UNIQUE,
  name       text NOT NULL,
  email      text,
  password   text NOT NULL
);

INSERT INTO public.students (usn, name, email, password) VALUES
('1TD24AI081', 'Asritha', '24ug1byai002@bmsit.in', 'pass081'),
('1TD24AI057', 'Lalith',  '24ug1byai090@bmsit.in', 'pass057'),
('1BY24AI140', 'Sativka', '24ug1byai224@bmsit.in', 'pass140'),
('1BY24AI014', 'Amrutesh','24ug1byai267@bmsit.in', 'pass014');

-- INCIDENTS
DROP TABLE IF EXISTS public.incidents;

CREATE TABLE public.incidents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  category       text NOT NULL,
  description    text,
  image_url      text,
  building       text NOT NULL,
  room           text,
  lat            double precision,
  lng            double precision,
  status         text NOT NULL DEFAULT 'new',
  priority       text NOT NULL DEFAULT 'low',
  reporter_name  text NOT NULL,
  reporter_email text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incidents
ADD COLUMN assigned_technician_username text,
ADD COLUMN assigned_technician_name text,
ADD COLUMN assigned_at timestamptz;

ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS assigned_technician_username text,
ADD COLUMN IF NOT EXISTS assigned_technician_name text,
ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

ALTER TABLE incidents ADD COLUMN tech_notes text;


create table public.incident_risk (
  id bigserial primary key,
  building text not null,
  category text not null,
  risk_score double precision not null,
  risk_label text not null,
  generated_at timestamptz not null default now()
);

create index incident_risk_building_category_idx
  on public.incident_risk (building, category);

-- Categorías de trabajo (Informática, Diseño, Marketing, etc.)
create table job_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  accent_color text not null,   -- color hex para el acento de texto
  created_at timestamptz default now()
);

-- Trabajos
create table jobs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references job_categories(id) on delete cascade,
  name text not null,
  description text,
  tags text[],
  created_at timestamptz default now()
);

-- Historial de entrevistas por usuario
create table interview_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null,
  level text not null,
  interviewer text not null,
  score integer,
  verdict text,
  duration integer,
  category_scores jsonb,
  created_at timestamptz default now()
);

-- Permisos (Row Level Security)
alter table job_categories enable row level security;
alter table jobs enable row level security;
alter table interview_history enable row level security;

-- Categorías y trabajos: lectura pública
create policy "public read categories" on job_categories for select using (true);
create policy "public read jobs" on jobs for select using (true);

-- Historial: solo el dueño puede ver/escribir
create policy "user owns history" on interview_history
  for all using (auth.uid() = user_id);

-- Datos iniciales: categorías
insert into job_categories (name, slug, accent_color) values
  ('Informática', 'tech',       '#ff2b2b'),
  ('Diseño',      'design',     '#7c3aed'),
  ('Marketing',   'marketing',  '#d97706'),
  ('Finanzas',    'finance',    '#059669'),
  ('Salud',       'health',     '#0284c7'),
  ('Legal',       'legal',      '#64748b');

-- Datos iniciales: trabajos de Informática
insert into jobs (category_id, name, tags)
select id, unnest(array[
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'DevOps Engineer', 'Mobile Developer', 'Data Scientist',
  'Game Developer', 'QA Engineer', 'Security Analyst',
  'Cloud Architect', 'ML Engineer', 'AI Engineer',
  'Blockchain Developer', 'Embedded Systems Engineer', 'Network Engineer',
  'Database Administrator', 'Systems Administrator', 'IT Support',
  'Product Manager', 'Scrum Master', 'Technical Lead',
  'UI/UX Designer', 'Data Engineer', 'Data Analyst',
  'AR/VR Developer', 'Robotics Engineer', 'Site Reliability Engineer'
]), array['tech']
from job_categories where slug = 'tech';

-- Diseño
insert into jobs (category_id, name, tags)
select id, unnest(array[
  'Graphic Designer', 'Brand Designer', 'Motion Designer',
  'UX Researcher', '3D Artist', 'Illustrator',
  'Video Editor', 'Art Director', 'Creative Director'
]), array['design']
from job_categories where slug = 'design';

-- Marketing
insert into jobs (category_id, name, tags)
select id, unnest(array[
  'Digital Marketing Manager', 'SEO Specialist', 'Content Creator',
  'Social Media Manager', 'Growth Hacker', 'Email Marketing Specialist',
  'Performance Marketing Manager', 'Brand Strategist', 'Copywriter'
]), array['marketing']
from job_categories where slug = 'marketing';

-- Finanzas
insert into jobs (category_id, name, tags)
select id, unnest(array[
  'Financial Analyst', 'Investment Banker', 'Accountant',
  'Risk Analyst', 'Financial Controller', 'Auditor',
  'CFO', 'Portfolio Manager', 'Tax Consultant'
]), array['finance']
from job_categories where slug = 'finance';

-- VRD Questionnaire - Supabase Schema
-- Run this in your Supabase SQL editor

create table questions (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

create table answers (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references questions(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

create table votes (
  id uuid default gen_random_uuid() primary key,
  answer_id uuid references answers(id) on delete cascade,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table questions enable row level security;
alter table answers enable row level security;
alter table votes enable row level security;

-- Public read access
create policy "Public read questions" on questions for select using (true);
create policy "Public read answers" on answers for select using (true);
create policy "Public read votes" on votes for select using (true);

-- Public write for votes (consumers can vote)
create policy "Public insert votes" on votes for insert with check (true);

-- Public write for questions and answers (admin via client key)
create policy "Public insert questions" on questions for insert with check (true);
create policy "Public update questions" on questions for update using (true);
create policy "Public delete questions" on questions for delete using (true);
create policy "Public insert answers" on answers for insert with check (true);
create policy "Public delete answers" on answers for delete using (true);

-- Enable realtime
alter publication supabase_realtime add table questions;
alter publication supabase_realtime add table votes;

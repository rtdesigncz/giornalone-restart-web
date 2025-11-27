create table if not exists public.notes (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    content text not null,
    author_id uuid null,
    recipient_id uuid null,
    constraint notes_pkey primary key (id),
    constraint notes_author_id_fkey foreign key (author_id) references consulenti (id),
    constraint notes_recipient_id_fkey foreign key (recipient_id) references consulenti (id)
);

-- Enable RLS
alter table public.notes enable row level security;

-- Policies (allow all for now for simplicity, refine later if needed)
create policy "Enable read access for all users" on public.notes for select using (true);
create policy "Enable insert access for all users" on public.notes for insert with check (true);
create policy "Enable update access for all users" on public.notes for update using (true);
create policy "Enable delete access for all users" on public.notes for delete using (true);

-- View for easier querying with names
create or replace view public.notes_v as
select
    n.id,
    n.created_at,
    n.content,
    n.author_id,
    a.name as author_name,
    n.recipient_id,
    r.name as recipient_name
from
    public.notes n
    left join public.consulenti a on n.author_id = a.id
    left join public.consulenti r on n.recipient_id = r.id;

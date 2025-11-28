-- Upgrade notes table with advanced features

-- Add new columns
alter table public.notes
add column if not exists priority text default 'normal' check (priority in ('normal', 'urgent', 'info')),
add column if not exists is_pinned boolean default false,
add column if not exists expires_at timestamp with time zone null,
add column if not exists read_by uuid[] default '{}',
add column if not exists parent_id uuid null references public.notes(id) on delete cascade;

-- Update the view to include new columns
create or replace view public.notes_v as
select
    n.id,
    n.created_at,
    n.content,
    n.author_id,
    a.name as author_name,
    n.recipient_id,
    r.name as recipient_name,
    n.priority,
    n.is_pinned,
    n.expires_at,
    n.read_by,
    n.parent_id
from
    public.notes n
    left join public.consulenti a on n.author_id = a.id
    left join public.consulenti r on n.recipient_id = r.id;

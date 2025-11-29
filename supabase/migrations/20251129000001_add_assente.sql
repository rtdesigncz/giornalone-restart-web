-- Add assente column to entries table
alter table public.entries
add column if not exists assente boolean default false;

-- Update the view if necessary (entries is a table, so usually no view update needed unless there's a specific view)
-- But let's check if there are any views that need refreshing. usually simple select * views auto-update or need recreation.
-- Assuming standard usage.

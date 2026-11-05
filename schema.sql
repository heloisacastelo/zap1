-- Execute este arquivo no Supabase > SQL Editor.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  sender text not null,
  type text not null default 'text' check (type in ('text','image','audio')),
  content text default '',
  media_url text,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Chat aberto por link: qualquer pessoa que tenha acesso ao projeto pode ler/enviar.
-- O identificador da sala separa as conversas na interface, mas NÃO é autenticação.
create policy "public can read chat messages"
on public.messages for select to anon using (true);

create policy "public can send chat messages"
on public.messages for insert to anon with check (
  length(room_id) between 10 and 80
  and length(sender) between 1 and 28
  and type in ('text','image','audio')
);

-- Ative Realtime para a tabela messages:
alter publication supabase_realtime add table public.messages;

-- Crie um bucket público chamado chat-media em Storage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media','chat-media',true,15728640,array['image/*','audio/*','application/octet-stream'])
on conflict (id) do update set public=true, file_size_limit=15728640;

create policy "chat users can upload media"
on storage.objects for insert to anon
with check (bucket_id = 'chat-media');

create policy "chat users can read media"
on storage.objects for select to anon
using (bucket_id = 'chat-media');

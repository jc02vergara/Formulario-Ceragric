-- Panel de administración: teléfono, auditoría de cambios, acceso de administradores y tiempo real.

-- ============ Nuevas columnas ============
alter table public.ceragric_productores
  add column ceragric_productores_telefono text
    check (ceragric_productores_telefono ~ '^0[0-9]{8,9}$'),
  add column ceragric_productores_fecha_actualizacion timestamptz;

comment on column public.ceragric_productores.ceragric_productores_telefono is 'Teléfono ecuatoriano: celular 09XXXXXXXX o fijo 0XXXXXXXX. Solo lo registran administradores';

create or replace function public.ceragric_productores_marcar_actualizacion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.ceragric_productores_fecha_actualizacion := now();
  return new;
end;
$$;

create trigger ceragric_productores_marcar_actualizacion_trg
  before update on public.ceragric_productores
  for each row execute function public.ceragric_productores_marcar_actualizacion();

-- ============ Administradores ============
create table public.ceragric_administradores (
  ceragric_administradores_id uuid primary key default gen_random_uuid(),
  ceragric_usuario_id uuid not null unique references auth.users (id) on delete cascade,
  ceragric_administradores_fecha_registro timestamptz not null default now()
);

alter table public.ceragric_administradores enable row level security;
revoke all on public.ceragric_administradores from anon, authenticated;

create or replace function public.ceragric_es_administrador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ceragric_administradores
    where ceragric_usuario_id = (select auth.uid())
  );
$$;

revoke execute on function public.ceragric_es_administrador() from public, anon;
grant execute on function public.ceragric_es_administrador() to authenticated;

-- ============ Permisos del panel ============
-- La cédula, coordenadas y fechas de registro no se editan desde el panel.
grant select on public.ceragric_productores to authenticated;
grant update (
  ceragric_productores_nombres,
  ceragric_productores_apellido_paterno,
  ceragric_productores_apellido_materno,
  ceragric_productores_genero,
  ceragric_productores_fecha_nacimiento,
  ceragric_productores_estado_civil,
  ceragric_productores_nivel_estudio,
  ceragric_parroquia_id,
  ceragric_productores_recinto,
  ceragric_productores_telefono
) on public.ceragric_productores to authenticated;

create policy ceragric_productores_leer_administrador
  on public.ceragric_productores
  for select
  to authenticated
  using ((select public.ceragric_es_administrador()));

create policy ceragric_productores_editar_administrador
  on public.ceragric_productores
  for update
  to authenticated
  using ((select public.ceragric_es_administrador()))
  with check ((select public.ceragric_es_administrador()));

grant select on public.ceragric_provincias, public.ceragric_cantones, public.ceragric_parroquias to authenticated;

create policy ceragric_provincias_leer_administrador on public.ceragric_provincias
  for select to authenticated using ((select public.ceragric_es_administrador()));
create policy ceragric_cantones_leer_administrador on public.ceragric_cantones
  for select to authenticated using ((select public.ceragric_es_administrador()));
create policy ceragric_parroquias_leer_administrador on public.ceragric_parroquias
  for select to authenticated using ((select public.ceragric_es_administrador()));

-- ============ Tiempo real ============
alter publication supabase_realtime add table public.ceragric_productores;

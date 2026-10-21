-- Esquema inicial Ceragric: catálogo DPA (INEC 2015) y registro de productores.
-- Los datos del catálogo se cargan en la migración siguiente.

-- ============ Catálogo geográfico ============
create table public.ceragric_provincias (
  ceragric_provincias_id char(2) primary key,
  ceragric_provincias_nombre text not null
);

create table public.ceragric_cantones (
  ceragric_cantones_id char(4) primary key,
  ceragric_cantones_nombre text not null,
  ceragric_provincia_id char(2) not null references public.ceragric_provincias (ceragric_provincias_id)
);

create table public.ceragric_parroquias (
  ceragric_parroquias_id char(6) primary key,
  ceragric_parroquias_nombre text not null,
  ceragric_canton_id char(4) not null references public.ceragric_cantones (ceragric_cantones_id)
);

create index ceragric_cantones_provincia_idx on public.ceragric_cantones (ceragric_provincia_id);
create index ceragric_parroquias_canton_idx on public.ceragric_parroquias (ceragric_canton_id);

-- ============ Validación de cédula ecuatoriana (módulo 10) ============
create or replace function public.ceragric_cedula_es_valida(p_cedula text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_suma int := 0;
  v_producto int;
  v_provincia int;
begin
  if p_cedula is null or p_cedula !~ '^[0-9]{10}$' then
    return false;
  end if;

  v_provincia := substr(p_cedula, 1, 2)::int;
  if not (v_provincia between 1 and 24 or v_provincia = 30) then
    return false;
  end if;

  if substr(p_cedula, 3, 1)::int > 5 then
    return false;
  end if;

  for i in 1..9 loop
    v_producto := substr(p_cedula, i, 1)::int * (case when i % 2 = 1 then 2 else 1 end);
    v_suma := v_suma + (case when v_producto > 9 then v_producto - 9 else v_producto end);
  end loop;

  return (10 - v_suma % 10) % 10 = substr(p_cedula, 10, 1)::int;
end;
$$;

-- ============ Productores ============
create table public.ceragric_productores (
  ceragric_productores_id uuid primary key default gen_random_uuid(),
  ceragric_productores_cedula char(10) not null unique
    check (public.ceragric_cedula_es_valida(ceragric_productores_cedula)),
  ceragric_productores_nombres text not null
    check (char_length(ceragric_productores_nombres) between 1 and 80
           and ceragric_productores_nombres ~ '^[A-ZÁÉÍÓÚÜÑ'' -]+$'),
  ceragric_productores_apellido_paterno text not null
    check (char_length(ceragric_productores_apellido_paterno) between 1 and 60
           and ceragric_productores_apellido_paterno ~ '^[A-ZÁÉÍÓÚÜÑ'' -]+$'),
  ceragric_productores_apellido_materno text not null
    check (char_length(ceragric_productores_apellido_materno) between 1 and 60
           and ceragric_productores_apellido_materno ~ '^[A-ZÁÉÍÓÚÜÑ'' -]+$'),
  ceragric_productores_genero smallint not null
    check (ceragric_productores_genero in (1, 2)),
  ceragric_productores_fecha_nacimiento date not null
    check (ceragric_productores_fecha_nacimiento >= date '1900-01-01'),
  ceragric_productores_estado_civil smallint not null
    check (ceragric_productores_estado_civil between 1 and 5),
  ceragric_productores_nivel_estudio smallint not null
    check (ceragric_productores_nivel_estudio between 0 and 4),
  ceragric_parroquia_id char(6) not null references public.ceragric_parroquias (ceragric_parroquias_id),
  ceragric_productores_recinto text not null
    check (char_length(btrim(ceragric_productores_recinto)) between 1 and 120),
  ceragric_productores_latitud numeric(9, 6) not null
    check (ceragric_productores_latitud between -5.1 and 1.7),
  ceragric_productores_longitud numeric(9, 6) not null
    check (ceragric_productores_longitud between -92.1 and -75.1),
  ceragric_productores_fecha_registro timestamptz not null default now()
);

-- La edad mínima depende de la fecha actual (no inmutable), por eso se valida en trigger y no en CHECK.
create or replace function public.ceragric_productores_validar_edad()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.ceragric_productores_fecha_nacimiento > current_date - interval '18 years' then
    raise exception 'El productor debe ser mayor de edad' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger ceragric_productores_validar_edad_trg
  before insert or update on public.ceragric_productores
  for each row execute function public.ceragric_productores_validar_edad();

create index ceragric_productores_parroquia_idx on public.ceragric_productores (ceragric_parroquia_id);

comment on column public.ceragric_productores.ceragric_productores_genero is '1: hombre, 2: mujer';
comment on column public.ceragric_productores.ceragric_productores_estado_civil is '1: soltero/a, 2: casado/a, 3: unión de hecho, 4: divorciado/a, 5: viudo/a';
comment on column public.ceragric_productores.ceragric_productores_nivel_estudio is '0: sin respuesta, 1: primaria, 2: secundaria, 3: superior, 4: máster';
comment on column public.ceragric_productores.ceragric_productores_latitud is 'Capturada desde el navegador (Geolocation API), WGS84';
comment on column public.ceragric_productores.ceragric_productores_longitud is 'Capturada desde el navegador (Geolocation API), WGS84';

-- ============ Seguridad (RLS) ============
-- El público solo puede INSERTAR productores; nunca leer, modificar ni borrar.
alter table public.ceragric_provincias enable row level security;
alter table public.ceragric_cantones enable row level security;
alter table public.ceragric_parroquias enable row level security;
alter table public.ceragric_productores enable row level security;

revoke all on public.ceragric_provincias, public.ceragric_cantones, public.ceragric_parroquias,
  public.ceragric_productores from anon, authenticated;
grant insert on public.ceragric_productores to anon;

create policy ceragric_productores_insertar_publico
  on public.ceragric_productores
  for insert
  to anon
  with check (true);

-- ============ Vista de consulta (solo service_role / panel) ============
create view public.ceragric_productores_detalle
with (security_invoker = true) as
select
  pr.ceragric_productores_id,
  pr.ceragric_productores_cedula,
  pr.ceragric_productores_nombres,
  pr.ceragric_productores_apellido_paterno,
  pr.ceragric_productores_apellido_materno,
  case pr.ceragric_productores_genero when 1 then 'Hombre' when 2 then 'Mujer' end as ceragric_productores_genero_texto,
  pr.ceragric_productores_fecha_nacimiento,
  case pr.ceragric_productores_estado_civil
    when 1 then 'Soltero/a' when 2 then 'Casado/a' when 3 then 'Unión de hecho'
    when 4 then 'Divorciado/a' when 5 then 'Viudo/a' end as ceragric_productores_estado_civil_texto,
  case pr.ceragric_productores_nivel_estudio
    when 0 then 'Sin respuesta' when 1 then 'Primaria' when 2 then 'Secundaria'
    when 3 then 'Superior' when 4 then 'Máster' end as ceragric_productores_nivel_estudio_texto,
  pv.ceragric_provincias_nombre,
  ca.ceragric_cantones_nombre,
  pa.ceragric_parroquias_nombre,
  pr.ceragric_productores_recinto,
  pr.ceragric_productores_latitud,
  pr.ceragric_productores_longitud,
  pr.ceragric_productores_fecha_registro
from public.ceragric_productores pr
join public.ceragric_parroquias pa on pa.ceragric_parroquias_id = pr.ceragric_parroquia_id
join public.ceragric_cantones ca on ca.ceragric_cantones_id = pa.ceragric_canton_id
join public.ceragric_provincias pv on pv.ceragric_provincias_id = ca.ceragric_provincia_id;

revoke all on public.ceragric_productores_detalle from anon, authenticated;


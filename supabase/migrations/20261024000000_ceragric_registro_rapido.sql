-- Registro rápido desde el panel (cédula, nombre y teléfono). Los datos restantes quedan pendientes
-- y el administrador los completa desde el panel. El formulario público sigue exigiendo todos los campos.

alter table public.ceragric_productores
  add column ceragric_productores_tipo_registro smallint not null default 0
    check (ceragric_productores_tipo_registro in (0, 1));

comment on column public.ceragric_productores.ceragric_productores_tipo_registro is '0: completo, 1: registro rápido (panel, datos pendientes de completar)';

alter table public.ceragric_productores
  alter column ceragric_productores_apellido_paterno drop not null,
  alter column ceragric_productores_apellido_materno drop not null,
  alter column ceragric_productores_genero drop not null,
  alter column ceragric_productores_fecha_nacimiento drop not null,
  alter column ceragric_productores_estado_civil drop not null,
  alter column ceragric_productores_nivel_estudio drop not null,
  alter column ceragric_parroquia_id drop not null,
  alter column ceragric_productores_recinto drop not null,
  alter column ceragric_productores_latitud drop not null,
  alter column ceragric_productores_longitud drop not null;

-- Un registro completo exige todos los datos; uno rápido exige al menos el teléfono.
alter table public.ceragric_productores
  add constraint ceragric_productores_datos_completos_chk check (
    case ceragric_productores_tipo_registro
      when 0 then ceragric_productores_apellido_paterno is not null
        and ceragric_productores_apellido_materno is not null
        and ceragric_productores_genero is not null
        and ceragric_productores_fecha_nacimiento is not null
        and ceragric_productores_estado_civil is not null
        and ceragric_productores_nivel_estudio is not null
        and ceragric_parroquia_id is not null
        and ceragric_productores_recinto is not null
        and ceragric_productores_latitud is not null
        and ceragric_productores_longitud is not null
      else ceragric_productores_telefono is not null
    end
  );

-- La edad solo se valida si hay fecha de nacimiento.
create or replace function public.ceragric_productores_validar_edad()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.ceragric_productores_fecha_nacimiento is not null
     and new.ceragric_productores_fecha_nacimiento > current_date - interval '18 years' then
    raise exception 'El productor debe ser mayor de edad' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- Cuando el administrador completa todos los datos de un registro rápido, pasa a completo automáticamente.
create or replace function public.ceragric_productores_completar_registro_rapido()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.ceragric_productores_tipo_registro = 1
     and new.ceragric_productores_apellido_paterno is not null
     and new.ceragric_productores_apellido_materno is not null
     and new.ceragric_productores_genero is not null
     and new.ceragric_productores_fecha_nacimiento is not null
     and new.ceragric_productores_estado_civil is not null
     and new.ceragric_productores_nivel_estudio is not null
     and new.ceragric_parroquia_id is not null
     and new.ceragric_productores_recinto is not null
     and new.ceragric_productores_latitud is not null
     and new.ceragric_productores_longitud is not null then
    new.ceragric_productores_tipo_registro := 0;
  end if;
  return new;
end;
$$;

create trigger ceragric_productores_completar_registro_rapido_trg
  before update on public.ceragric_productores
  for each row execute function public.ceragric_productores_completar_registro_rapido();

-- ============ Permisos de inserción ============
drop policy ceragric_productores_insertar_publico on public.ceragric_productores;

create policy ceragric_productores_insertar_publico
  on public.ceragric_productores
  for insert
  to anon
  with check (ceragric_productores_tipo_registro = 0);

grant insert (
  ceragric_productores_cedula,
  ceragric_productores_nombres,
  ceragric_productores_telefono,
  ceragric_productores_tipo_registro
) on public.ceragric_productores to authenticated;

create policy ceragric_productores_registro_rapido_administrador
  on public.ceragric_productores
  for insert
  to authenticated
  with check ((select public.ceragric_es_administrador()) and ceragric_productores_tipo_registro = 1);

-- ============ Vista de consulta: incluye registros rápidos sin ubicación ============
create or replace view public.ceragric_productores_detalle
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
left join public.ceragric_parroquias pa on pa.ceragric_parroquias_id = pr.ceragric_parroquia_id
left join public.ceragric_cantones ca on ca.ceragric_cantones_id = pa.ceragric_canton_id
left join public.ceragric_provincias pv on pv.ceragric_provincias_id = ca.ceragric_provincia_id;

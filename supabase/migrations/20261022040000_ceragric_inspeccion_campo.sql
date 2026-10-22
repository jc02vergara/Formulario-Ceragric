-- Marca de inspección en campo, gestionada desde el panel.
alter table public.ceragric_productores
  add column ceragric_productores_inspeccionado boolean not null default false,
  add column ceragric_productores_fecha_inspeccion timestamptz;

comment on column public.ceragric_productores.ceragric_productores_inspeccionado is 'true: productor inspeccionado en campo';
comment on column public.ceragric_productores.ceragric_productores_fecha_inspeccion is 'Se asigna automáticamente al marcar la inspección y se limpia al desmarcarla';

-- La fecha de inspección la controla la base: no se puede enviar a mano desde el cliente.
create or replace function public.ceragric_productores_registrar_inspeccion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.ceragric_productores_inspeccionado := false;
    new.ceragric_productores_fecha_inspeccion := null;
  elsif new.ceragric_productores_inspeccionado is distinct from old.ceragric_productores_inspeccionado then
    new.ceragric_productores_fecha_inspeccion := case when new.ceragric_productores_inspeccionado then now() end;
  else
    new.ceragric_productores_fecha_inspeccion := old.ceragric_productores_fecha_inspeccion;
  end if;
  return new;
end;
$$;

create trigger ceragric_productores_registrar_inspeccion_trg
  before insert or update on public.ceragric_productores
  for each row execute function public.ceragric_productores_registrar_inspeccion();

grant update (ceragric_productores_inspeccionado) on public.ceragric_productores to authenticated;

create index ceragric_productores_inspeccionado_idx on public.ceragric_productores (ceragric_productores_inspeccionado);

-- Los administradores pueden eliminar registros desde el panel.
grant delete on public.ceragric_productores to authenticated;

create policy ceragric_productores_eliminar_administrador
  on public.ceragric_productores
  for delete
  to authenticated
  using ((select public.ceragric_es_administrador()));

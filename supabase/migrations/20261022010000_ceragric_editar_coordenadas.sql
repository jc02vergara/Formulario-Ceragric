-- Los administradores pueden corregir las coordenadas GPS desde el panel.
grant update (ceragric_productores_latitud, ceragric_productores_longitud)
  on public.ceragric_productores to authenticated;

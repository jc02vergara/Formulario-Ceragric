# Formulario Ceragric S.A.S.

Formulario público de registro de productores para la certificación Rainforest Alliance.
Sitio estático (GitHub Pages) que inserta directamente en Supabase.

## Estructura

```text
index.html                         # Página única del formulario
src/
 ├── main.js                       # Entry point
 ├── core/config.js                # URL y publishable key de Supabase
 ├── assets/                       # Estilos y catálogo DPA del INEC (provincia > cantón > parroquia)
 ├── shared/utils/                 # Validación de cédula (módulo 10) y utilidades de texto
 └── modules/public/registro-productor/
      ├── catalogos.js             # Valores numéricos de género, estado civil, nivel de estudio
      ├── components/              # Selects en cascada y captura GPS
      ├── pages/                   # Controlador del formulario
      └── services/                # Inserción en Supabase (REST)
supabase/migrations/               # Esquema, catálogo DPA y políticas RLS
```

## Puesta en marcha

1. Aplicar `supabase/migrations/*.sql` en el proyecto Supabase.
2. Completar `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` en `src/core/config.js`.
3. GitHub → Settings → Pages → Deploy from branch `master` / root.

## Seguridad

- El rol `anon` solo tiene `INSERT` sobre `ceragric_productores`; no puede leer, editar ni borrar.
- La base valida cédula (módulo 10), rangos, formato de nombres, edad mínima (18) y coordenadas dentro de Ecuador.
- Las respuestas se consultan desde el panel de Supabase en la vista `ceragric_productores_detalle`.

## Catálogo geográfico

DPA del INEC (2015) obtenida del paquete MIT [`ec-atlas`](https://www.npmjs.com/package/ec-atlas):
24 provincias, 221 cantones, 1037 parroquias (excluye zonas no delimitadas).

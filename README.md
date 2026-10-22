# Formulario Ceragric S.A.S.

Formulario público de registro de productores para la certificación Rainforest Alliance.
Sitio estático (GitHub Pages) que inserta directamente en Supabase.

## Estructura

```text
index.html                         # Formulario público
panel/index.html                   # Panel privado (login de administradores)
src/
 ├── main.js / panel.js            # Entry points
 ├── core/config.js                # URL y publishable key de Supabase
 ├── core/supabase-cliente.js      # Cliente supabase-js (auth + tiempo real) para el panel
 ├── assets/                       # Estilos, catálogo DPA del INEC y supabase-js 2.45.4 (vendor)
 ├── shared/                       # Catálogos, selector provincia > cantón > parroquia, cédula, texto
 └── modules/
      ├── public/registro-productor/   # Formulario: captura GPS, controlador e inserción (REST)
      └── private/panel-productores/   # Panel: tabla en vivo, diálogo de edición, sesión
supabase/migrations/               # Esquema, catálogo DPA y políticas RLS
```

## Puesta en marcha

Proyecto Supabase: `Ceragric` (`vmozwtdacmroznlxdkzl`, sa-east-1), migraciones ya aplicadas.

1. Migraciones en `supabase/migrations/` (esquema + catálogo DPA).
2. URL y publishable key en `src/core/config.js`; provincia preseleccionada: Los Ríos.
3. GitHub → Settings → Pages → Deploy from branch `master` / root.

## Seguridad

- El rol `anon` solo tiene `INSERT` sobre `ceragric_productores`; no puede leer, editar ni borrar.
- La base valida cédula (módulo 10), rangos, formato de nombres, edad mínima (18) y coordenadas dentro de Ecuador.
- Panel en `/panel/`: solo usuarios de Supabase Auth registrados en `ceragric_administradores` pueden leer y editar.
  Editables: nombres, apellidos, género, fecha de nacimiento, estado civil, nivel de estudio, ubicación, recinto,
  teléfono, latitud y longitud. No editables: cédula y fecha de registro.
- Acciones por fila: WhatsApp (celulares 09…), llamar, Google Maps, cómo llegar, copiar cédula/ficha y eliminar
  (con confirmación; la eliminación es definitiva).
- Alta de administrador: crear el usuario en Supabase (Authentication → Users → Add user) y luego
  `insert into ceragric_administradores (ceragric_usuario_id) select id from auth.users where email = '<correo>';`

## Catálogo geográfico

DPA del INEC (2015) obtenida del paquete MIT [`ec-atlas`](https://www.npmjs.com/package/ec-atlas):
24 provincias, 221 cantones, 1037 parroquias (excluye zonas no delimitadas).

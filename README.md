# MG Performance — Tienda de iPhones + sistema de gestión

Web con estilo iOS + neumorfismo y animaciones de **React Bits** (Aurora, BlurText, SpotlightCard, StarBorder, ClickSpark, CountUp, ShinyText) y **ElevenLabs UI** (Orb, ShimmeringText).

## Qué tiene

**Tienda (pública)**
- Fondo violeta/azul/negro estilo iPhone, portada con iPhones 3D y "Entregá tu usado".
- Listado estilo Mercado Libre con filtros por condición, modelo, batería, capacidad y precio.
- Publicación estilo Mercado Libre: fotos y videos a la izquierda; precio, batería y "Contactanos" (WhatsApp) a la derecha.
- **Diagnóstico 3D**: un iPhone 3D del color del equipo que se gira con el dedo; los rayones son puntos naranjas que abren su video o foto.
- Reseñas de clientes (se cargan desde el sistema).
- **Cotizador de usados** (`/#/cotizar`): el cliente elige modelo, batería y estado y ve al instante cuánto se lo toman; lo manda por WhatsApp.
- **Avisame cuando entre**: si no está el modelo, deja sus datos.
- Precios en pesos con el dólar blue (compra) del día.

**Sistema de gestión (`/#/admin`)** — estilo barbería
- Pantalla "¿Quién está usando el sistema?" con un cuadradito por persona y **clave de 4 números**.
- **Vendedores** (Alte, Tito, Tomás): inicio con su comisión, clientes (CRM con botón de WhatsApp), calendario del mes con recordatorios, y registro de ventas eligiendo entre los equipos publicados.
- **Matías (dueño)**: lo mismo que un vendedor + **Modo dueño** (con **Interesados**: cotizaciones y avisos de la web con botón de WhatsApp, y **Cotizador** para ajustar los valores): panel con filtro por fechas (ventas, cuánto le rinden, comisiones de los chicos y propias, publicidad, inversión, balance, ventas mensuales), ventas de todos, publicidad, inversión (equipos que entran) y equipo (claves).
- **Inventario** (abajo a la derecha en la pantalla de ingreso): carga y edición de publicaciones con fotos, videos y diagnóstico 3D, "Cargar lista" para subir muchos equipos de una, y reseñas.
- **Comisión = precio de venta − precio a rendir** (la lista de precios de Matías). El stock se descuenta solo con cada venta.

## Puesta en marcha

### Base de datos (Supabase → SQL Editor → New query → pegar → Run)
Correr en este orden (cada archivo se puede repetir sin romper nada):
1. [`supabase/schema.sql`](supabase/schema.sql) — base inicial (si ya lo corriste, saltealo).
2. [`supabase/actualizacion-1.sql`](supabase/actualizacion-1.sql) — diagnóstico 3D, reseñas y publicaciones de ejemplo.
3. [`supabase/actualizacion-2.sql`](supabase/actualizacion-2.sql) — sistema estilo barbería: perfiles con clave, clientes, calendario, publicidad, inversión.
4. [`supabase/actualizacion-3.sql`](supabase/actualizacion-3.sql) — cotizador de usados e Interesados (cotizaciones y "avisame cuando entre").

### Claves iniciales (cambialas desde Modo dueño → Equipo)
| Perfil | Clave |
|---|---|
| Alte | 1111 |
| Tito | 2222 |
| Tomás | 3333 |
| Matías (dueño) | 7777 |
| Inventario | 9999 |

### Publicaciones de ejemplo
Para borrarlas cuando cargues las reales:
```sql
delete from public.products where id::text like '00000000-0000-4000-8000-%';
```

### Datos de la tienda
Editá [`src/config.js`](src/config.js): número de **WhatsApp** (formato `5491112345678`), Instagram, ciudad y moneda.

## Publicar la web (GitHub Pages)
1. En GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Cada vez que se actualiza la rama `main`, la web se publica sola en `https://<usuario>.github.io/mgperformance/`.

También funciona en Netlify o Vercel (build: `npm run build`, carpeta: `dist`).

## Desarrollo
```bash
npm install
npm run dev               # usa la base real de Supabase
VITE_DEMO=true npm run dev  # modo demo: datos de ejemplo guardados en el navegador
```
En modo demo se usan las mismas claves de la tabla de arriba.

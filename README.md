# MG Performance — Tienda de iPhones + sistema de gestión

Web con estilo iOS + neumorfismo y animaciones de **React Bits** (Aurora, BlurText, SpotlightCard, StarBorder, ClickSpark, CountUp, ShinyText) y **ElevenLabs UI** (Orb, ShimmeringText).

## Qué tiene

**Tienda (pública)**
- Catálogo categorizado por condición: Nuevo sellado, Como nuevo, Usado premium, Usado.
- Filtros: batería mínima (+80/+85/+90/+95/100%), rango de precio, capacidad, modelo, orden y “ocultar vendidos”.
- Ficha de cada equipo con fotos y videos propios, batería, garantía y qué incluye.
- “Mi selección”: el cliente arma una lista y la manda por WhatsApp, o consulta un solo equipo directo desde su publicación. No hay pago online.

**Sistema de gestión (`/#/admin`)**
- **Empleados**: cargan publicaciones (fotos/videos), registran sus ventas y ven su comisión y lo que tienen que rendir.
- **Dueño**: dashboard con facturación, rendiciones, comisiones, pendiente de cobrar, gráfico de 14 días, ranking del equipo; define el **precio a rendir** de cada equipo; marca rendiciones como cobradas; activa/desactiva empleados; exporta ventas a Excel.
- **Comisión = precio de venta − precio a rendir.**
- **Stock automático**: cada venta descuenta una unidad; en 0 la publicación pasa sola a “Vendido”. Si se anula la venta, el stock vuelve.

## Puesta en marcha (una sola vez)

### 1. Crear la base de datos en Supabase
1. Entrá a [supabase.com](https://supabase.com) → tu proyecto → **SQL Editor** → **New query**.
2. Pegá todo el contenido de [`supabase/schema.sql`](supabase/schema.sql) y tocá **Run**.
3. Recomendado: **Authentication → Sign In / Providers → Email** → desactivá **Confirm email** (igual el dueño tiene que activar a cada empleado, así que no hace falta el mail de confirmación).

### 2. Crear la cuenta del dueño
1. Abrí la web en `/#/admin` → **Soy nuevo** → creá tu cuenta.
2. En Supabase → SQL Editor, corré (con tu email):
   ```sql
   update public.profiles set role = 'owner', active = true where email = 'tu-email@gmail.com';
   ```
3. Recargá la web: ya entrás como dueño.

### 3. Sumar empleados
Cada empleado entra a `/#/admin` → **Soy nuevo** y crea su cuenta. Después vos lo activás en **Equipo**.

### 4. Datos de la tienda
Editá [`src/config.js`](src/config.js): número de **WhatsApp** (formato `5491112345678`), Instagram, ciudad, moneda (USD/ARS) y textos de las condiciones.

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
En modo demo, el dueño entra con la contraseña `admin` y los empleados con `1234`.

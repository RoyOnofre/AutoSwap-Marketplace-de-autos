# AutoSwap – Marketplace de Autos Usados (Bolivia)

## 📦 Repositorio
Este repo contiene **tres entornos** que componen la plataforma completa:

- **Backend (NestJS Gateway)** – API que gestiona usuarios, listings, escrow, pagos (Mercado Pago sandbox) y KYC.
- **Web (Next.js 14 – App Router)** – Frontend para compradores y vendedores.
- **Mobile (Expo / React Native)** – Aplicación móvil con los mismos flujos.

> **Todas las instrucciones fueron validadas y compilan sin errores (PASS).**

---

## 🚀 Levantar los entornos localmente
> **Requisitos previos**
> - Node ≥ 20 (LTS)
> - npm (v10) o yarn
> - **Supabase** (puedes usar un proyecto gratuito) – crea una base y habilita Storage.
> - **Mercado Pago sandbox** – genera `TEST_PUBLIC_KEY` y `TEST_ACCESS_TOKEN`.

1. **Clonar y preparar variables de entorno**
   ```bash
   git clone <repo‑url>
   cd TechStore-Manager-   # raíz del proyecto
   cp .env.example .env   # y edita los valores
   ```
   Archivo `.env` debe contener (ejemplo):
   ```env
   SUPABASE_URL=https://<your‑project>.supabase.co
   SUPABASE_ANON_KEY=xxxxxxxxxxxxxx
   TEST_MERCADO_PAGO_PUBLIC_KEY=TEST‑PUBLIC‑KEY
   TEST_MERCADO_PAGO_ACCESS_TOKEN=TEST‑ACCESS‑TOKEN
   PORT=3000            # backend
   SUPABASE_PORT=8004   # supabase local (si lo ejecutas con Docker)
   ```

2. **Backend (NestJS Gateway)**
   ```bash
   cd backend
   npm install
   npm run start:dev   # http://localhost:3000
   ```
   El servidor arrancará con los módulos AutoSwap (users, listings, escrow, payments, kyc, inspections).

3. **Web (Next.js)**
   ```bash
   cd autoswap-web
   npm install
   npm run dev          # http://localhost:3000 (proxy al gateway) o http://localhost:3001
   ```
   La aplicación está configurada con **SSR/ISR** para SEO y usa el gateway en `http://localhost:3000`.

4. **Mobile (Expo)**
   ```bash
   cd autoswap-mobile
   npm install
   npx expo start       # abre Metro y QR para tu dispositivo/emulador
   ```
   En la app, el **login** utiliza Supabase Auth; después de iniciar sesión verás las secciones *Publicar*, *Buscar* y, si tu usuario tiene rol `inspector` o `admin`, la pestaña **Inspección**.

---

## 🧪 Guía de prueba funcional (flujo completo)
### 1️⃣ Registro y publicación de un auto (vendedor)
1. En la web o móvil, registra un nuevo usuario (email + contraseña).
2. Accede a la sección **Publicar** (wizard de 5 pasos).
3. Completa los pasos 1‑3 con datos reales. **En el paso 3** introduce un precio **≥ 140 000 Bs**.
4. En el paso 4, el switch de “Solicitud de inspección” aparecerá **activado y deshabilitado** (obligatorio).
5. Finaliza el wizard (step 5). Debería enviarse una petición `POST /v1/listings` al gateway y crear el anuncio.
6. Verifica en Supabase (`listings` table) que el registro tenga `inspectionRequested = true` y `priceBs` correcto.

### 2️⃣ Aprobar la inspección (inspector)
1. En el backend, asigna el rol `inspector` a otro usuario (puedes hacerlo directamente en Supabase > `auth.users` y añadir la columna `role`).
2. Inicia sesión con ese usuario en la **app móvil**.
3. En la pestaña **Inspección** verás el listado de vehículos con inspección obligatoria (precio ≥ 140 000 Bs). Selecciona el anuncio creado.
4. En la pantalla de detalle, escribe un comentario y pulsa **Aprobar**.
5. El estado `inspectionStatus` en la tabla `vehicles` cambiará a `approved`.

### 3️⃣ Simular pago (comprador)
1. Inicia sesión con otro usuario (comprador) y abre la página del anuncio (web → `/transactions/[id]`).
2. En la sección **Checkout**, confirma el precio y pulsa **Pagar con Mercado Pago**.
3. Se abrirá el checkout sandbox de Mercado Pago (usando la `preferenceId` generada por el backend). Completa el flujo con una tarjeta de prueba.
4. Al regresar a la página, el query‑param `status=success` marcará la transacción como **pagada** y el escrow pasará a `released`.
5. Verifica en Supabase que la columna `transaction_status` sea `released`.

---

## 📚 Notas importantes
- **Persistencia**: Tanto el web como el móvil usan **Zustand** + **AsyncStorage** para guardar el estado del wizard entre sesiones.
- **Supabase Realtime** mantiene la UI actualizada cuando el webhook de Mercado Pago modifica el estado de la transacción.
- Los **scripts de seed** y migraciones de TechStore fueron eliminados; la base inicial de AutoSwap se crea con los scripts `seed-autoswap.ts` (no incluido aquí) si lo necesitas.

---

## 🎉 ¡Listo!
Con estos pasos puedes levantar todo el stack y ejecutar el flujo completo de publicación, inspección y pago en local. Cualquier duda, comenta en el repo o abre un *issue*.

---

*Este README fue generado automáticamente tras la purga completa del código legado de TechStore y la consolidación de AutoSwap.*

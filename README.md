# 🎮 Trivial Retro

Juego de preguntas y respuestas con estilo retro pastel, construido con Next.js 14, TypeScript, Tailwind CSS, NextAuth.js y Supabase.

## Características

- 4 temas: Historia 🏛️, Geografía 🌍, Matemáticas 🔢, Cine 🎬
- Preguntas generadas desde Wikipedia en español + banco estático de respaldo
- Autenticación con Google OAuth (NextAuth.js)
- Puntuación guardada automáticamente en Supabase (PostgreSQL)
- Diseño retro pastel, responsive para móvil y escritorio

---

## Requisitos

- Node.js 18+
- npm 9+
- Cuenta en [Google Cloud Console](https://console.cloud.google.com/) (OAuth)
- Proyecto en [Supabase](https://app.supabase.com/)

---

## Instalación

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repo>
cd trivial-app
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales reales.

### 3. Configurar la base de datos en Supabase

1. Ir a [app.supabase.com](https://app.supabase.com/) → tu proyecto → **SQL Editor**
2. Copiar y ejecutar el contenido de `supabase/migrations/001_init.sql`
3. Verificar que se crearon las tablas `player_profiles` y `score_history`

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Configuración detallada

### Google OAuth (Google Cloud Console)

1. Ir a [console.cloud.google.com](https://console.cloud.google.com/)
2. Crear un proyecto → **APIs & Services → Credentials**
3. **Create Credentials → OAuth 2.0 Client ID** → tipo: **Web application**
4. Agregar en **Authorized redirect URIs**:
   - Desarrollo: `http://localhost:3000/api/auth/callback/google`
   - Producción: `https://tu-dominio.com/api/auth/callback/google`
5. Copiar **Client ID** y **Client Secret** al `.env.local`
6. Habilitar la **Google People API** en APIs & Services → Library

### Supabase

1. Ir a [app.supabase.com](https://app.supabase.com/) → **Settings → API**
2. Copiar:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **NUNCA** expongas `SUPABASE_SERVICE_ROLE_KEY` en el frontend.

### NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXTAUTH_SECRET` | Secreto para cifrar tokens JWT |
| `NEXTAUTH_URL` | URL base de la app (`http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | ID del cliente OAuth de Google |
| `GOOGLE_CLIENT_SECRET` | Secreto del cliente OAuth de Google |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service_role (solo servidor) |
| `WIKIPEDIA_API_BASE` | `https://es.wikipedia.org/api/rest_v1` |

---

## Estructura del proyecto

```
/app
  /api
    /auth/[...nextauth]   → NextAuth con Google OAuth
    /questions            → Preguntas vía Wikipedia + validación segura
    /player               → CRUD del jugador en Supabase
  /(auth)/login           → Página de login retro
  /(game)/welcome         → Bienvenida + historial
  /(game)/play            → Juego principal
/components
  /ui                     → BotonRetro, Modal, SessionProvider
  /game                   → SeleccionTema, TarjetaPregunta, Marcador, Modales
/lib
  /supabase.ts            → Clientes Supabase (servidor y cliente)
  /wikipedia.ts           → Servicio Wikipedia con rotación y caché
  /types.ts               → Tipos TypeScript compartidos
/supabase/migrations/001_init.sql   → SQL para tablas y RLS
middleware.ts             → Protección de rutas del juego
```

---

## Flujo del juego

1. **Login** → Autenticación con Google
2. **Bienvenida** → Ver historial, editar nombre de jugador
3. **Juego**:
   - Elegir tema: Historia / Geografía / Matemáticas / Cine
   - Responder pregunta (4 opciones A-B-C-D)
   - ✅ Correcta: +2 puntos, siguiente pregunta del mismo tema
   - ❌ Incorrecta: -1 punto, volver a elegir tema
4. Puntuación guardada automáticamente en Supabase

---

## Comandos disponibles

```bash
npm run dev      # Servidor de desarrollo (http://localhost:3000)
npm run build    # Build de producción
npm run start    # Iniciar servidor de producción
npm run lint     # Verificar código con ESLint
```

---

## Despliegue en Vercel

1. Push del código a GitHub
2. Importar en [vercel.com](https://vercel.com/)
3. Agregar variables de entorno en Settings → Environment Variables
4. Actualizar `NEXTAUTH_URL` con la URL de producción
5. Agregar la URL de producción a las Authorized redirect URIs en Google Cloud

---

## Tecnologías

- [Next.js 14](https://nextjs.org/) + App Router
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [NextAuth.js](https://next-auth.js.org/) — Google OAuth
- [Supabase](https://supabase.com/) — PostgreSQL + RLS
- [Wikipedia REST API](https://es.wikipedia.org/api/rest_v1/)
- Fuentes: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) + [Courier Prime](https://fonts.google.com/specimen/Courier+Prime)

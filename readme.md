# hackalocal2
# Social Clean — Plan de implementación

## Resumen
App web PWA para gestión comunitaria de residuos y problemas ambientales. Feed social + mapa interactivo + IA + gamificación. Hackathon: "Sistema de Monitoreo y Alerta de Ecosistemas Costeros".

## Stack
- **Frontend**: React Native + Expo + Expo Router + TypeScript + NativeWind (o TailwindCSS)
- **Mapas**: react-native-maps (móvil) + react-leaflet (web)
- **Backend/DB/Auth/Storage/Realtime**: Supabase
- **IA**: (Pospuesto para siguientes fases)
- **QR**: react-native-qrcode-svg (generación) + expo-camera (escaneo)
- **Charts**: react-native-chart-kit o victory-native
- **Deploy**: Vercel (web) + Expo EAS (iOS/Android)

## Estructura de carpetas
```text
social-clean/
├── app/
│   ├── _layout.tsx             # Layout global
│   ├── (tabs)/                 # Bottom nav: tabs usando Expo Router
│   │   ├── _layout.tsx
│   │   ├── index.tsx           # Feed (Inicio)
│   │   ├── map.tsx             # Mapa
│   │   ├── report.tsx          # Reportar
│   │   ├── rewards.tsx         # Recompensas
│   │   └── profile.tsx         # Perfil
│   └── +not-found.tsx
├── components/
│   ├── feed/
│   │   ├── FeedCard.tsx        # Card de reporte en feed
│   │   └── FeedList.tsx
│   ├── map/
│   │   ├── NativeMap.tsx       # react-native-maps para móvil
│   │   └── WebMap.tsx          # react-leaflet para web
│   │   └── ReportMarker.tsx    # Marcador custom por categoría
│   ├── report/
│   │   ├── PhotoCapture.tsx    # Captura de foto en móvil/web
│   │   └── AIClassifier.tsx    # (Pospuesto)
│   ├── ui/
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   └── ...
├── hooks/
│   ├── useAuth.ts
│   └── useReports.ts           # Supabase Realtime
├── lib/
│   ├── supabase.ts             # Supabase Client
│   └── openai.ts               # (Pospuesto para siguientes fases)
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
├── app.json                    # Configuración Expo App
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Base de datos Supabase (SQL)

```sql
-- ENUMS
create type user_role as enum ('citizen', 'authority', 'business', 'organization');
create type report_category as enum ('trash', 'water', 'wildlife', 'electronic', 'organic', 'other');
create type report_status as enum ('pending', 'in_progress', 'resolved');
create type task_status as enum ('open', 'assigned', 'completed', 'verified');

-- PROFILES (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  role user_role default 'citizen',
  eco_points int default 0,
  level int default 1,
  location_lat float,
  location_lng float,
  notification_radius_km int default 2,
  language text default 'es',
  accessible_mode boolean default false,
  created_at timestamptz default now()
);

-- REPORTS (publicaciones/reportes en el feed y mapa)
create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  category report_category not null,
  status report_status default 'pending',
  severity int default 1 check (severity between 1 and 5),
  latitude float not null,
  longitude float not null,
  address text,
  photo_url text,
  photo_after_url text,
  ai_classification jsonb,
  likes_count int default 0,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- TASKS (servicios comunitarios derivados de reportes)
create table tasks (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade,
  title text not null,
  description text,
  status task_status default 'open',
  points_reward int default 10,
  max_volunteers int default 10,
  scheduled_at timestamptz,
  completed_at timestamptz,
  verified_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- TASK_VOLUNTEERS (usuarios asignados a tareas)
create table task_volunteers (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  completed boolean default false,
  unique(task_id, user_id)
);

-- REWARDS (cupones de empresas/instituciones)
create table rewards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  points_cost int not null,
  quantity_available int default 100,
  image_url text,
  valid_until timestamptz,
  created_at timestamptz default now()
);

-- REWARD_CLAIMS (cupones canjeados con QR único)
create table reward_claims (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid references rewards(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  qr_code text unique not null,
  redeemed boolean default false,
  redeemed_at timestamptz,
  created_at timestamptz default now()
);

-- EVENTS (jornadas de limpieza)
create table events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  latitude float not null,
  longitude float not null,
  scheduled_at timestamptz not null,
  duration_hours int default 3,
  points_reward int default 50,
  max_participants int default 50,
  created_at timestamptz default now()
);

-- EVENT_PARTICIPANTS
create table event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  attended boolean default false,
  unique(event_id, user_id)
);

-- REPORT_LIKES
create table report_likes (
  report_id uuid references reports(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (report_id, user_id)
);

-- RLS POLICIES
alter table profiles enable row level security;
alter table reports enable row level security;
alter table tasks enable row level security;
alter table task_volunteers enable row level security;
alter table rewards enable row level security;
alter table reward_claims enable row level security;
alter table events enable row level security;
alter table event_participants enable row level security;
alter table report_likes enable row level security;

-- Profiles: read public, update own
create policy "Public profiles" on profiles for select using (true);
create policy "Update own profile" on profiles for update using (auth.uid() = id);

-- Reports: read all, create authenticated, update own or authority
create policy "Read reports" on reports for select using (true);
create policy "Create reports" on reports for insert with check (auth.uid() = user_id);
create policy "Update own reports" on reports for update using (
  auth.uid() = user_id or
  exists (select 1 from profiles where id = auth.uid() and role = 'authority')
);

-- Tasks: read all, create authority/org, update authority
create policy "Read tasks" on tasks for select using (true);
create policy "Create tasks" on tasks for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('authority', 'organization'))
);

-- Volunteers: read all, join authenticated
create policy "Read volunteers" on task_volunteers for select using (true);
create policy "Join task" on task_volunteers for insert with check (auth.uid() = user_id);

-- Rewards: read all, create business
create policy "Read rewards" on rewards for select using (true);
create policy "Create rewards" on rewards for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'business')
);

-- Claims: read own
create policy "Read own claims" on reward_claims for select using (auth.uid() = user_id);
create policy "Create claim" on reward_claims for insert with check (auth.uid() = user_id);

-- Events: read all, create authority/org
create policy "Read events" on events for select using (true);
create policy "Create events" on events for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('authority', 'organization'))
);

-- Participants: read all, join authenticated
create policy "Read participants" on event_participants for select using (true);
create policy "Join event" on event_participants for insert with check (auth.uid() = user_id);

-- Likes
create policy "Read likes" on report_likes for select using (true);
create policy "Toggle like" on report_likes for insert with check (auth.uid() = user_id);
create policy "Remove like" on report_likes for delete using (auth.uid() = user_id);

-- FUNCTIONS
create or replace function add_eco_points(p_user_id uuid, p_points int)
returns void as $$
begin
  update profiles
  set eco_points = eco_points + p_points,
      level = greatest(1, floor((eco_points + p_points) / 100)::int + 1)
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- INDEXES
create index idx_reports_location on reports(latitude, longitude);
create index idx_reports_category on reports(category);
create index idx_reports_status on reports(status);
create index idx_reports_created on reports(created_at desc);
create index idx_tasks_status on tasks(status);
create index idx_events_date on events(scheduled_at);

-- STORAGE BUCKETS
-- Crear en Supabase Dashboard:
-- 1. "report-photos" (public read, auth write, max 5MB, image/*)
-- 2. "avatars" (public read, auth write, max 2MB, image/*)
-- 3. "reward-images" (public read, business write, max 2MB, image/*)

-- REALTIME
-- Habilitar realtime en: reports, tasks, task_volunteers, events
```

## Navbar (5 tabs)
Estilo pill flotante tipo iOS. Tab central "Reportar" es un FAB circular elevado.
```
[ Inicio ] [ Mapa ] [ (+) Reportar ] [ Recompensas ] [ Perfil ]
```
El navbar se oculta cuando el usuario hace scroll down y reaparece al scroll up.

## Pantallas y flujos clave

### 1. INICIO (Feed)
- Lista de reportes tipo red social (card con foto, avatar, título, categoría badge, ubicación, likes, tiempo)
- Filtros: Todos | Cercanos | Recientes | Más apoyados
- Posts educativos marcados con badge especial (de instituciones/academia)
- Botón "Me uno" en reportes con tarea abierta (manda a detalle de tarea)
- Pull-to-refresh + infinite scroll
- Supabase Realtime: nuevos reportes aparecen en vivo

### 2. MAPA
- React Leaflet con OpenStreetMap, centrado en geolocalización del usuario
- Marcadores de colores por categoría (trash=rojo, water=azul, wildlife=amber, electronic=morado, organic=verde)
- Cluster de marcadores cuando hay muchos cercanos (react-leaflet-cluster)
- Tap en marcador → popup con info + botón "ver detalle"
- Filtros por categoría (pills horizontales arriba del mapa)
- Filtro por estado (pending/in_progress/resolved)
- Capa de mapa de calor toggle (solo autoridades)
- Rutas: cuando un usuario se asigna a una tarea, mostrar ruta desde su ubicación hasta el punto (Leaflet Routing Machine o polyline simple)
- FAB en mapa para crear reporte rápido (selecciona punto en mapa)

### 3. REPORTAR (pantalla central)
- Paso 1: Tomar foto o seleccionar de galería
- Paso 2: Usuario selecciona manualmente la categoría y gravedad del incidente.
- Paso 3: Usuario confirma/edita clasificación, agrega descripción
- Paso 4: Ubicación (geolocalización auto o selección manual en mini-mapa)
- Paso 5: Publicar → +10 ecopuntos
- (Pospuesto: Reporte por voz e IA)

### 4. RECOMPENSAS
- Saldo de ecopuntos arriba
- Lista de cupones disponibles (cards con imagen, puntos requeridos, empresa, vencimiento)
- Tap → detalle del cupón → botón "Canjear" (descuenta puntos, genera QR único)
- Mis cupones canjeados (con QR para mostrar en comercio)
- QR: string = `sc_claim_{claim_id}_{timestamp}` → qrcode.react genera visual
- Escaneo: comercio escanea con html5-qrcode → marca como redeemed
- Ranking/Leaderboard: top 10 usuarios con más ecopuntos del mes
- Sección eventos: jornadas de limpieza próximas con inscripción

### 5. PERFIL
- Avatar, nombre, rol badge, nivel "Eco-Guardián Nivel X"
- Stats: reportes hechos, tareas completadas, ecopuntos totales, kg estimados reciclados
- Historial: mis reportes + mis tareas
- Configuración:
  - Idioma: español / yaqui (i18n con archivos JSON)
  - Modo accesible: textos grandes, contraste alto, navegación simplificada
  - Radio de notificaciones (slider 1-10 km)
  - Notificaciones on/off

### 6. DASHBOARD (solo rol authority)
- Reemplaza tab "Inicio" en el navbar para autoridades
- 4 metric cards: reportes activos, resueltos hoy, zonas críticas, participación ciudadana
- Gráfica de tendencia (reportes por semana últimas 8 semanas) con recharts
- Gráfica de distribución por categoría (pie chart)
- Mapa de calor integrado
- Lista de tareas pendientes de validación
- Botón crear evento/jornada de limpieza

## Requisitos del hackathon → Cobertura

| Requisito | Feature en Social Clean |
|-----------|----------------------|
| Ecosistema digital (ciudadanos, gobierno, empresas, organizaciones) | 4 roles con vistas diferenciadas |
| Gestión de residuos | Reportes con clasificación manual |
| Economía circular | Marketplace implícito: reportes + recompensas de empresas recicladoras |
| Monitoreo ambiental | Mapa con reportes en tiempo real + mapa de calor |
| Accesibilidad | Modo accesible, textos grandes, alto contraste |
| Bajo nivel tecnológico | Flujos de máximo 3 pasos, reporte por voz |
| Multilingüe | Español + Yaqui |
| Dashboards/analítica | Dashboard autoridades (react-native-chart-kit) |
| IA | (Pospuesta para iteraciones futuras) |
| Impacto medible | Métricas automáticas: reportes, kg, ecopuntos, participación |

## Verificación de tareas
- Usuario toma foto "después" de limpiar → se compara visualmente con foto original
- Autoridad o segundo usuario cercano puede validar (botón "Verificar limpieza")
- Al verificar: +puntos al voluntario, reporte cambia a "resolved"

## Soporte Offline / Multiplataforma
- App web, iOS y Android generada vía Expo
- Cache: AsyncStorage o SQLite para soporte offline en móviles
- Reportes offline: se guardan localmente, se sincronizan al recuperar conexión
- Banner "Sin conexión — los reportes se enviarán al reconectar"

## Flujo de ecopuntos
- Crear reporte: +10 pts
- Completar tarea: +20-50 pts (según dificultad)
- Asistir a evento: +50 pts
- Verificar tarea de otro: +5 pts
- Niveles: Nivel = floor(puntos/100) + 1
- Nombres: Nivel 1 "Eco-Iniciado", 2 "Eco-Activo", 3 "Eco-Guardián", 4 "Eco-Líder", 5+ "Eco-Héroe"

## Colores de la app
- Primary: #1D9E75 (verde teal — sostenibilidad)
- Accent: #D85A30 (coral — para CTAs y botón reportar)
- Categorías: trash=#E24B4A, water=#378ADD, wildlife=#BA7517, electronic=#7F77DD, organic=#1D9E75
- Estados: pending=#FAEEDA, in_progress=#E6F1FB, resolved=#E1F5EE

## Variables de entorno
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
# EXPO_PUBLIC_OPENAI_API_KEY= (Pospuesto)
```

## Orden de implementación (prioridad hackathon)
1. Setup: Expo + React Native + Expo Router + Supabase
2. Auth: login/registro con Supabase Auth + tabla profiles
3. Navbar + Layout
4. Feed: listar reportes + crear reporte con foto
5. Mapa: react-leaflet + marcadores + filtros
6. (Pospuesto) IA: clasificación de imagen
7. Tareas: asignarse + completar + verificar
8. Recompensas: cupones + QR
9. Dashboard autoridades
10. Accesibilidad + i18n
11. PWA + offline
12. Polish UI + demo
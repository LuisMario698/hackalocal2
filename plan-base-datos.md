# Plan: Base de Datos Supabase — Social Clean

## Contexto

App "Social Clean" para gestion comunitaria de residuos y problemas ambientales en Puerto Penasco, Sonora. Necesita esquema SQL completo para Supabase con sistema de 3 roles + permisos de verificacion.

## Sistema de Roles

| Rol | Descripcion |
|-----|-------------|
| `client` | Usuario regular. Crea reportes, participa en servicios, canjea recompensas, compra/vende en marketplace |
| `association` | Asociacion civil/ONG. Crea servicios comunitarios, ofrece recompensas, gestiona miembros |
| `admin` | Administrador del sistema. Acceso total, otorga permisos de verificacion |

## Sistema de Verificacion de Reportes

### Flujo
1. Un **client** crea un reporte → status = `pending` (NO aparece en mapa ni feed)
2. Un **client verificador** (con `can_verify_reports = true`) revisa el reporte
3. El verificador **aprueba** → status = `verified` (aparece en mapa y feed) o **rechaza** → status = `rejected`
4. Solo el **admin** puede otorgar/revocar el permiso `can_verify_reports` a cualquier client
5. El verificador puede hacer todo lo que un client normal hace (crear reportes, participar, etc.)
6. Los reportes creados por asociaciones o admin se auto-verifican

### Campos involucrados
- `profiles.can_verify_reports` — boolean, default false, solo admin puede cambiar
- `reports.verified_by` — uuid del verificador que aprobo
- `reports.verified_at` — timestamp de aprobacion
- `reports.rejection_reason` — texto si fue rechazado
- `report_status` enum: `pending`, `verified`, `in_progress`, `resolved`, `rejected`

### Funciones
- `verify_report(p_report_id, p_verifier_id)` — cambia status a verified, registra quien y cuando
- `reject_report(p_report_id, p_verifier_id, p_reason)` — cambia status a rejected con razon
- `grant_verify_permission(p_admin_id, p_client_id)` — admin otorga permiso
- `revoke_verify_permission(p_admin_id, p_client_id)` — admin revoca permiso

### RLS
- Reportes `pending`/`rejected`: solo visibles para el creador, verificadores y admins
- Reportes `verified`/`in_progress`/`resolved`: visibles para todos
- Solo verificadores y admins pueden actualizar status de pending a verified/rejected

---

## Esquema — 24 tablas

### ENUMs (12)
| Enum | Valores |
|------|---------|
| `user_role` | client, association, admin |
| `report_category` | trash, pothole, drain, water, wildlife, electronic, organic, other |
| `report_status` | pending, verified, in_progress, resolved, rejected |
| `service_status` | draft, open, in_progress, completed, cancelled |
| `volunteer_status` | applied, accepted, rejected, completed |
| `feed_post_type` | report, notice, info, educational |
| `feed_priority` | normal, medium, high, critical |
| `reward_type` | bonus, promotion, coupon |
| `claim_status` | active, redeemed, expired |
| `listing_status` | active, sold, cancelled, expired |
| `material_type` | plastic, glass, metal, paper, cardboard, electronic, organic, textile, wood, other |
| `auction_status` | scheduled, active, ended, cancelled |

### Identidad (3 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `profiles` | Extiende auth.users — nombre, avatar, role, eco_points, level, streak, ubicacion, preferencias, **can_verify_reports** |
| `associations` | Perfil de asociacion — owner_id, nombre, logo, descripcion, is_recognized |
| `association_members` | M:N clientes en asociaciones — role (member/coordinator) |

### Reportes (3 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `reports` | Reportes ambientales — usuario, categoria, status (pending por default), severidad, ubicacion, fotos, **verified_by**, **verified_at**, **rejection_reason** |
| `report_likes` | Likes a reportes — PK compuesta (report_id, user_id). Solo reportes verificados |
| `report_comments` | Comentarios con threading — parent_comment_id para respuestas |

### Servicios comunitarios (3 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `community_services` | Creados por asociaciones/admin — linked a reportes verificados, puntos de recompensa, max voluntarios |
| `joint_service_associations` | Servicios conjuntos entre multiples asociaciones |
| `service_volunteers` | Clientes que aplican/se unen a servicios |

### Feed social (3 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `feed_posts` | Publicaciones — tipo, prioridad por rol, links a reportes/servicios, pinned. Solo se crean para reportes verificados |
| `feed_post_likes` | Likes a posts del feed |
| `feed_post_comments` | Comentarios en posts del feed con threading |

### Recompensas (2 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `rewards` | Bonos/promociones/cupones — creados por asociaciones, costo en puntos |
| `reward_claims` | Cupones canjeados con QR unico + secret hash |

### Gamificacion (4 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `badges` | Definiciones de medallas con criterios JSON |
| `user_badges` | Medallas desbloqueadas por usuario |
| `points_history` | Auditoria de eco-puntos (ganados y gastados) |
| `leaderboard_monthly` | Snapshot mensual de ranking |

### Marketplace (2 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `marketplace_listings` | Venta de reciclables — material, cantidad, precio, ubicacion, fotos |
| `marketplace_messages` | Mensajeria comprador-vendedor |

### Subastas (2 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `auctions` | Subastas de residuos — precio inicial, oferta actual, tiempo limite |
| `auction_bids` | Historial de ofertas |

### IA (3 tablas)

| Tabla | Descripcion |
|-------|-------------|
| `ai_conversations` | Conversaciones con agente Claude |
| `ai_messages` | Mensajes — role (user/assistant/system), input_type (text/voice) |
| `ai_content_drafts` | Borradores generados por IA |

### Sistema (1 tabla)

| Tabla | Descripcion |
|-------|-------------|
| `notifications` | Notificaciones por tipo |

---

## Funciones de base de datos (13)

| # | Funcion | Descripcion |
|---|---------|-------------|
| 1 | `is_admin(user_id)` | Helper RLS — verifica si es admin |
| 2 | `is_verifier(user_id)` | Helper RLS — verifica si puede verificar reportes |
| 3 | `is_association_owner(user_id, assoc_id)` | Helper RLS |
| 4 | `is_association_member(user_id, assoc_id)` | Helper RLS |
| 5 | `add_eco_points(user_id, points, action, ref_type, ref_id)` | Suma puntos + audit + auto level-up |
| 6 | `update_user_streak(user_id)` | Actualiza racha diaria |
| 7 | `check_and_award_badges(user_id)` | Evalua criterios y otorga medallas |
| 8 | `verify_report(report_id, verifier_id)` | Aprueba reporte, crea feed_post, suma puntos al creador |
| 9 | `reject_report(report_id, verifier_id, reason)` | Rechaza reporte con razon |
| 10 | `place_bid(auction_id, bidder_id, amount)` | Registra oferta en subasta |
| 11 | `claim_reward(user_id, reward_id)` | Genera QR, descuenta puntos |
| 12 | `redeem_qr_code(qr_code)` | Valida y marca cupon como canjeado |
| 13 | `compute_feed_priority(user_id, assoc_id)` | Calcula prioridad segun rol |

## Triggers (5)

| # | Trigger | Accion |
|---|---------|--------|
| 1 | `on_auth_user_created` | Crea registro en profiles |
| 2 | `on_report_verified` | Crea feed_post, suma eco_points al creador (+10), check badges |
| 3 | `on_feed_post_created` | Auto-calcula prioridad segun rol |
| 4 | `on_service_volunteer_completed` | Suma eco_points, actualiza tasks_completed, check badges |
| 5 | `on_report_status_change` | Notifica al creador cuando cambia el status |

## RLS Policies — Reportes (detalle)

```
SELECT reportes:
  - Admin/verificadores: ven todos
  - Client normal: solo ve reportes con status IN (verified, in_progress, resolved)
    O reportes propios (cualquier status)

UPDATE reportes (status):
  - Solo verificadores (can_verify_reports=true) y admins pueden cambiar pending→verified o pending→rejected
  - Asociaciones/admin pueden cambiar verified→in_progress→resolved

INSERT reportes:
  - Cualquier usuario autenticado

DELETE reportes:
  - Solo el creador (si esta en pending) o admin
```

## Storage Buckets (8)
avatars, report-photos, reward-images, service-photos, feed-images, marketplace-photos, auction-photos, association-logos

## Realtime
Habilitado en: reports, feed_posts, community_services, service_volunteers, auctions, auction_bids, marketplace_messages, notifications, report_comments, feed_post_comments

## Ecopuntos

| Accion | Puntos |
|--------|--------|
| Crear reporte (al ser verificado) | +10 |
| Verificar reporte de otro | +5 |
| Completar tarea de limpieza | +20 a +50 |
| Asistir a servicio comunitario | +50 |

## Niveles

| Nivel | Nombre | Puntos |
|-------|--------|--------|
| 1 | Eco-Iniciado | 0 |
| 2 | Eco-Activo | 100 |
| 3 | Eco-Guardian | 300 |
| 4 | Eco-Lider | 600 |
| 5 | Eco-Heroe | 1000+ |

---

## Archivo SQL
`supabase/migrations/001_complete_schema.sql` — SQL completo listo para ejecutar en Supabase SQL Editor

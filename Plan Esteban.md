# Plan Esteban — Gamificación + Recompensas + Reportes

## Enfoque
Persona encargada de: **Gamificación y Recompensas** (prioridad 1) + **Reportes por categorías** (prioridad 2).

---

## PRIORIDAD 1: Gamificación y Recompensas

### Sistema de Ecopuntos
| Acción | Puntos |
|--------|--------|
| Crear reporte | +10 |
| Completar tarea de limpieza | +20 a +50 (según dificultad) |
| Asistir a evento/jornada | +50 |
| Verificar tarea de otro usuario | +5 |

### Niveles
| Nivel | Nombre | Puntos requeridos |
|-------|--------|-------------------|
| 1 | Eco-Iniciado | 0 |
| 2 | Eco-Activo | 100 |
| 3 | Eco-Guardián | 300 |
| 4 | Eco-Líder | 600 |
| 5+ | Eco-Héroe | 1000+ |

### Medallas
- 🏅 Primer Reporte — Crear tu primer reporte
- 🧹 Limpiador Novato — Completar 1 tarea de limpieza
- ⭐ Cinco Estrellas — Completar 5 tareas
- 🔥 Racha Semanal — 7 días consecutivos activo
- 🏖️ Guardián de Playa — Completar misión en playa
- 🏆 Top 10 — Estar en el leaderboard del mes
- 💎 Eco-Héroe — Alcanzar nivel 5

### Pantalla Perfil
- Avatar, nombre, rol badge
- Nivel con barra de progreso
- Ecopuntos totales
- Grid de medallas (desbloqueadas vs bloqueadas)
- Stats: reportes hechos, tareas completadas, kg estimados
- Historial de acciones recientes

### Pantalla Recompensas
- Saldo de ecopuntos arriba
- Catálogo de cupones (cards con imagen, puntos, empresa, vencimiento)
- Tap → detalle → "Canjear" → genera QR único
- Sección "Mis cupones" canjeados con QR
- Leaderboard: top 10 usuarios del mes

---

## PRIORIDAD 2: Reportes por Categorías (sin IA)

### Categorías
- 🕳️ Baches
- 🗑️ Basura en exceso
- 🚰 Desborde de drenaje

### Flujo de reporte
1. Seleccionar categoría
2. Tomar foto o seleccionar de galería
3. Agregar descripción
4. Geolocalización automática
5. Publicar → +10 ecopuntos

---

## Tareas de implementación
1. [x] Constantes de gamificación (niveles, medallas, puntos)
2. [ ] Datos mock (usuario con puntos, medallas, historial, cupones)
3. [ ] Pantalla Perfil con nivel, medallas, stats
4. [ ] Pantalla Recompensas con catálogo y canje
5. [ ] Componentes: BadgeCard, LevelBar, RewardCard, LeaderboardRow
6. [ ] Integrar tabs de Perfil y Recompensas en navegación
7. [ ] Pantalla Crear Reporte por categorías
8. [ ] Pantalla Feed de reportes (tarjetas)

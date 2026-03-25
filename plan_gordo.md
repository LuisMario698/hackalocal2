# Plan de Trabajo - Gordo
**Foco principal:** Base de datos, Auth, Feed Social, Logros Básicos y Creador de Recompensas/QR

## Responsabilidades Principales
1. **Backend y Autenticación con Supabase**
   - Dueño total de la configuración del proyecto Supabase.
   - Crear tablas (`profiles`, `reports`, `rewards`, `claims`).
   - Habilitar Autenticación de usuarios por email / red social.
2. **Pantalla de Inicio (Feed Principal)**
   - Consumir la tabla de reportes y pintarlos en modo "Red Social" (Cartas con imágenes, nombre de quién reporta, descripciones y likes).
3. **Logros Básicos y Recompensas**
   - Desplegar la tab "Recompensas" y mercado de Cupones.
   - Programar el generador de Código QR (`react-native-qrcode-svg`) que usan los ciudadanos para pedir sus descuentos.
   - Programar Escáner QR del negocio para validar un cupón.
   - Generación de los "Logros Básicos" en su perfil derivados netamente del contéo de número de reportes que ha hecho ese usuario.

## Tareas (Checklist rápido)
- [ ] Desplegar esquema SQL inicial y variables de entorno VITE/EXPO Supabase.
- [ ] Programar Login / Signup (`AuthContext`).
- [ ] Codificar y maquetar el `FeedList` y el renderizado de `FeedCard`.
- [ ] Empezar la vista de Logros Base usando conteos de RLS.
- [ ] Armar Lema QR (Generación para App de Usuario / Scanner para la App de Autoridad Local).

# Plan de Trabajo - Mario
**Foco principal:** Mapas y Geolocalización

## Responsabilidades Principales
1. **Módulo de Mapas Multiplataforma**
   - Implementar y mantener el mapa usando `react-native-maps` para celular y `react-leaflet` para web.
   - Renderizar los reportes activos extraídos de Supabase como pines en el mapa según sus coordenadas.
   - Implementar visualizaciones extra (clusters de muchos pines juntos o vista de calor).
2. **Geolocalización**
   - Configurar la solicitud de permisos de GPS en el dispositivo.
   - Capturar posición del usuario al crear o mirar reportes cercanos en tiempo real.
3. **Módulo IA (Pospuesto)**
   - La integración de OpenAI ha sido pospuesta para la Fase 2.

## Tareas (Checklist rápido)
- [ ] Implementar mapa base responsivo en `app/(tabs)/map.tsx`.
- [ ] (Pospuesto) Conseguir API Keys de OpenAI y crear wrapper `lib/openai.ts`.
- [ ] Solicitar permisos de GPS del usuario.
- [ ] Pintar dinámicamente pines de colores dependiendo el tipo de desecho encontrado.

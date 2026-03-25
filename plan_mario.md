# Plan de Trabajo - Mario
**Foco principal:** Mapas, Geolocalización e Inteligencia Artificial (IA)

## Responsabilidades Principales
1. **Módulo de Mapas Multiplataforma**
   - Implementar y mantener el mapa usando `react-native-maps` para celular y `react-leaflet` para web.
   - Renderizar los reportes activos extraídos de Supabase como pines en el mapa según sus coordenadas.
   - Implementar visualizaciones extra (clusters de muchos pines juntos o vista de calor).
2. **Geolocalización**
   - Configurar la solicitud de permisos de GPS en el dispositivo.
   - Capturar posición del usuario al crear o mirar reportes cercanos en tiempo real.
3. **Inteligencia Artificial (OpenAI)**
   - Integrar la API de OpenAI (GPT-4 Vision y Whisper).
   - Crear la función que toma una foto subida por el usuario y que el modelo de IA deduzca la categoría (orgánico, basura, metales) e informe la gravedad al instante.

## Tareas (Checklist rápido)
- [ ] Implementar mapa base responsivo en `app/(tabs)/map.tsx`.
- [ ] Conseguir API Keys de OpenAI y crear wrapper `lib/openai.ts`.
- [ ] Solicitar permisos de GPS del usuario.
- [ ] Pintar dinámicamente pines de colores dependiendo el tipo de desecho encontrado.

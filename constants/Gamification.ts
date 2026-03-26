// Sistema de gamificación — constantes

export const POINT_VALUES = {
  createReport: 10,
  completeTask: 20,
  completeHardTask: 50,
  attendEvent: 50,
  verifyTask: 5,
} as const;

export interface Level {
  level: number;
  name: string;
  minPoints: number;
  icon: string; // Ionicons name
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Eco-Iniciado', minPoints: 0, icon: 'leaf-outline' },
  { level: 2, name: 'Eco-Activo', minPoints: 100, icon: 'leaf' },
  { level: 3, name: 'Eco-Guardián', minPoints: 300, icon: 'shield-outline' },
  { level: 4, name: 'Eco-Líder', minPoints: 600, icon: 'shield-checkmark' },
  { level: 5, name: 'Eco-Héroe', minPoints: 1000, icon: 'earth' },
];

export function getUserLevel(points: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getLevelProgress(points: number): number {
  const current = getUserLevel(points);
  const currentIndex = LEVELS.indexOf(current);
  const next = LEVELS[currentIndex + 1];
  if (!next) return 1; // Max level
  const range = next.minPoints - current.minPoints;
  const progress = points - current.minPoints;
  return Math.min(progress / range, 1);
}

export function getNextLevel(points: number): Level | null {
  const current = getUserLevel(points);
  const currentIndex = LEVELS.indexOf(current);
  return LEVELS[currentIndex + 1] ?? null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Ionicons name
  requirement: string;
}

export const BADGES: Badge[] = [
  {
    id: 'first_report',
    name: 'Primer Reporte',
    description: 'Creaste tu primer reporte',
    icon: 'ribbon',
    requirement: 'Crear 1 reporte',
  },
  {
    id: 'cleaner_novice',
    name: 'Limpiador Novato',
    description: 'Completaste tu primera tarea de limpieza',
    icon: 'sparkles',
    requirement: 'Completar 1 tarea',
  },
  {
    id: 'five_stars',
    name: 'Cinco Estrellas',
    description: 'Completaste 5 tareas de limpieza',
    icon: 'star',
    requirement: 'Completar 5 tareas',
  },
  {
    id: 'weekly_streak',
    name: 'Racha Semanal',
    description: '7 días consecutivos activo',
    icon: 'flame',
    requirement: '7 dias seguidos',
  },
  {
    id: 'beach_guardian',
    name: 'Guardian de Playa',
    description: 'Completaste una mision en playa',
    icon: 'sunny',
    requirement: 'Mision en playa',
  },
  {
    id: 'top_10',
    name: 'Top 10',
    description: 'Estas en el leaderboard del mes',
    icon: 'trophy',
    requirement: 'Top 10 mensual',
  },
  {
    id: 'eco_hero',
    name: 'Eco-Heroe',
    description: 'Alcanzaste el nivel 5',
    icon: 'diamond',
    requirement: 'Nivel 5',
  },
];

// Categorías de reporte (sin IA — selección manual)
export type ReportCategory = 'trash' | 'pothole' | 'drain' | 'water' | 'wildlife' | 'electronic' | 'organic' | 'other';

export interface CategoryInfo {
  id: ReportCategory;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const REPORT_CATEGORIES: CategoryInfo[] = [
  {
    id: 'pothole',
    name: 'Baches',
    icon: 'warning-outline',
    color: '#F59E0B',
    description: 'Baches en calles o banquetas',
  },
  {
    id: 'trash',
    name: 'Basura en exceso',
    icon: 'trash-outline',
    color: '#E24B4A',
    description: 'Acumulacion de basura en espacios publicos',
  },
  {
    id: 'drain',
    name: 'Desborde de drenaje',
    icon: 'water-outline',
    color: '#378ADD',
    description: 'Problemas de alcantarillado o drenaje',
  },
  {
    id: 'water',
    name: 'Agua contaminada',
    icon: 'flask-outline',
    color: '#3B82F6',
    description: 'Contaminacion o fugas de agua',
  },
  {
    id: 'wildlife',
    name: 'Vida silvestre',
    icon: 'paw-outline',
    color: '#BA7517',
    description: 'Animales en peligro o afectados',
  },
  {
    id: 'electronic',
    name: 'Electronico',
    icon: 'desktop-outline',
    color: '#7F77DD',
    description: 'Residuos electronicos abandonados',
  },
  {
    id: 'organic',
    name: 'Organico',
    icon: 'leaf-outline',
    color: '#10B981',
    description: 'Residuos organicos sin recolectar',
  },
  {
    id: 'other',
    name: 'Otro',
    icon: 'ellipsis-horizontal-outline',
    color: '#6B7280',
    description: 'Otro tipo de problema ambiental',
  },
];

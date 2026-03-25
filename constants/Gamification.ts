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
  icon: string; // emoji
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Eco-Iniciado', minPoints: 0, icon: '🌱' },
  { level: 2, name: 'Eco-Activo', minPoints: 100, icon: '🌿' },
  { level: 3, name: 'Eco-Guardián', minPoints: 300, icon: '🌳' },
  { level: 4, name: 'Eco-Líder', minPoints: 600, icon: '🦅' },
  { level: 5, name: 'Eco-Héroe', minPoints: 1000, icon: '🌍' },
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
  icon: string; // emoji
  requirement: string;
}

export const BADGES: Badge[] = [
  {
    id: 'first_report',
    name: 'Primer Reporte',
    description: 'Creaste tu primer reporte',
    icon: '🏅',
    requirement: 'Crear 1 reporte',
  },
  {
    id: 'cleaner_novice',
    name: 'Limpiador Novato',
    description: 'Completaste tu primera tarea de limpieza',
    icon: '🧹',
    requirement: 'Completar 1 tarea',
  },
  {
    id: 'five_stars',
    name: 'Cinco Estrellas',
    description: 'Completaste 5 tareas de limpieza',
    icon: '⭐',
    requirement: 'Completar 5 tareas',
  },
  {
    id: 'weekly_streak',
    name: 'Racha Semanal',
    description: '7 días consecutivos activo',
    icon: '🔥',
    requirement: '7 días seguidos',
  },
  {
    id: 'beach_guardian',
    name: 'Guardián de Playa',
    description: 'Completaste una misión en playa',
    icon: '🏖️',
    requirement: 'Misión en playa',
  },
  {
    id: 'top_10',
    name: 'Top 10',
    description: 'Estás en el leaderboard del mes',
    icon: '🏆',
    requirement: 'Top 10 mensual',
  },
  {
    id: 'eco_hero',
    name: 'Eco-Héroe',
    description: 'Alcanzaste el nivel 5',
    icon: '💎',
    requirement: 'Nivel 5',
  },
];

// Categorías de reporte (sin IA — selección manual)
export type ReportCategory = 'pothole' | 'trash' | 'drain';

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
    icon: '🕳️',
    color: '#F59E0B',
    description: 'Baches en calles o banquetas',
  },
  {
    id: 'trash',
    name: 'Basura en exceso',
    icon: '🗑️',
    color: '#E24B4A',
    description: 'Acumulación de basura en espacios públicos',
  },
  {
    id: 'drain',
    name: 'Desborde de drenaje',
    icon: '🚰',
    color: '#378ADD',
    description: 'Problemas de alcantarillado o drenaje',
  },
];

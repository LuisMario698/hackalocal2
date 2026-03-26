// Datos mock para prototipo — gamificación, recompensas, reportes

import type { ReportCategory } from './Gamification';

// ============ USUARIO ACTUAL ============
export interface MockUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: 'citizen' | 'authority' | 'business' | 'organization';
  ecoPoints: number;
  reportsCount: number;
  tasksCompleted: number;
  kgRecycled: number;
  streakDays: number;
  unlockedBadges: string[]; // badge ids
  joinedAt: string;
}

export const CURRENT_USER: MockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Esteban García',
  avatarUrl: null,
  role: 'citizen',
  ecoPoints: 340,
  reportsCount: 12,
  tasksCompleted: 8,
  kgRecycled: 45,
  streakDays: 5,
  unlockedBadges: ['first_report', 'cleaner_novice', 'five_stars'],
  joinedAt: '2026-01-15',
};

// ============ LEADERBOARD ============
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  ecoPoints: number;
  level: number;
}

export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'u-010', name: 'María López', ecoPoints: 1250, level: 5 },
  { rank: 2, userId: 'u-003', name: 'Carlos Mendoza', ecoPoints: 980, level: 4 },
  { rank: 3, userId: 'u-007', name: 'Ana Rodríguez', ecoPoints: 720, level: 4 },
  { rank: 4, userId: 'user-001', name: 'Esteban García', ecoPoints: 340, level: 3 },
  { rank: 5, userId: 'u-012', name: 'Luis Herrera', ecoPoints: 310, level: 3 },
  { rank: 6, userId: 'u-005', name: 'Sofía Martínez', ecoPoints: 280, level: 2 },
  { rank: 7, userId: 'u-008', name: 'Diego Ramírez', ecoPoints: 220, level: 2 },
  { rank: 8, userId: 'u-015', name: 'Valentina Cruz', ecoPoints: 190, level: 2 },
  { rank: 9, userId: 'u-002', name: 'Roberto Sánchez', ecoPoints: 150, level: 2 },
  { rank: 10, userId: 'u-011', name: 'Isabel Torres', ecoPoints: 110, level: 2 },
];

// ============ RECOMPENSAS ============
export interface MockReward {
  id: string;
  businessName: string;
  title: string;
  description: string;
  pointsCost: number;
  quantityAvailable: number;
  imageEmoji: string; // emoji como placeholder de imagen
  validUntil: string;
}

export const REWARDS: MockReward[] = [
  {
    id: 'rw-001',
    businessName: 'Super del Puerto',
    title: 'Vale de despensa $100',
    description: 'Vale canjeable en Super del Puerto por $100 MXN en productos',
    pointsCost: 200,
    quantityAvailable: 15,
    imageEmoji: '🛒',
    validUntil: '2026-06-30',
  },
  {
    id: 'rw-002',
    businessName: 'Café Costero',
    title: 'Café gratis',
    description: 'Un café americano o cappuccino gratis',
    pointsCost: 50,
    quantityAvailable: 30,
    imageEmoji: '☕',
    validUntil: '2026-05-31',
  },
  {
    id: 'rw-003',
    businessName: 'Gym FitLife',
    title: '1 semana gratis',
    description: 'Pase libre por 1 semana en Gym FitLife',
    pointsCost: 150,
    quantityAvailable: 10,
    imageEmoji: '💪',
    validUntil: '2026-07-15',
  },
  {
    id: 'rw-004',
    businessName: 'Pizzería La Italiana',
    title: '20% de descuento',
    description: 'Descuento del 20% en tu orden',
    pointsCost: 80,
    quantityAvailable: 25,
    imageEmoji: '🍕',
    validUntil: '2026-04-30',
  },
  {
    id: 'rw-005',
    businessName: 'Librería Cultura',
    title: 'Libro a elegir',
    description: 'Un libro valorado hasta $200 MXN',
    pointsCost: 300,
    quantityAvailable: 5,
    imageEmoji: '📚',
    validUntil: '2026-08-31',
  },
];

// ============ CUPONES CANJEADOS ============
export interface MockClaim {
  id: string;
  rewardTitle: string;
  businessName: string;
  qrCode: string;
  redeemed: boolean;
  claimedAt: string;
  imageEmoji: string;
}

export const MY_CLAIMS: MockClaim[] = [
  {
    id: 'cl-001',
    rewardTitle: 'Café gratis',
    businessName: 'Café Costero',
    qrCode: 'sc_claim_cl001_1711234567',
    redeemed: false,
    claimedAt: '2026-03-20',
    imageEmoji: '☕',
  },
  {
    id: 'cl-002',
    rewardTitle: '20% de descuento',
    businessName: 'Pizzería La Italiana',
    qrCode: 'sc_claim_cl002_1711134567',
    redeemed: true,
    claimedAt: '2026-03-10',
    imageEmoji: '🍕',
  },
];

// ============ REPORTES ============
export type ReportStatus = 'pending' | 'verified' | 'in_progress' | 'resolved' | 'rejected';

export interface MockReport {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  severity: number; // 1-5
  latitude: number;
  longitude: number;
  address: string;
  photoUrl: string | null;
  likesCount: number;
  createdAt: string;
}

export const REPORTS: MockReport[] = [
  {
    id: 'rp-001',
    userId: 'user-001',
    userName: 'Esteban García',
    title: 'Bache peligroso en Av. Constitución',
    description: 'Bache grande en el carril derecho, varios autos ya se han dañado',
    category: 'pothole',
    status: 'pending',
    severity: 4,
    latitude: 31.3200,
    longitude: -113.5360,
    address: 'Av. Constitución #234, Centro',
    photoUrl: null,
    likesCount: 8,
    createdAt: '2026-03-24',
  },
  {
    id: 'rp-002',
    userId: 'u-003',
    userName: 'Carlos Mendoza',
    title: 'Basura acumulada en esquina del parque',
    description: 'Llevan 3 días sin recoger la basura, ya huele muy mal',
    category: 'trash',
    status: 'in_progress',
    severity: 3,
    latitude: 31.3150,
    longitude: -113.5320,
    address: 'Parque Municipal, esq. Calle 5ta',
    photoUrl: null,
    likesCount: 15,
    createdAt: '2026-03-23',
  },
  {
    id: 'rp-003',
    userId: 'u-007',
    userName: 'Ana Rodríguez',
    title: 'Drenaje desbordado en Col. Esperanza',
    description: 'El drenaje lleva desbordado desde ayer, el agua llega hasta la calle',
    category: 'drain',
    status: 'pending',
    severity: 5,
    latitude: 31.3220,
    longitude: -113.5400,
    address: 'Col. Esperanza, Calle 12 y Blvd. Juárez',
    photoUrl: null,
    likesCount: 22,
    createdAt: '2026-03-22',
  },
  {
    id: 'rp-004',
    userId: 'u-010',
    userName: 'María López',
    title: 'Basura en la playa principal',
    description: 'Botellas y plásticos en toda la orilla después del fin de semana',
    category: 'trash',
    status: 'resolved',
    severity: 3,
    latitude: 31.3100,
    longitude: -113.5280,
    address: 'Playa Principal, zona turística',
    photoUrl: null,
    likesCount: 35,
    createdAt: '2026-03-18',
  },
  {
    id: 'rp-005',
    userId: 'u-005',
    userName: 'Sofía Martínez',
    title: 'Bache en calle sin pavimentar',
    description: 'Varios baches seguidos en calle de terracería, imposible pasar en carro',
    category: 'pothole',
    status: 'pending',
    severity: 2,
    latitude: 31.3180,
    longitude: -113.5450,
    address: 'Col. Las Palmas, Calle sin nombre',
    photoUrl: null,
    likesCount: 4,
    createdAt: '2026-03-21',
  },
];

// ============ HISTORIAL DE ACCIONES ============
export interface ActionHistory {
  id: string;
  type: 'report' | 'task' | 'event' | 'verify' | 'redeem';
  description: string;
  points: number;
  date: string;
}

export const USER_HISTORY: ActionHistory[] = [
  { id: 'h-001', type: 'report', description: 'Reportaste: Bache en Av. Constitución', points: 10, date: '2026-03-24' },
  { id: 'h-002', type: 'task', description: 'Limpiaste: Basura en Parque Municipal', points: 30, date: '2026-03-23' },
  { id: 'h-003', type: 'redeem', description: 'Canjeaste: Café gratis', points: -50, date: '2026-03-20' },
  { id: 'h-004', type: 'report', description: 'Reportaste: Drenaje en Col. Centro', points: 10, date: '2026-03-19' },
  { id: 'h-005', type: 'verify', description: 'Verificaste limpieza de playa', points: 5, date: '2026-03-18' },
  { id: 'h-006', type: 'event', description: 'Asististe: Jornada de limpieza costera', points: 50, date: '2026-03-15' },
  { id: 'h-007', type: 'task', description: 'Limpiaste: Basura en Calle 3ra', points: 20, date: '2026-03-12' },
  { id: 'h-008', type: 'report', description: 'Reportaste: Bache en Blvd. Kino', points: 10, date: '2026-03-10' },
];

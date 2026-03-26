// Paleta de colores — Social Clean

export const LightColors = {
  primary: '#1D9E75',       // Verde teal — sostenibilidad
  primaryLight: '#E1F5EE',
  accent: '#D85A30',        // Coral — CTAs y botón reportar
  accentLight: '#FDEEE8',

  // Categorías de reporte
  category: {
    trash: '#E24B4A',       // Basura en exceso
    pothole: '#F59E0B',     // Baches
    drain: '#378ADD',       // Desborde de drenaje
    wildlife: '#BA7517',
    electronic: '#7F77DD',
    organic: '#1D9E75',
    other: '#6B7280',
  },

  // Estados de reporte
  status: {
    pending: '#FAEEDA',
    pendingText: '#92600A',
    verified: '#E1F5EE',
    verifiedText: '#0D6E4F',
    inProgress: '#E6F1FB',
    inProgressText: '#1A5A96',
    resolved: '#E1F5EE',
    resolvedText: '#0D6E4F',
    rejected: '#FDE8E8',
    rejectedText: '#C53030',
  },

  // Generales
  background: '#F8FAF9',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',

  // Gamificación
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  xpBar: '#1D9E75',
  xpBarBg: '#E5E7EB',
  badgeLocked: '#D1D5DB',
};

export const DarkColors: typeof LightColors = {
  primary: '#22C58B',
  primaryLight: '#1A3D32',
  accent: '#E8764A',
  accentLight: '#3D2218',

  category: {
    trash: '#F06565',
    pothole: '#FBBF24',
    drain: '#60A5FA',
    wildlife: '#D4952A',
    electronic: '#A78BFA',
    organic: '#34D399',
    other: '#9CA3AF',
  },

  status: {
    pending: '#3D2E10',
    pendingText: '#FCD34D',
    verified: '#0F3D2E',
    verifiedText: '#6EE7B7',
    inProgress: '#1A2F44',
    inProgressText: '#93C5FD',
    resolved: '#0F3D2E',
    resolvedText: '#6EE7B7',
    rejected: '#3B1515',
    rejectedText: '#FCA5A5',
  },

  background: '#0F1117',
  surface: '#1A1D27',
  text: '#E8EAF0',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  border: '#2D3342',
  borderLight: '#232736',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',

  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  xpBar: '#22C58B',
  xpBarBg: '#2D3342',
  badgeLocked: '#4B5563',
};

// Default export for backward compat (light theme)
export const Colors = LightColors;

export type ColorPalette = typeof LightColors;

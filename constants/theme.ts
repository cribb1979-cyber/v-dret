export const colors = {
  background: '#0B1E33',
  surface: '#12294A',
  surfaceAlt: '#1B3A63',
  border: '#2A4A78',
  text: '#F4F8FC',
  textMuted: '#9FB4CE',
  accent: '#4FA3FF',
  info: '#4FA3FF',
  warning: '#F5A623',
  severe: '#E5484D',
  success: '#3DD68C',
};

export const noticeColors: Record<'info' | 'warning' | 'severe', string> = {
  info: colors.info,
  warning: colors.warning,
  severe: colors.severe,
};

export const GUST_STEPS = [10, 12, 14, 17, 21, 25];

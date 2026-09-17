// WMO weather interpretation codes (används av Open-Meteo).
// https://open-meteo.com/en/docs (se "WMO Weather interpretation codes (WW)")

export interface WeatherCodeInfo {
  text: string;
  emoji: string;
  isThunder: boolean;
}

const CODES: Record<number, WeatherCodeInfo> = {
  0: { text: 'Klart', emoji: '☀️', isThunder: false },
  1: { text: 'Mest klart', emoji: '🌤️', isThunder: false },
  2: { text: 'Växlande molnighet', emoji: '⛅', isThunder: false },
  3: { text: 'Mulet', emoji: '☁️', isThunder: false },
  45: { text: 'Dimma', emoji: '🌫️', isThunder: false },
  48: { text: 'Rimfrostdimma', emoji: '🌫️', isThunder: false },
  51: { text: 'Lätt duggregn', emoji: '🌦️', isThunder: false },
  53: { text: 'Duggregn', emoji: '🌦️', isThunder: false },
  55: { text: 'Kraftigt duggregn', emoji: '🌧️', isThunder: false },
  56: { text: 'Lätt underkylt duggregn', emoji: '🌧️', isThunder: false },
  57: { text: 'Underkylt duggregn', emoji: '🌧️', isThunder: false },
  61: { text: 'Lätt regn', emoji: '🌦️', isThunder: false },
  63: { text: 'Regn', emoji: '🌧️', isThunder: false },
  65: { text: 'Kraftigt regn', emoji: '🌧️', isThunder: false },
  66: { text: 'Lätt underkylt regn', emoji: '🌧️', isThunder: false },
  67: { text: 'Underkylt regn', emoji: '🌧️', isThunder: false },
  71: { text: 'Lätt snöfall', emoji: '🌨️', isThunder: false },
  73: { text: 'Snöfall', emoji: '🌨️', isThunder: false },
  75: { text: 'Kraftigt snöfall', emoji: '❄️', isThunder: false },
  77: { text: 'Snökorn', emoji: '🌨️', isThunder: false },
  80: { text: 'Lätta regnskurar', emoji: '🌦️', isThunder: false },
  81: { text: 'Regnskurar', emoji: '🌧️', isThunder: false },
  82: { text: 'Kraftiga regnskurar', emoji: '⛈️', isThunder: false },
  85: { text: 'Lätta snöbyar', emoji: '🌨️', isThunder: false },
  86: { text: 'Kraftiga snöbyar', emoji: '❄️', isThunder: false },
  95: { text: 'Åska', emoji: '⛈️', isThunder: true },
  96: { text: 'Åska med lätt hagel', emoji: '⛈️', isThunder: true },
  99: { text: 'Åska med kraftigt hagel', emoji: '⛈️', isThunder: true },
};

export function describeWeatherCode(code: number | undefined | null): WeatherCodeInfo {
  if (code == null) {
    return { text: 'Okänt', emoji: '❔', isThunder: false };
  }
  return CODES[code] ?? { text: 'Okänt väder', emoji: '❔', isThunder: false };
}

export const mappings = [
  // --- System & Status ---
  { keywords: ['status'], action: 'getSystemStatus' },
  { keywords: ['wie', 'geht'], action: 'getSystemStatus' },
  { keywords: ['temperatur'], action: 'getSystemStatus' },
  
  { keywords: ['starte', 'neu'], action: 'reboot' },
  { keywords: ['reboot'], action: 'reboot' },
  
  { keywords: ['feierabend'], action: 'fullShutdown' },
  { keywords: ['alles', 'aus'], action: 'fullShutdown' },
  { keywords: ['schlafenszeit'], action: 'fullShutdown' },

  // --- Box Power & Input ---
  { keywords: ['box', 'an'], action: 'boxOn' },
  { keywords: ['musik', 'an'], action: 'boxOn' },
  { keywords: ['lautsprecher', 'an'], action: 'boxOn' },
  
  { keywords: ['box', 'aus'], action: 'boxOff' },
  { keywords: ['musik', 'aus'], action: 'boxOff' },
  { keywords: ['lautsprecher', 'aus'], action: 'boxOff' },

  // --- Lautstärke ---
  { keywords: ['box', 'lauter'], action: 'boxLauter', params: [/(\d+)/] },
  { keywords: ['musik', 'lauter'], action: 'boxLauter', params: [/(\d+)/] },
  
  { keywords: ['box', 'leiser'], action: 'boxLeiser', params: [/(\d+)/] },
  { keywords: ['musik', 'leiser'], action: 'boxLeiser', params: [/(\d+)/] },
  
  { keywords: ['lautstärke'], action: 'boxSetVolume', params: [/(\d+)/] },
  { keywords: ['setze', 'vol'], action: 'boxSetVolume', params: [/(\d+)/] },

  // --- Playback Steuerung ---
  { keywords: ['paus'], action: 'boxPause' },
  { keywords: ['stopp'], action: 'boxPause' },
  { keywords: ['anhalt'], action: 'boxPause' },
  
  { keywords: ['play'], action: 'boxPlay' },
  { keywords: ['spiel', 'weiter'], action: 'boxPlay' },

  { keywords: ['nächster'], action: 'boxSkipSong' },
  { keywords: ['überspring', 'song'], action: 'boxSkipSong' },
  { keywords: ['weiter'], action: 'boxSkipSong' },
  
  { keywords: ['zurück'], action: 'boxPrevSong' },
  { keywords: ['vorheriger'], action: 'boxPrevSong' },

  // --- Informationen ---
  { keywords: ['welcher', 'song'], action: 'boxGetSongData' },
  { keywords: ['wie', 'song'], action: 'boxGetSongData' },
  { keywords: ['aktuell', 'song'], action: 'boxGetSongData' },
  { keywords: ['interpret'], action: 'boxGetSongData' },
  
  { keywords: ['wetter'], action: 'getWeather', params: [/(\d+)/, /(?<=in\s)([a-zA-ZäöüÄÖÜß]+)/] },
  { keywords: ['wie', 'warm'], action: 'getWeather', params: [/(\d+)/, /(?<=in\s)([a-zA-ZäöüÄÖÜß]+)/] },
  { keywords: ['regen'], action: 'getWeather', params: [/(\d+)/, /(?<=in\s)([a-zA-ZäöüÄÖÜß]+)/] },

  { keywords: ['mistral'], action: 'askAi', params: [/(?<=mistral\s).*/i]},
]

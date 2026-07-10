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
  { keywords: ['wechs'], action: 'switchAudioDevice', params: [/(?<=zu\s+(?:gerät\s+)?).*/] },

  // --- Lautstärke ---
  { keywords: ['box', 'lauter'], action: 'boxLauter', params: [/(\d+)/] },
  { keywords: ['musik', 'lauter'], action: 'boxLauter', params: [/(\d+)/] },

  { keywords: ['box', 'leiser'], action: 'boxLeiser', params: [/(\d+)/] },
  { keywords: ['musik', 'leiser'], action: 'boxLeiser', params: [/(\d+)/] },

  { keywords: ['lautstärke'], action: 'boxSetVolume', params: [/(\d+)/] },
  { keywords: ['setze', 'vol'], action: 'boxSetVolume', params: [/(\d+)/] },

  // --- Playback Steuerung ---
  { keywords: ['paus'], action: 'boxPause' },
  { keywords: ['stopp', 'musik'], action: 'boxPause' },
  { keywords: ['stopp', 'box'], action: 'boxPause' },
  { keywords: ['anhalt'], action: 'boxPause' },

  { keywords: ['play'], action: 'boxPlay' },
  { keywords: ['spiel', 'weiter'], action: 'boxPlay' },

  { keywords: ['nächster'], action: 'boxSkipSong' },
  { keywords: ['überspring', 'song'], action: 'boxSkipSong' },
  { keywords: ['weiter'], action: 'boxSkipSong' },

  { keywords: ['zurück'], action: 'boxPrevSong' },
  { keywords: ['vorheriger'], action: 'boxPrevSong' },

  // --- TV Streaming ---
  { keywords: ['spiel', 'anime'], action: 'dlna', params: [/(?<=anime).*/, /unten\s*anime/] },
  { keywords: ['starte', 'anime'], action: 'dlna', params: [/(?<=anime).*/, /unten\s*anime/] },
  { keywords: ['spiel', 'serie'], action: 'dlna', params: [/(?<=serie).*/, /unten\s*serie/] },
  { keywords: ['starte', 'serie'], action: 'dlna', params: [/(?<=serie).*/, /unten\s*serie/] },
  { keywords: ['stop', 'anime'], action: 'dlnaend' },

  // --- Informationen ---
  { keywords: ['welcher', 'song'], action: 'boxGetSongData' },
  { keywords: ['wie', 'song'], action: 'boxGetSongData' },
  { keywords: ['aktuell', 'song'], action: 'boxGetSongData' },
  { keywords: ['interpret'], action: 'boxGetSongData' },

  { keywords: ['wetter'], action: 'getWeather', params: [/(\d+)/, /(?<=in\s)([a-zA-ZäöüÄÖÜß]+)/] },
  { keywords: ['wie', 'warm'], action: 'getWeather', params: [/(\d+)/, /(?<=in\s)([a-zA-ZäöüÄÖÜß]+)/] },
  { keywords: ['regen'], action: 'getWeather', params: [/(\d+)/, /(?<=in\s)([a-zA-ZäöüÄÖÜß]+)/] },

  { keywords: ['mistral'], action: 'askAI', params: [/(?<=mistral\s).*/i] },

  // --- Android Activities ---
  { keywords: ['timer'], action: 'setTimer', params: [/(\d+)(?=\s*Sekund)/i, /(\d+)(?=\s*Minut)/i, /((\d{1,2}):(\d{2}))(?=\s*Uhr\s*)/i] },
]

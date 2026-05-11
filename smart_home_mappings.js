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
  { keywords: ['box', 'lauter'], action: 'boxLauter', param: /(\d+)/ },
  { keywords: ['musik', 'lauter'], action: 'boxLauter', param: /(\d+)/ },
  
  { keywords: ['box', 'leiser'], action: 'boxLeiser', param: /(\d+)/ },
  { keywords: ['musik', 'leiser'], action: 'boxLeiser', param: /(\d+)/ },
  
  { keywords: ['lautstärke'], action: 'boxSetVolume', param: /(\d+)/ },
  { keywords: ['setze', 'vol'], action: 'boxSetVolume', param: /(\d+)/ },

  // --- Playback Steuerung ---
  { keywords: ['pause'], action: 'boxPause' },
  { keywords: ['stopp'], action: 'boxPause' },
  { keywords: ['anhalt'], action: 'boxPause' },
  
  { keywords: ['play'], action: 'boxPlay' },
  { keywords: ['spiel', 'weiter'], action: 'boxPlay' },

  { keywords: ['nächster'], action: 'boxSkipSong' },
  { keywords: ['skip'], action: 'boxSkipSong' },
  { keywords: ['weiter'], action: 'boxSkipSong' },
  
  { keywords: ['zurück'], action: 'boxPrevSong' },
  { keywords: ['vorheriger'], action: 'boxPrevSong' },

  // --- Informationen ---
  { keywords: ['welcher', 'song'], action: 'boxGetSongData' },
  { keywords: ['wie', 'song'], action: 'boxGetSongData' },
  { keywords: ['aktuell', 'song'], action: 'boxGetSongData' },
  { keywords: ['interpret'], action: 'boxGetSongData' },
  
  { keywords: ['wetter'], action: 'getWeather', param: /(\d+)/ },
  { keywords: ['wie', 'warm'], action: 'getWeather', param: /(\d+)/ },
  { keywords: ['regen'], action: 'getWeather', param: /(\d+)/ },

  { keywords: ['mistral'], action: 'askAi', param: /(?<=mistral\s).*/i},
]

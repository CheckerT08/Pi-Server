import { LOCATION } from "../config/env.js";

const locationToCoordinateCache = {};

async function getCoordinates(location) {
  if (locationToCoordinateCache[location]) {
    console.log(`Using cached coordinates for ${location}`);
    return locationToCoordinateCache[location];
  } else {
    console.log(`Calling Geocoding API for ${location}...`);
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=de&format=json`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      console.warn(`Location not found: ${location}`);
      return null;
    }

    const { latitude, longitude, name: realName } = geoData.results[0];
    locationToCoordinateCache[location] = { latitude, longitude, realName };
    return locationToCoordinateCache[location];
  }
}

function formatWeatherText(offset, realName, temp, condition) {
  if (offset === 0) {
    return `In ${realName} ist es aktuell ${temp} Grad bei ${condition}.`;
  } else {
    const zeitText = offset === 1 ? "einer Stunde" : `${offset} Stunden`;
    return `In ${zeitText} werden es in ${realName} etwa ${temp} Grad sein bei ${condition}.`;
  }
}


export const weatherCommands = {
  getWeather: async (hoursFromNow, locationInput) => {
    const offset = Math.max(0, parseInt(hoursFromNow) || 0);
    const location = (locationInput || LOCATION).trim();
    console.log(`Fetching weather for location: "${location}" with offset +${offset}h`);

    const weatherCodes = {
      0: "einem wolkenlosen Himmel",
      1: "fast keinen Wolken",
      2: "leichter Bewölkung",
      3: "bedecktem Himmel",
      45: "etwas Nebel",
      48: "viel Nebel",
      51: "leichtem Nieselregen",
      53: "Nieselregen",
      55: "starkem Nieselregen",
      61: "leichtem Regen",
      63: "Regen",
      65: "starkem Regen",
      66: "Schneeregen",
      67: "starkem Schneeregen",
      71: "leichtem Schneefall",
      73: "Schneefall",
      75: "starkem Schneefall",
      95: "einem Gewitter"
    };

    try {
      const coords = await getCoordinates(location);
      if (!coords) {
        return `Ich konnte den Ort ${location} leider nicht finden.`;
      }
      const { latitude, longitude, realName } = coords;
      

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&forecast_days=2&timezone=auto`);
      const weatherData = await weatherRes.json();

      const now = new Date();
      const hourIndex = now.getHours() + offset;

      if (!weatherData.hourly || !weatherData.hourly.temperature_2m || hourIndex >= weatherData.hourly.temperature_2m.length) {
        return "Das liegt zu weit in der Zukunft oder die Wetterdaten sind unvollständig.";
      }

      const temp = Math.round(weatherData.hourly.temperature_2m[hourIndex]);
      const code = weatherData.hourly.weathercode[hourIndex];
      const condition = weatherCodes[code] || "unbekannten Wetterbedingungen";

      return formatWeatherText(offset, realName, temp, condition);

    } catch (err) {
      console.error("Weather API request failed:", err.message);
      return "Die Wetterstation antwortet gerade nicht.";
    }
  },
};
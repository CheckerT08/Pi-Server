// public/main.js
async function fetchStats() {
  const res = await fetch('/api/stats');
  const data = await res.json();
  document.getElementById('cpu').textContent = 'CPU Last: ' + data.cpuLoad + '%';
  document.getElementById('ram').textContent = 'RAM: ' + data.ramUsed + ' / ' + data.ramTotal;
  document.getElementById('temp').textContent = 'Temperatur: ' + data.temperature + '°C';
  document.getElementById('disk').textContent = 'Festplatte: ' + data.diskUsed + ' / ' + data.diskTotal;
}

setInterval(fetchStats, 2000);
fetchStats();

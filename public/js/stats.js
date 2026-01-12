async function fetchStats() {
    try {
        const res = await fetch('/api/raspi-stats');
        if (!res.ok) {
            throw new Error(`Server-Fehler: ${res.status}`);
        }

        return await res.json();
    } catch (error) {
        console.error('Fetch-Fehler:', error.message);
    }
}

async function updateStats() {
    try {
        const stats = await fetchStats();
        if (!stats) {
            throw new Error('Stats Daten konnten nicht umgewandelt werden!')
        }
        errorText.textContent = "";
        console.log('Daten erhalten:', stats);
        cpuUsageText.textContent = stats.cpuLoad;
        ramUsageText.textContent = `${stats.ramUsed} / ${stats.ramTotal}`;
        temperatureText.textContent = stats.temperature;
        diskUsageText.textContent = `${stats.diskUsed} / ${stats.diskTotal}`;
    } catch (error) {
        errorText.textContent = 'Daten konnten nicht geladen werden.'
    }
}

const cpuUsageText = document.getElementById('raspi-stats-text-cpu-usage');
const ramUsageText = document.getElementById('raspi-stats-text-ram-usage');
const temperatureText = document.getElementById('raspi-stats-text-temperature');
const diskUsageText = document.getElementById('raspi-stats-text-disk-usage');
const errorText = document.getElementById('raspi-stats-text-error-display');

updateStats();
setInterval(updateStats, 2000);
console.log('hin');
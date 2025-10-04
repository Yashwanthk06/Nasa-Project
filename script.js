console.log("Website loaded successfully!");

const API_KEY = 'af04da80b8b80bf1bb5374eaf896fb62';

const citySelect = document.getElementById('city-select');
const container = document.getElementById('data-container');
const ctx = document.getElementById('aqiChart').getContext('2d');

const chartData = {
  labels: [],
  datasets: [{
    label: 'AQI Trend',
    data: [],
    borderColor: 'rgba(69, 162, 158, 1)',
    backgroundColor: 'rgba(69, 162, 158, 0.2)',
    fill: true,
    tension: 0.3,
  }]
};

const aqiChart = new Chart(ctx, {
  type: 'line',
  data: chartData,
  options: {
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: value => {
            const labels = ["Good", "Fair", "Moderate", "Poor", "Very Poor", ""];
            return labels[value] || value;
          }
        }
      }
    }
  }
});

function updateChart(aqi, timeLabel) {
  if (chartData.labels.length >= 10) {
    chartData.labels.shift();
    chartData.datasets[0].data.shift();
  }
  chartData.labels.push(timeLabel);
  chartData.datasets[0].data.push(aqi);
  aqiChart.update();
}

function fetchAQIData(lat, lon) {
  container.innerHTML = "<p>Loading AQI data...</p>";
  container.className = "";

  fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      const aqi = data.list[0].main.aqi;
      const components = data.list[0].components;

      let message = '';
      let colorClass = '';

      switch (aqi) {
        case 1:
          message = 'Good - Air quality is satisfactory and poses little or no risk.';
          colorClass = 'good';
          break;
        case 2:
          message = 'Fair - Air quality is acceptable; some pollutants may be a moderate health concern for sensitive people.';
          colorClass = 'fair';
          break;
        case 3:
          message = 'Moderate - Members of sensitive groups may experience health effects; general public unlikely affected.';
          colorClass = 'moderate';
          break;
        case 4:
          message = 'Poor - Everyone may begin to experience health effects; sensitive groups may experience more serious effects.';
          colorClass = 'unhealthy';
          break;
        case 5:
          message = 'Very Poor - Health alert: everyone may experience more serious health effects.';
          colorClass = 'very-unhealthy';
          break;
        default:
          message = 'Unknown air quality.';
          colorClass = 'hazardous';
      }

      container.className = colorClass;
      container.innerHTML = `
        <p><strong>AQI:</strong> ${aqi} — ${message}</p>
        <p><strong>PM2.5:</strong> ${components.pm2_5.toFixed(1)} μg/m³</p>
        <p><strong>PM10:</strong> ${components.pm10.toFixed(1)} μg/m³</p>
        <p><strong>CO:</strong> ${components.co.toFixed(1)} μg/m³ - Carbon monoxide can cause harmful health effects by reducing oxygen delivery to the body's organs and tissues.</p>
        <p><strong>NO₂:</strong> ${components.no2.toFixed(1)} μg/m³ - Nitrogen dioxide exposure can irritate airways and worsen respiratory diseases.</p>
        <p><strong>O₃:</strong> ${components.o3.toFixed(1)} μg/m³ - Ozone exposure can cause breathing problems and aggravate lung diseases.</p>
        <p><strong>SO₂:</strong> ${components.so2.toFixed(1)} μg/m³ - Sulfur dioxide can cause respiratory symptoms and aggravate existing heart and lung diseases.</p>
      `;

      const now = new Date();
      const timeLabel = now.toLocaleTimeString();

      updateChart(aqi, timeLabel);
    })
    .catch(error => {
      container.textContent = 'Failed to load AQI data.';
      console.error('Error fetching AQI:', error);
    });
}

function getCoordinates(value) {
  const parts = value.split(',');
  return { lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
}

function loadData() {
  const { lat, lon } = getCoordinates(citySelect.value);
  fetchAQIData(lat, lon);
}

window.onload = loadData;
citySelect.addEventListener('change', loadData);

// Initialize map centered on Karnataka
const map = L.map('map').setView([15.3173, 75.7139], 7);

// Add OpenStreetMap tiles (free, no subscription)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Example cities with lat-lon and AQI (replace AQI with real data fetched or default)
const cities = [
  {name: 'Bangalore', coords: [12.9716, 77.5946], aqi: 2},
  {name: 'Mysore', coords: [12.2958, 76.6394], aqi: 3},
  {name: 'Mangalore', coords: [12.9141, 74.8560], aqi: 1},
  {name: 'Hubli', coords: [15.3647, 75.1234], aqi: 4},
  {name: 'Belgaum', coords: [15.8497, 74.4977], aqi: 2}
];

// Map AQI value to hex color code
function getColorByAQI(aqi) {
  switch (aqi) {
    case 1: return '#00e400';  // Green
    case 2: return '#ffff00';  // Yellow
    case 3: return '#ff7e00';  // Orange
    case 4: return '#ff0000';  // Red
    case 5: return '#8f3f97';  // Purple
    default: return '#999999'; // Gray fallback
  }
}

// Add markers
cities.forEach(city => {
  const color = getColorByAQI(city.aqi);
  
  const marker = L.circleMarker(city.coords, {
    radius: 10,
    color: color,
    fillColor: color,
    fillOpacity: 0.7
  }).addTo(map);

  marker.bindPopup(`<strong>${city.name}</strong><br>AQI: ${city.aqi}`);
  marker.on('click', () => {
    alert(`Load AQI data for ${city.name} here.`);
  });
});

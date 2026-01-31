import { parseCSV, parseMetadata } from './fileReader.js';
import { calculateOrdination } from './ordination.js';
import { drawHeatmap, drawOrdination, downloadImage } from './plot.js';

let parsedData = null;
let parsedMeta = null;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const metaFile = document.getElementById('metaFile');
const plotBtn = document.getElementById('plotBtn');
const plotType = document.getElementById('plotType');
const distanceType = document.getElementById('distanceType');
const distanceGroup = document.getElementById('distanceGroup');
const exportBtn = document.getElementById('exportBtn');
const formatType = document.getElementById('formatType');
const plotStatus = document.getElementById('plotStatus');
const dataUpload = document.getElementById('dataUpload');
const metaUpload = document.getElementById('metaUpload');
const dataFileName = document.getElementById('dataFileName');
const metaFileName = document.getElementById('metaFileName');

// File input handlers
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) {
    dataUpload.classList.remove('has-file');
    dataFileName.textContent = '';
    return;
  }

  // Update UI to show file is selected
  dataUpload.classList.add('has-file');
  dataFileName.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    const delimiter = e.target.result.includes('\t') ? '\t' : ',';
    parsedData = parseCSV(e.target.result, delimiter);
    showStatus(`Loaded ${parsedData.labels.length} samples with ${parsedData.headers.length} features`, 'success');
    renderPlot();
  };
  reader.onerror = () => {
    showStatus('Error reading data file', 'error');
  };
  reader.readAsText(file);
});

metaFile.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) {
    metaUpload.classList.remove('has-file');
    metaFileName.textContent = '';
    return;
  }

  // Update UI to show file is selected
  metaUpload.classList.add('has-file');
  metaFileName.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    const delimiter = e.target.result.includes('\t') ? '\t' : ',';
    parsedMeta = parseMetadata(e.target.result, delimiter);
    const groupCount = [...new Set(parsedMeta.groups)].length;
    showStatus(`Loaded metadata with ${groupCount} groups`, 'success');
    renderPlot();
  };
  reader.onerror = () => {
    showStatus('Error reading metadata file', 'error');
  };
  reader.readAsText(file);
});

// Control handlers
plotBtn.addEventListener('click', renderPlot);
plotType.addEventListener('change', () => {
  updateDistanceVisibility();
  renderPlot();
});
distanceType.addEventListener('change', renderPlot);

exportBtn.addEventListener('click', () => {
  const format = formatType.value;
  downloadImage(format);
  showStatus(`Downloading plot as ${format.toUpperCase()}...`, 'success');
});

// Update distance metric visibility based on plot type
function updateDistanceVisibility() {
  const method = plotType.value;
  // Distance metric is only relevant for NMDS and PCoA
  if (method === 'heatmap' || method === 'pca') {
    distanceGroup.style.opacity = '0.5';
    distanceType.disabled = true;
  } else {
    distanceGroup.style.opacity = '1';
    distanceType.disabled = false;
  }
}

// Show status message
function showStatus(message, type) {
  plotStatus.textContent = message;
  plotStatus.className = `plot-status ${type}`;
  plotStatus.hidden = false;

  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      plotStatus.hidden = true;
    }, 3000);
  }
}

// Main render function
function renderPlot() {
  if (!parsedData) {
    return;
  }

  const method = plotType.value;
  const { headers, labels, values } = parsedData;

  // Clear placeholder if present
  const placeholder = document.querySelector('.plot-placeholder');
  if (placeholder) {
    placeholder.remove();
  }

  // Enable export button
  exportBtn.disabled = false;

  try {
    if (method === 'heatmap') {
      drawHeatmap(headers, labels, values);
      showStatus(`Heatmap generated: ${labels.length} samples x ${headers.length} features`, 'success');
    } else {
      const metric = distanceType.value;
      const coords = calculateOrdination(values, method, metric);

      if (parsedMeta) {
        drawOrdination(labels, coords, method, parsedMeta);
      } else {
        drawOrdination(labels, coords, method, null);
      }

      const methodName = method.toUpperCase();
      const metricName = method === 'pca' ? '' : ` (${metric})`;
      showStatus(`${methodName} ordination complete${metricName}`, 'success');
    }
  } catch (error) {
    console.error('Plot error:', error);
    showStatus(`Error generating plot: ${error.message}`, 'error');
  }
}

// Initialize distance visibility on load
updateDistanceVisibility();

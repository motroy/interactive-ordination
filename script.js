import { parseCSV } from './fileReader.js';
import { calculateOrdination } from './ordination.js';
import { drawHeatmap, drawOrdination, downloadImage } from './plot.js';

let parsedData = null;

document.getElementById('fileInput').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const delimiter = e.target.result.includes('\t') ? '\t' : ',';
    parsedData = parseCSV(e.target.result, delimiter);
    renderPlot();
  };
  reader.readAsText(file);
});

document.getElementById('plotBtn').addEventListener('click', renderPlot);
document.getElementById('plotType').addEventListener('change', renderPlot);
document.getElementById('distanceType').addEventListener('change', renderPlot);
document.getElementById('exportBtn').addEventListener('click', () => {
  const format = document.getElementById('formatType').value;
  downloadImage(format);
});

function renderPlot() {
  if (!parsedData) {
    alert("Please upload a CSV or TSV file.");
    return;
  }

  const method = document.getElementById('plotType').value;
  const { headers, labels, values } = parsedData;

  if (method === 'heatmap') {
    drawHeatmap(headers, labels, values);
  } else {
    const metric = document.getElementById('distanceType').value;
    const coords = calculateOrdination(values, method, metric);
    drawOrdination(labels, coords, method);
  }
}

import { parseCSV } from './fileReader.js';
import { calculateOrdination } from './ordination.js';
import { drawHeatmap, drawOrdination, downloadImage } from './plot.js';

// Add event listeners
document.getElementById('plotBtn').addEventListener('click', renderPlot);
document.getElementById('plotType').addEventListener('change', renderPlot);
document.getElementById('distanceType').addEventListener('change', renderPlot);
document.getElementById('exportBtn').addEventListener('click', () => {
  const format = document.getElementById('formatType').value;
  downloadImage(format);
});

// Render the plot based on current selections
function renderPlot() {
  const fileInput = document.getElementById('fileInput');
  const method = document.getElementById('plotType').value;
  const metric = document.getElementById('distanceType').value;

  if (!fileInput.files.length) {
    alert("Please upload a CSV or TSV file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const delimiter = reader.result.includes('\t') ? '\t' : ',';
    const { headers, labels, values } = parseCSV(reader.result, delimiter);

    if (method === 'heatmap') {
      drawHeatmap(headers, labels, values);
    } else {
      const coords = calculateOrdination(values, method, document.getElementById('distanceType').value);
      drawOrdination(labels, coords, method);
    }
  };
  reader.readAsText(fileInput.files[0]);
}

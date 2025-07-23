function parseCSV(text, delimiter = ',') {
  const rows = text.trim().split('\n').map(r => r.split(delimiter));
  const headers = rows[0].slice(1);
  const labels = rows.slice(1).map(r => r[0]);
  const values = rows.slice(1).map(r => r.slice(1).map(Number));
  return { headers, labels, values };
}

function drawHeatmap(headers, labels, values) {
  Plotly.newPlot('plot', [{
    z: values,
    x: headers,
    y: labels,
    type: 'heatmap',
    colorscale: 'Viridis'
  }], { title: 'Heatmap' });
}

function drawPCA(labels, values) {
  const pca = new ML.PCA(values);
  const scores = pca.predict(values);

  Plotly.newPlot('plot', [{
    x: scores.map(p => p[0]),
    y: scores.map(p => p[1]),
    mode: 'markers',
    type: 'scatter',
    text: labels
  }], {
    title: 'PCA Ordination',
    xaxis: { title: 'PC1' },
    yaxis: { title: 'PC2' }
  });
}

function drawNMDS(labels, values) {
  const distMatrix = computeDistanceMatrix(values);
  const coords = runNMDS(distMatrix);

  Plotly.newPlot('plot', [{
    x: coords.map(p => p[0]),
    y: coords.map(p => p[1]),
    mode: 'markers',
    type: 'scatter',
    text: labels
  }], {
    title: 'NMDS Ordination',
    xaxis: { title: 'Axis 1' },
    yaxis: { title: 'Axis 2' }
  });
}

function computeDistanceMatrix(values) {
  const n = values.length;
  const matrix = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = euclidean(values[i], values[j]);
    }
  }
  return matrix;
}

function euclidean(a, b) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
}

// Simplified NMDS sketch
function runNMDS(distMatrix, dimensions = 2) {
  const n = distMatrix.length;
  let coords = numeric.random([n, dimensions]);
  for (let i = 0; i < 200; i++) {
    coords = numeric.dot(coords, 0.99); // Fake optimization loop
  }
  return coords;
}

document.getElementById('fileInput').addEventListener('change', (e) => {
  const reader = new FileReader();
  reader.onload = () => {
    const delimiter = reader.result.includes('\t') ? '\t' : ',';
    const { headers, labels, values } = parseCSV(reader.result, delimiter);
    const plotType = document.getElementById('plotType').value;

    if (plotType === 'heatmap') drawHeatmap(headers, labels, values);
    else if (plotType === 'pca') drawPCA(labels, values);
    else if (plotType === 'nmds') drawNMDS(labels, values);
  };
  reader.readAsText(e.target.files[0]);
});

document.getElementById('exportBtn').addEventListener('click', () => {
  Plotly.downloadImage('plot', {
    format: 'png',
    width: 1000,
    height: 800,
    filename: 'ordination_export'
  });
});

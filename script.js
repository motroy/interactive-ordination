function parseCSV(text, delimiter = ',') {
  const rows = text.trim().split('\n').map(r => r.split(delimiter));
  const headers = rows[0].slice(1);
  const labels = rows.slice(1).map(r => r[0]);
  const values = rows.slice(1).map(r => r.slice(1).map(Number));
  return { headers, labels, values };
}

function computeDistanceMatrix(values) {
  const dist = [];
  for (let i = 0; i < values.length; i++) {
    dist[i] = [];
    for (let j = 0; j < values.length; j++) {
      dist[i][j] = euclidean(values[i], values[j]);
    }
  }
  return dist;
}

function euclidean(a, b) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
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

function runNMDS(dist, dim = 2) {
  const n = dist.length;
  let coords = numeric.random([n, dim]);
  for (let i = 0; i < 100; i++) {
    coords = numeric.dot(coords, 0.98);
  }
  return coords;
}

function drawNMDS(labels, values) {
  const dist = computeDistanceMatrix(values);
  const coords = runNMDS(dist);
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

function runPCoA(dist) {
  const n = dist.length;
  const D2 = dist.map(r => r.map(d => d ** 2));
  const rowMeans = D2.map(r => r.reduce((a, b) => a + b, 0) / n);
  const colMeans = D2[0].map((_, j) => D2.reduce((a, b) => a + b[j], 0) / n);
  const totalMean = rowMeans.reduce((a, b) => a + b, 0) / n;

  const B = D2.map((row, i) =>
    row.map((val, j) => -0.5 * (val - rowMeans[i] - colMeans[j] + totalMean))
  );

  const eig = numeric.eig(B);
  const vectors = eig.E.x;
  const values = eig.lambda.x;

  return vectors.map(row =>
    [row[0] * Math.sqrt(values[0]), row[1] * Math.sqrt(values[1])]
  );
}

function drawPCoA(labels, values) {
  const dist = computeDistanceMatrix(values);
  const coords = runPCoA(dist);
  Plotly.newPlot('plot', [{
    x: coords.map(p => p[0]),
    y: coords.map(p => p[1]),
    mode: 'markers',
    type: 'scatter',
    text: labels
  }], {
    title: 'PCoA Ordination',
    xaxis: { title: 'Coord 1' },
    yaxis: { title: 'Coord 2' }
  });
}

document.getElementById('fileInput').addEventListener('change', (e) => {
  const reader = new FileReader();
  reader.onload = () => {
    const delimiter = reader.result.includes('\t') ? '\t' : ',';
    const { headers, labels, values } = parseCSV(reader.result, delimiter);
    const method = document.getElementById('plotType').value;

    if (method === 'heatmap') drawHeatmap(headers, labels, values);
    else if (method === 'pca') drawPCA(labels, values);
    else if (method === 'nmds') drawNMDS(labels, values);
    else if (method === 'pcoa') drawPCoA(labels, values);
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

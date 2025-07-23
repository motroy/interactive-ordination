// Holds parsed input data for plotting
let parsedData = null;

// Handle image export (PNG or SVG)
document.getElementById('exportBtn').addEventListener('click', () => {
  const format = document.getElementById('formatType').value;
  Plotly.downloadImage('plot', {
    format: format,
    width: 1000,
    height: 800,
    filename: 'ordination_export'
  });
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
    parsedData = parseCSV(reader.result, delimiter);
    const { headers, labels, values } = parsedData;

    if (method === 'heatmap') drawHeatmap(headers, labels, values);
    else if (method === 'pca') drawPCA(labels, values);
    else if (method === 'nmds') drawNMDS(labels, values, metric);
    else if (method === 'pcoa') drawPCoA(labels, values, metric);
  };
  reader.readAsText(fileInput.files[0]);
}

// Add event listeners
document.getElementById('plotBtn').addEventListener('click', renderPlot);
document.getElementById('plotType').addEventListener('change', renderPlot);
document.getElementById('distanceType').addEventListener('change', renderPlot);

// Parse CSV or TSV
function parseCSV(text, delimiter = ',') {
  const rows = text.trim().split('\n').map(r => r.split(delimiter));
  const headers = rows[0].slice(1);
  const labels = rows.slice(1).map(r => r[0]);
  const values = rows.slice(1).map(r => r.slice(1).map(Number));
  return { headers, labels, values };
}

// Compute distance matrix using selected method
function computeDistanceMatrix(values, method = 'euclidean') {
  return values.map((a, i) =>
    values.map((b, j) =>
      method === 'jaccard' ? jaccardDistance(a, b) :
      method === 'bray' ? brayCurtisDistance(a, b) :
      euclidean(a, b)
    )
  );
}

function euclidean(a, b) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
}

function jaccardDistance(a, b) {
  let inter = 0, union = 0;
  for (let i = 0; i < a.length; i++) {
    const hasA = a[i] !== 0, hasB = b[i] !== 0;
    if (hasA || hasB) union++;
    if (hasA && hasB) inter++;
  }
  return union ? 1 - inter / union : 1;
}

function brayCurtisDistance(a, b) {
  let sumMin = 0, sumTotal = 0;
  for (let i = 0; i < a.length; i++) {
    sumMin += Math.min(a[i], b[i]);
    sumTotal += a[i] + b[i];
  }
  return sumTotal ? 1 - (2 * sumMin) / sumTotal : 1;
}

// Visualization functions
function drawHeatmap(headers, labels, values) {
  Plotly.newPlot('plot', [{
    z: values,
    x: headers,
    y: labels,
    type: 'heatmap',
    colorscale: 'Viridis'
  }], {
    title: 'Heatmap',
    margin: { t: 50 }
  });
}

function drawPCA(labels, values) {
  const pca = new ML.PCA(values);
  const scores = pca.predict(values);
  Plotly.newPlot('plot', [{
    x: scores.map(p => p[0]),
    y: scores.map(p => p[1]),
    text: labels,
    mode: 'markers',
    type: 'scatter',
    marker: { size: 8 }
  }], {
    title: 'PCA Ordination',
    xaxis: { title: 'PC1' },
    yaxis: { title: 'PC2' },
    margin: { t: 50 }
  });
}

function runNMDS(dist, dimensions = 2) {
  const n = dist.length;
  let coords = numeric.random([n, dimensions]);
  for (let i = 0; i < 100; i++) {
    coords = numeric.dot(coords, 0.98);
  }
  return coords;
}

function drawNMDS(labels, values, metric) {
  const dist = computeDistanceMatrix(values, metric);
  const coords = runNMDS(dist);
  Plotly.newPlot('plot', [{
    x: coords.map(p => p[0]),
    y: coords.map(p => p[1]),
    text: labels,
    mode: 'markers',
    type: 'scatter',
    marker: { size: 8 }
  }], {
    title: 'NMDS Ordination',
    xaxis: { title: 'Axis 1' },
    yaxis: { title: 'Axis 2' },
    margin: { t: 50 }
  });
}

function runPCoA(dist) {
  const n = dist.length;

  // Square the distance matrix
  const D2 = dist.map(row => row.map(d => d ** 2));

  // Double center the squared distance matrix
  const J = numeric.sub(numeric.identity(n), numeric.div(numeric.rep([n, n], 1), n));
  const B = numeric.dot(numeric.dot(J, D2), J);
  for (let i = 0; i < B.length; i++) {
    for (let j = 0; j < B[i].length; j++) {
      B[i][j] *= -0.5;
    }
  }
  
  // Perform eigendecomposition
  const eig = numeric.eig(B);
  const vectors = eig.E.x;
  const values = eig.lambda.x;

  // Sort eigenvectors by eigenvalues in descending order
  const sortedIndices = values.map((_, i) => i).sort((a, b) => values[b] - values[a]);
  const sortedVectors = sortedIndices.map(i => vectors[i]);
  const sortedValues = sortedIndices.map(i => values[i]);

  // Compute the coordinates, accounting for negative eigenvalues
  return sortedVectors[0].map((_, i) => [
    sortedVectors[0][i] * Math.sqrt(Math.max(0, sortedValues[0])),
    sortedVectors[1][i] * Math.sqrt(Math.max(0, sortedValues[1]))
  ]);
}

function drawPCoA(labels, values, metric) {
  const dist = computeDistanceMatrix(values, metric);
  const coords = runPCoA(dist);
  Plotly.newPlot('plot', [{
    x: coords.map(p => p[0]),
    y: coords.map(p => p[1]),
    text: labels,
    mode: 'markers',
    type: 'scatter',
    marker: { size: 8 }
  }], {
    title: 'PCoA Ordination',
    xaxis: { title: 'Coord 1' },
    yaxis: { title: 'Coord 2' },
    margin: { t: 50 }
  });
}

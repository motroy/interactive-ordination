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

function drawOrdination(labels, coords, method) {
  const title = `${method.toUpperCase()} Ordination`;
  const xAxis = method === 'pca' ? 'PC1' : 'Axis 1';
  const yAxis = method === 'pca' ? 'PC2' : 'Axis 2';
  Plotly.newPlot('plot', [{
    x: coords.map(p => p[0]),
    y: coords.map(p => p[1]),
    text: labels,
    mode: 'markers',
    type: 'scatter',
    marker: { size: 8 }
  }], {
    title: title,
    xaxis: { title: xAxis },
    yaxis: { title: yAxis },
    margin: { t: 50 }
  });
}

function downloadImage(format) {
  Plotly.downloadImage('plot', {
    format: format,
    width: 1000,
    height: 800,
    filename: 'ordination_export'
  });
}

export { drawHeatmap, drawOrdination, downloadImage };

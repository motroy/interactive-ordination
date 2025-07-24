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

function drawOrdination(labels, coords, method, metadata) {
  const title = `${method.toUpperCase()} Ordination`;
  const xAxis = method === 'pca' ? 'PC1' : 'Axis 1';
  const yAxis = method === 'pca' ? 'PC2' : 'Axis 2';

  const data = [{
    x: coords.map(p => p[0]),
    y: coords.map(p => p[1]),
    text: labels,
    mode: 'markers',
    type: 'scatter',
  }];

  if (metadata) {
    const { groups, groupLabels } = metadata;
    const groupSet = [...new Set(groups)];
    const traces = groupSet.map(group => {
      const indices = groups.map((g, i) => g === group ? i : -1).filter(i => i !== -1);
      return {
        x: indices.map(i => coords[i][0]),
        y: indices.map(i => coords[i][1]),
        text: indices.map(i => labels[i]),
        name: group,
        mode: 'markers',
        type: 'scatter',
        marker: { size: 8 }
      };
    });
    Plotly.newPlot('plot', traces, {
      title: title,
      xaxis: { title: xAxis },
      yaxis: { title: yAxis },
      margin: { t: 50 }
    });
  } else {
    data[0].marker = { size: 8 };
    Plotly.newPlot('plot', data, {
      title: title,
      xaxis: { title: xAxis },
      yaxis: { title: yAxis },
      margin: { t: 50 }
    });
  }
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

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
    const { groups } = metadata;
    const groupSet = [...new Set(groups)];
    const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
    const colorMap = {};
    groupSet.forEach((group, i) => {
      colorMap[group] = colors[i % colors.length];
    });

    data[0].marker = {
      size: 8,
      color: groups.map(group => colorMap[group])
    };

    const traces = groupSet.map(group => ({
      x: [null],
      y: [null],
      name: group,
      mode: 'markers',
      marker: {
        color: colorMap[group],
        size: 8
      }
    }));

    Plotly.newPlot('plot', data.concat(traces), {
      title: title,
      xaxis: { title: xAxis },
      yaxis: { title: yAxis },
      margin: { t: 50 },
      showlegend: true
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

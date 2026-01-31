function drawHeatmap(headers, labels, values) {
  Plotly.newPlot('plot', [{
    z: values,
    x: headers,
    y: labels,
    type: 'heatmap',
    colorscale: 'Viridis',
    hoverongaps: false
  }], {
    title: {
      text: 'Heatmap',
      font: { size: 18, color: '#1e293b' }
    },
    margin: { t: 60, l: 100, r: 40, b: 80 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: {
      tickangle: -45,
      tickfont: { size: 11 }
    },
    yaxis: {
      tickfont: { size: 11 }
    }
  }, {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
  });
}

function drawOrdination(labels, coords, method, metadata) {
  const title = `${method.toUpperCase()} Ordination`;
  const xAxis = method === 'pca' ? 'PC1' : 'Axis 1';
  const yAxis = method === 'pca' ? 'PC2' : 'Axis 2';

  const layout = {
    title: {
      text: title,
      font: { size: 18, color: '#1e293b' }
    },
    xaxis: {
      title: { text: xAxis, font: { size: 14 } },
      zeroline: true,
      zerolinecolor: '#e2e8f0',
      gridcolor: '#f1f5f9'
    },
    yaxis: {
      title: { text: yAxis, font: { size: 14 } },
      zeroline: true,
      zerolinecolor: '#e2e8f0',
      gridcolor: '#f1f5f9'
    },
    margin: { t: 60, l: 60, r: 40, b: 60 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(255,255,255,0.8)',
    hovermode: 'closest'
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
  };

  if (metadata) {
    const { groups } = metadata;
    const groupSet = [...new Set(groups)];
    const colors = [
      '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#ec4899', '#84cc16', '#6366f1', '#14b8a6'
    ];
    const colorMap = {};
    groupSet.forEach((group, i) => {
      colorMap[group] = colors[i % colors.length];
    });

    // Create traces for each group (for proper legend)
    const traces = groupSet.map(group => {
      const indices = groups.map((g, i) => g === group ? i : -1).filter(i => i >= 0);
      return {
        x: indices.map(i => coords[i][0]),
        y: indices.map(i => coords[i][1]),
        text: indices.map(i => labels[i]),
        name: group,
        mode: 'markers',
        type: 'scatter',
        marker: {
          color: colorMap[group],
          size: 10,
          line: { color: 'white', width: 1 }
        },
        hovertemplate: '<b>%{text}</b><br>' + xAxis + ': %{x:.3f}<br>' + yAxis + ': %{y:.3f}<extra>' + group + '</extra>'
      };
    });

    layout.showlegend = true;
    layout.legend = {
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(255,255,255,0.9)',
      bordercolor: '#e2e8f0',
      borderwidth: 1
    };

    Plotly.newPlot('plot', traces, layout, config);
  } else {
    const data = [{
      x: coords.map(p => p[0]),
      y: coords.map(p => p[1]),
      text: labels,
      mode: 'markers',
      type: 'scatter',
      marker: {
        size: 10,
        color: '#4f46e5',
        line: { color: 'white', width: 1 }
      },
      hovertemplate: '<b>%{text}</b><br>' + xAxis + ': %{x:.3f}<br>' + yAxis + ': %{y:.3f}<extra></extra>'
    }];

    Plotly.newPlot('plot', data, layout, config);
  }
}

function downloadImage(format) {
  Plotly.downloadImage('plot', {
    format: format,
    width: 1200,
    height: 900,
    filename: 'ordination_export',
    scale: 2
  });
}

export { drawHeatmap, drawOrdination, downloadImage };

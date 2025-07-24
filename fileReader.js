// Parse CSV or TSV
function parseCSV(text, delimiter = ',') {
  const rows = text.trim().split('\n').map(r => r.split(delimiter));
  const headers = rows[0].slice(1);
  const labels = rows.map(r => r[0]).slice(1);
  const values = rows.slice(1).map(r => r.slice(1).map(Number));
  return { headers, labels, values };
}

// Parse metadata file
function parseMetadata(text, delimiter = ',') {
  const rows = text.trim().split('\n').map(r => r.split(delimiter));
  const headers = rows[0];
  const groupLabels = rows.slice(1).map(r => r[0]);
  const groups = rows.slice(1).map(r => r[1]);
  return { groups, groupLabels };
}

export { parseCSV, parseMetadata };

// Parse CSV or TSV
function parseCSV(text, delimiter = ',') {
  const rows = text.trim().split('\n').map(r => r.split(delimiter));
  const headers = rows[0].slice(1);
  const labels = rows.slice(1).map(r => r[0]);
  const values = rows.slice(1).map(r => r.slice(1).map(Number));
  return { headers, labels, values };
}

export { parseCSV };

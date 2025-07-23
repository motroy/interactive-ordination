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

export { computeDistanceMatrix };

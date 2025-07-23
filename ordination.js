import { computeDistanceMatrix } from './distance.js';

function runPCA(values) {
  const pca = new ML.PCA(values);
  return pca.predict(values);
}

function runNMDS(dist, dimensions = 2) {
  const n = dist.length;
  let coords = numeric.random([n, dimensions]);
  for (let i = 0; i < 100; i++) {
    coords = numeric.dot(coords, 0.98);
  }
  return coords;
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

function calculateOrdination(values, method, metric) {
    if (method === 'pca') {
        return runPCA(values);
    }
    const dist = computeDistanceMatrix(values, metric);
    if (method === 'nmds') {
        return runNMDS(dist);
    }
    if (method === 'pcoa') {
        return runPCoA(dist);
    }
}


export { calculateOrdination };

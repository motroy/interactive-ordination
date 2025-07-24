import { computeDistanceMatrix } from './distance.js';
import { PCA } from 'ml-pca';

function runPCA(values) {
  const pca = new PCA(values);
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

    // Double centering
    const rowSums = D2.map(row => row.reduce((a, b) => a + b, 0));
    const colSums = numeric.transpose(D2).map(col => col.reduce((a, b) => a + b, 0));
    const totalSum = rowSums.reduce((a, b) => a + b, 0);

    const B = [];
    for (let i = 0; i < n; i++) {
        B[i] = [];
        for (let j = 0; j < n; j++) {
            B[i][j] = -0.5 * (D2[i][j] - rowSums[i] / n - colSums[j] / n + totalSum / (n * n));
        }
    }

    // Eigendecomposition
    const eig = numeric.eig(B);
    const vectors = eig.E.x;
    const values = eig.lambda.x;

    // Sort by eigenvalue
    const sortedIndices = values.map((_, i) => i).sort((a, b) => values[b] - values[a]);
    const sortedVectors = sortedIndices.map(i => vectors[i]);
    const sortedValues = sortedIndices.map(i => values[i]);

    // Get coordinates
    const coords = [];
    for (let i = 0; i < n; i++) {
        coords.push([
            sortedVectors[0][i] * Math.sqrt(Math.max(0, sortedValues[0])),
            sortedVectors[1][i] * Math.sqrt(Math.max(0, sortedValues[1]))
        ]);
    }
    return coords;
}

function calculateOrdination(values, method, metric) {
    console.log('Input values:', values);
    let coords;
    if (method === 'pca') {
        coords = runPCA(values);
    } else {
        const dist = computeDistanceMatrix(values, metric);
        console.log('Distance matrix:', dist);
        if (method === 'nmds') {
            coords = runNMDS(dist);
        } else if (method === 'pcoa') {
            coords = runPCoA(dist);
        }
    }
    console.log('Output coordinates:', coords);
    return coords;
}


export { calculateOrdination };

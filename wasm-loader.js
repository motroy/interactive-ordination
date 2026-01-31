// WebAssembly module loader
// This module handles loading and initializing the WASM binary

let wasmModule = null;
let wasmReady = false;
let wasmLoadPromise = null;

/**
 * Initialize the WebAssembly module
 * @returns {Promise} Resolves when WASM is ready
 */
export async function initWasm() {
  if (wasmReady) {
    return wasmModule;
  }

  if (wasmLoadPromise) {
    return wasmLoadPromise;
  }

  wasmLoadPromise = (async () => {
    try {
      // Import the wasm-bindgen generated module
      const wasm = await import('./pkg/ordination_wasm.js');
      await wasm.default();
      wasmModule = wasm;
      wasmReady = true;
      console.log('WebAssembly module loaded successfully');
      return wasmModule;
    } catch (error) {
      console.error('Failed to load WebAssembly module:', error);
      throw error;
    }
  })();

  return wasmLoadPromise;
}

/**
 * Check if WASM is ready
 * @returns {boolean}
 */
export function isWasmReady() {
  return wasmReady;
}

/**
 * Get the WASM module (must call initWasm first)
 * @returns {Object|null}
 */
export function getWasm() {
  return wasmModule;
}

/**
 * Compute distance matrix using WASM
 * @param {number[][]} values - 2D array of values
 * @param {string} method - Distance method ('euclidean', 'jaccard', 'bray')
 * @returns {number[][]} Distance matrix
 */
export function computeDistanceMatrix(values, method = 'euclidean') {
  if (!wasmReady) {
    throw new Error('WASM module not initialized. Call initWasm() first.');
  }

  const nSamples = values.length;
  const nFeatures = values[0].length;

  // Flatten the 2D array
  const flat = new Float64Array(nSamples * nFeatures);
  for (let i = 0; i < nSamples; i++) {
    for (let j = 0; j < nFeatures; j++) {
      flat[i * nFeatures + j] = values[i][j];
    }
  }

  // Call WASM function
  const result = wasmModule.compute_distance_matrix(flat, nSamples, nFeatures, method);

  // Convert back to 2D array
  const matrix = [];
  for (let i = 0; i < nSamples; i++) {
    matrix.push(Array.from(result.slice(i * nSamples, (i + 1) * nSamples)));
  }

  return matrix;
}

/**
 * Calculate ordination coordinates using WASM
 * @param {number[][]} values - 2D array of values
 * @param {string} method - Ordination method ('pca', 'nmds', 'pcoa')
 * @param {string} metric - Distance metric ('euclidean', 'jaccard', 'bray')
 * @returns {number[][]} Array of [x, y] coordinates
 */
export function calculateOrdination(values, method, metric = 'euclidean') {
  if (!wasmReady) {
    throw new Error('WASM module not initialized. Call initWasm() first.');
  }

  const nSamples = values.length;
  const nFeatures = values[0].length;

  // Flatten the 2D array
  const flat = new Float64Array(nSamples * nFeatures);
  for (let i = 0; i < nSamples; i++) {
    for (let j = 0; j < nFeatures; j++) {
      flat[i * nFeatures + j] = values[i][j];
    }
  }

  // Call WASM function
  const result = wasmModule.calculate_ordination(flat, nSamples, nFeatures, method, metric);

  // Convert to array of coordinate pairs
  const coords = [];
  for (let i = 0; i < nSamples; i++) {
    coords.push([result[i * 2], result[i * 2 + 1]]);
  }

  return coords;
}

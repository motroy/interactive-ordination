use wasm_bindgen::prelude::*;
use nalgebra::{DMatrix, DVector, SymmetricEigen};
use rand::prelude::*;
use rand::rngs::SmallRng;

#[cfg(feature = "console_error_panic_hook")]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    set_panic_hook();
}

// ============================================================================
// Distance Calculations
// ============================================================================

/// Calculate Euclidean distance between two vectors
fn euclidean_distance(a: &[f64], b: &[f64]) -> f64 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).powi(2))
        .sum::<f64>()
        .sqrt()
}

/// Calculate Jaccard distance between two vectors (presence/absence)
fn jaccard_distance(a: &[f64], b: &[f64]) -> f64 {
    let mut intersection = 0;
    let mut union = 0;

    for (x, y) in a.iter().zip(b.iter()) {
        let has_a = *x != 0.0;
        let has_b = *y != 0.0;
        if has_a || has_b {
            union += 1;
        }
        if has_a && has_b {
            intersection += 1;
        }
    }

    if union == 0 {
        1.0
    } else {
        1.0 - (intersection as f64 / union as f64)
    }
}

/// Calculate Bray-Curtis distance between two vectors
fn bray_curtis_distance(a: &[f64], b: &[f64]) -> f64 {
    let mut sum_min = 0.0;
    let mut sum_total = 0.0;

    for (x, y) in a.iter().zip(b.iter()) {
        sum_min += x.min(*y);
        sum_total += x + y;
    }

    if sum_total == 0.0 {
        1.0
    } else {
        1.0 - (2.0 * sum_min / sum_total)
    }
}

/// Compute distance matrix from flat array of values
/// values: flat array of shape [n_samples * n_features]
/// n_samples: number of samples
/// n_features: number of features
/// method: "euclidean", "jaccard", or "bray"
#[wasm_bindgen]
pub fn compute_distance_matrix(
    values: &[f64],
    n_samples: usize,
    n_features: usize,
    method: &str,
) -> Vec<f64> {
    let dist_fn: fn(&[f64], &[f64]) -> f64 = match method {
        "jaccard" => jaccard_distance,
        "bray" => bray_curtis_distance,
        _ => euclidean_distance,
    };

    let mut result = vec![0.0; n_samples * n_samples];

    for i in 0..n_samples {
        let row_i = &values[i * n_features..(i + 1) * n_features];
        for j in i..n_samples {
            let row_j = &values[j * n_features..(j + 1) * n_features];
            let dist = dist_fn(row_i, row_j);
            result[i * n_samples + j] = dist;
            result[j * n_samples + i] = dist;
        }
    }

    result
}

// ============================================================================
// PCA (Principal Component Analysis)
// ============================================================================

/// Perform PCA and return coordinates for the first 2 components
/// values: flat array of shape [n_samples * n_features]
/// n_samples: number of samples
/// n_features: number of features
#[wasm_bindgen]
pub fn calculate_pca(values: &[f64], n_samples: usize, n_features: usize) -> Vec<f64> {
    // Convert to matrix
    let data = DMatrix::from_row_slice(n_samples, n_features, values);

    // Center the data (subtract column means)
    let means: DVector<f64> = data.row_mean().transpose();
    let centered = DMatrix::from_fn(n_samples, n_features, |i, j| {
        data[(i, j)] - means[j]
    });

    // Compute covariance matrix
    let cov = (&centered.transpose() * &centered) / ((n_samples - 1) as f64);

    // Compute eigendecomposition
    let eigen = SymmetricEigen::new(cov);
    let eigenvalues = eigen.eigenvalues;
    let eigenvectors = eigen.eigenvectors;

    // Sort eigenvalues and get indices of top 2
    let mut indices: Vec<usize> = (0..eigenvalues.len()).collect();
    indices.sort_by(|&a, &b| eigenvalues[b].partial_cmp(&eigenvalues[a]).unwrap());

    // Project data onto first 2 principal components
    let n_components = 2.min(n_features);
    let mut result = vec![0.0; n_samples * 2];

    for i in 0..n_samples {
        for k in 0..n_components {
            let pc_idx = indices[k];
            let mut coord = 0.0;
            for j in 0..n_features {
                coord += centered[(i, j)] * eigenvectors[(j, pc_idx)];
            }
            result[i * 2 + k] = coord;
        }
    }

    result
}

// ============================================================================
// PCoA (Principal Coordinates Analysis)
// ============================================================================

/// Perform PCoA on a distance matrix
/// dist_matrix: flat array of shape [n_samples * n_samples]
/// n_samples: number of samples
#[wasm_bindgen]
pub fn calculate_pcoa(dist_matrix: &[f64], n_samples: usize) -> Vec<f64> {
    // Convert to matrix
    let d = DMatrix::from_row_slice(n_samples, n_samples, dist_matrix);

    // Square the distances
    let d_sq = d.map(|x| x * x);

    // Double centering
    let _n = n_samples as f64;
    let row_means: DVector<f64> = d_sq.row_mean().transpose();
    let col_means: DVector<f64> = d_sq.column_mean();
    let grand_mean = d_sq.mean();

    let b = DMatrix::from_fn(n_samples, n_samples, |i, j| {
        -0.5 * (d_sq[(i, j)] - row_means[j] - col_means[i] + grand_mean)
    });

    // Eigendecomposition
    let eigen = SymmetricEigen::new(b);
    let eigenvalues = eigen.eigenvalues;
    let eigenvectors = eigen.eigenvectors;

    // Sort by eigenvalue (descending)
    let mut indices: Vec<usize> = (0..eigenvalues.len()).collect();
    indices.sort_by(|&a, &b| eigenvalues[b].partial_cmp(&eigenvalues[a]).unwrap());

    // Get coordinates from top 2 eigenvectors
    let mut result = vec![0.0; n_samples * 2];

    for i in 0..n_samples {
        for k in 0..2.min(n_samples) {
            let idx = indices[k];
            let eigenval = eigenvalues[idx].max(0.0);
            result[i * 2 + k] = eigenvectors[(i, idx)] * eigenval.sqrt();
        }
    }

    result
}

// ============================================================================
// NMDS (Non-metric Multidimensional Scaling)
// ============================================================================

/// Perform NMDS on a distance matrix
/// dist_matrix: flat array of shape [n_samples * n_samples]
/// n_samples: number of samples
/// max_iter: maximum iterations (default 100)
#[wasm_bindgen]
pub fn calculate_nmds(dist_matrix: &[f64], n_samples: usize, max_iter: usize) -> Vec<f64> {
    let n = n_samples;
    let dims = 2;

    // Initialize with random coordinates (seeded for reproducibility)
    let mut rng = SmallRng::seed_from_u64(42);
    let mut coords: Vec<f64> = (0..n * dims)
        .map(|_| rng.gen::<f64>() - 0.5)
        .collect();

    let learning_rate = 0.05;
    let iterations = max_iter.max(50);

    for _ in 0..iterations {
        // Compute current distances
        let mut current_dist = vec![0.0; n * n];
        for i in 0..n {
            for j in (i + 1)..n {
                let dx = coords[i * dims] - coords[j * dims];
                let dy = coords[i * dims + 1] - coords[j * dims + 1];
                let d = (dx * dx + dy * dy).sqrt();
                current_dist[i * n + j] = d;
                current_dist[j * n + i] = d;
            }
        }

        // Gradient descent step
        for i in 0..n {
            for j in (i + 1)..n {
                let target = dist_matrix[i * n + j];
                let current = current_dist[i * n + j];

                if current > 1e-10 {
                    let diff = (target - current) * learning_rate / current;

                    let dx = coords[j * dims] - coords[i * dims];
                    let dy = coords[j * dims + 1] - coords[i * dims + 1];

                    coords[i * dims] -= dx * diff;
                    coords[i * dims + 1] -= dy * diff;
                    coords[j * dims] += dx * diff;
                    coords[j * dims + 1] += dy * diff;
                }
            }
        }
    }

    // Center the result
    let mut mean_x = 0.0;
    let mut mean_y = 0.0;
    for i in 0..n {
        mean_x += coords[i * dims];
        mean_y += coords[i * dims + 1];
    }
    mean_x /= n as f64;
    mean_y /= n as f64;

    for i in 0..n {
        coords[i * dims] -= mean_x;
        coords[i * dims + 1] -= mean_y;
    }

    coords
}

// ============================================================================
// Combined Ordination Function
// ============================================================================

/// Calculate ordination coordinates
/// values: flat array of shape [n_samples * n_features]
/// n_samples: number of samples
/// n_features: number of features
/// method: "pca", "nmds", or "pcoa"
/// metric: "euclidean", "jaccard", or "bray" (for NMDS and PCoA)
#[wasm_bindgen]
pub fn calculate_ordination(
    values: &[f64],
    n_samples: usize,
    n_features: usize,
    method: &str,
    metric: &str,
) -> Vec<f64> {
    match method {
        "pca" => calculate_pca(values, n_samples, n_features),
        "nmds" => {
            let dist = compute_distance_matrix(values, n_samples, n_features, metric);
            calculate_nmds(&dist, n_samples, 100)
        }
        "pcoa" => {
            let dist = compute_distance_matrix(values, n_samples, n_features, metric);
            calculate_pcoa(&dist, n_samples)
        }
        _ => calculate_pca(values, n_samples, n_features),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_euclidean_distance() {
        let a = vec![0.0, 0.0];
        let b = vec![3.0, 4.0];
        assert!((euclidean_distance(&a, &b) - 5.0).abs() < 1e-10);
    }

    #[test]
    fn test_jaccard_distance() {
        let a = vec![1.0, 1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 1.0, 0.0];
        // intersection = 1, union = 3, distance = 1 - 1/3 = 2/3
        assert!((jaccard_distance(&a, &b) - 2.0/3.0).abs() < 1e-10);
    }

    #[test]
    fn test_distance_matrix() {
        let values = vec![0.0, 0.0, 3.0, 4.0];
        let result = compute_distance_matrix(&values, 2, 2, "euclidean");
        assert_eq!(result.len(), 4);
        assert!((result[0] - 0.0).abs() < 1e-10); // d(0,0)
        assert!((result[1] - 5.0).abs() < 1e-10); // d(0,1)
    }
}

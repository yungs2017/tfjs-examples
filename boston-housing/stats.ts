/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/**
 * Provides a function that calculates column level statistics, i.e. min, max,
 * variance, stddev.
 *
 * @param dataset The Dataset object whose statistics will be calculated.
 * @return A DatasetStatistics object that contains NumericColumnStatistics of
 *     each column.
 */
export async function computeDatasetStatistics(dataset) {
  const result = {};

  await dataset.forEach(e => {
    for (const key of Object.keys(e)) {
      const value = e[key];
      if (typeof (value) === 'string') {
        // No statistics for string element.
      } else {
        let previousMean = 0;
        let previousLength = 0;
        let previousVariance = 0;
        let columnStats = result[key];
        if (columnStats == null) {
          columnStats = {
            min: Number.POSITIVE_INFINITY,
            max: Number.NEGATIVE_INFINITY,
            mean: 0,
            variance: 0,
            stddev: 0,
            length: 0
          };
          result[key] = columnStats;
        } else {
          previousMean = columnStats.mean;
          previousLength = columnStats.length;
          previousVariance = columnStats.variance;
        }

        // Calculate accumulated mean and variance following tf.Transform
        // implementation
        const combinedLength = previousLength + 1;
        const combinedMean =
            previousMean + (1 / combinedLength) * (value - previousMean);
        const combinedVariance = previousVariance +
            (1 / combinedLength) *
                (((value - combinedMean) * (value - previousMean)) -
                 previousVariance);

        columnStats.min = Math.min(columnStats.min, value);
        columnStats.max = Math.max(columnStats.max, value);
        columnStats.length = combinedLength;
        columnStats.mean = combinedMean;
        columnStats.variance = combinedVariance;
        columnStats.stddev = Math.sqrt(combinedVariance);
      }
    }
  });
  // Variance and stddev should be NaN for the case of a single element.
  for (const key in result) {
    if (result[key].length === 1) {
      result[key].variance = NaN;
    }
  }
  return result;
}

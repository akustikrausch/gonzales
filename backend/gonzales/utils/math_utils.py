"""Shared math utility functions for statistical calculations."""

import math


def coefficient_of_variation(values: list[float]) -> float:
    """Calculate coefficient of variation (std/mean).

    Returns 0 if insufficient data or mean is 0.
    """
    if not values or len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    if mean == 0:
        return 0.0
    variance = sum((v - mean) ** 2 for v in values) / (len(values) - 1)
    std = math.sqrt(variance)
    return std / mean


def pearson_correlation(x: list[float], y: list[float]) -> float:
    """Calculate Pearson correlation coefficient.

    Args:
        x: First list of values.
        y: Second list of values.

    Returns:
        Pearson correlation coefficient, or 0.0 if insufficient data.
    """
    n = len(x)
    if n != len(y) or n < 2:
        return 0.0

    mean_x = sum(x) / n
    mean_y = sum(y) / n

    numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
    denom_x = math.sqrt(sum((x[i] - mean_x) ** 2 for i in range(n)))
    denom_y = math.sqrt(sum((y[i] - mean_y) ** 2 for i in range(n)))

    if denom_x == 0 or denom_y == 0:
        return 0.0

    return numerator / (denom_x * denom_y)

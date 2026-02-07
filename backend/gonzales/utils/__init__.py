"""Gonzales utility modules."""

from gonzales.utils.connection_detector import ConnectionType, detect_connection_type
from gonzales.utils.math_utils import coefficient_of_variation, pearson_correlation

__all__ = [
    "ConnectionType",
    "coefficient_of_variation",
    "detect_connection_type",
    "pearson_correlation",
]

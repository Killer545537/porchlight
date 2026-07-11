def normalize_amenities(names: list[str]) -> list[str]:
    """Strip/lowercase/dedupe, preserving first-seen order."""
    seen: list[str] = []
    for raw in names:
        name = raw.strip().lower()
        if name and name not in seen:
            seen.append(name)
    return seen


def validate_price_range(min_price: float | None, max_price: float | None) -> None:
    if min_price is not None and max_price is not None and min_price > max_price:
        raise ValueError("min_price must be <= max_price")


def validate_bounds(
    min_latitude: float | None,
    max_latitude: float | None,
    min_longitude: float | None,
    max_longitude: float | None,
) -> None:
    if (
        min_latitude is not None
        and max_latitude is not None
        and min_latitude > max_latitude
    ):
        raise ValueError("min_latitude must be <= max_latitude")
    if (
        min_longitude is not None
        and max_longitude is not None
        and min_longitude > max_longitude
    ):
        raise ValueError("min_longitude must be <= max_longitude")

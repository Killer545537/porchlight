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

from datetime import date


def validate_date_range(check_in: date, check_out: date) -> None:
    if check_out <= check_in:
        raise ValueError("check_out must be after check_in")

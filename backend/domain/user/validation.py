def normalize_email(email: str) -> str:
    """Lowercase + strip so 'Alice@Example.com' and 'alice@example.com' are the same account."""
    return email.strip().lower()

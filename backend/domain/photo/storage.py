import uuid
from pathlib import Path

from fastapi import UploadFile

from domain.errors import BadRequestError

# ponytail: local disk for now — swap this function's body for an S3 upload
# later, response shape (a URL string) stays the same. See ARCHITECTURE.md.
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "static" / "uploads"
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5MB

_EXTENSION_BY_CONTENT_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def save_upload(file: UploadFile) -> str:
    extension = _EXTENSION_BY_CONTENT_TYPE.get(file.content_type or "")
    if extension is None:
        raise BadRequestError(f"Unsupported file type: {file.content_type}")

    contents = file.file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise BadRequestError(f"File too large — max {MAX_UPLOAD_BYTES // (1024 * 1024)}MB")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{extension}"
    (UPLOAD_DIR / filename).write_bytes(contents)
    return f"/static/uploads/{filename}"


def delete_upload(url: str) -> None:
    filename = url.rsplit("/", 1)[-1]
    (UPLOAD_DIR / filename).unlink(missing_ok=True)

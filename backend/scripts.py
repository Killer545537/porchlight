import os


def dev():
    os.execvp("uvicorn", ["uvicorn", "main:app", "--reload"])


def format():
    os.execvp("ruff", ["ruff", "format", "."])


def lint():
    os.execvp("ruff", ["ruff", "check", "."])


def typecheck():
    os.execvp("ty", ["ty", "check", "."])

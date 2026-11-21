"""Shared error types. `code` is a stable machine-readable string the frontend can branch on."""


class ReelixError(Exception):
    def __init__(self, code: str, message: str, retryable: bool = False):
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable


class ProviderError(ReelixError):
    """The AI provider (Gemini) failed or refused."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class ApiError(Exception):
    """Business error returned to the client as {message, code}; `code` doubles as an i18n key in the frontend."""

    def __init__(self, status_code: int, code: str, message: str | None = None):
        super().__init__(message or code)
        self.status_code = status_code
        self.code = code
        self.message = message or code


def not_found(code: str = "not_found") -> ApiError:
    """Shorthand for a 404 ApiError."""
    return ApiError(404, code, "Not found")


def forbidden(code: str = "forbidden") -> ApiError:
    """Shorthand for a 403 ApiError."""
    return ApiError(403, code, "Forbidden")


def register_error_handlers(app: FastAPI) -> None:
    """Installs the ApiError -> JSON handler on the app."""

    @app.exception_handler(ApiError)
    async def handle_api_error(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"message": exc.message, "code": exc.code})

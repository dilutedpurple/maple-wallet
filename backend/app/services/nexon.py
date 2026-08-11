from typing import Any

import httpx

from app.core.config import get_settings


NEXON_API_BASE_URL = "https://open.api.nexon.com"
REQUEST_TIMEOUT_SECONDS = 10.0


class NexonServiceError(Exception):
    """A safe, user-facing error raised while communicating with Nexon."""

    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class NexonConfigurationError(NexonServiceError):
    def __init__(self) -> None:
        super().__init__("Nexon Open API 키가 설정되지 않았습니다.", 503)


class CharacterNotFoundError(NexonServiceError):
    def __init__(self) -> None:
        super().__init__("캐릭터를 찾을 수 없습니다.", 404)


def _api_key() -> str:
    api_key = get_settings().nexon_api_key.strip()
    if not api_key:
        raise NexonConfigurationError
    return api_key


def _error_code(response: httpx.Response) -> str | None:
    try:
        payload = response.json()
    except ValueError:
        return None
    if not isinstance(payload, dict):
        return None
    error = payload.get("error")
    if not isinstance(error, dict):
        return None
    name = error.get("name")
    return name if isinstance(name, str) else None


async def _request(
    path: str,
    params: dict[str, str],
    *,
    not_found_on_bad_request: bool = False,
) -> dict[str, Any]:
    headers = {"x-nxopen-api-key": _api_key()}

    try:
        async with httpx.AsyncClient(
            base_url=NEXON_API_BASE_URL,
            timeout=REQUEST_TIMEOUT_SECONDS,
        ) as client:
            response = await client.get(path, params=params, headers=headers)
    except httpx.TimeoutException as exc:
        raise NexonServiceError("Nexon Open API 요청 시간이 초과되었습니다.", 504) from exc
    except httpx.RequestError as exc:
        raise NexonServiceError("Nexon Open API에 연결할 수 없습니다.", 502) from exc

    error_code = _error_code(response) if response.is_error else None

    if response.status_code in {401, 403} or error_code == "OPENAPI00005":
        raise NexonServiceError("Nexon Open API 인증에 실패했습니다.", 502)
    if response.status_code == 429 or error_code == "OPENAPI00007":
        raise NexonServiceError("Nexon Open API 요청 한도를 초과했습니다.", 503)
    if response.status_code == 404 or (
        not_found_on_bad_request and error_code == "OPENAPI00003"
    ):
        raise CharacterNotFoundError
    if error_code in {"OPENAPI00009", "OPENAPI00010", "OPENAPI00011"}:
        raise NexonServiceError("Nexon Open API 서비스를 현재 이용할 수 없습니다.", 503)
    if response.is_error:
        raise NexonServiceError("Nexon Open API 호출에 실패했습니다.", 502)

    try:
        data = response.json()
    except ValueError as exc:
        raise NexonServiceError("Nexon Open API 응답 형식이 올바르지 않습니다.", 502) from exc

    if not isinstance(data, dict):
        raise NexonServiceError("Nexon Open API 응답 형식이 올바르지 않습니다.", 502)
    return data


async def get_ocid(character_name: str) -> str:
    data = await _request(
        "/maplestory/v1/id",
        {"character_name": character_name},
        not_found_on_bad_request=True,
    )
    ocid = data.get("ocid")
    if not isinstance(ocid, str) or not ocid.strip():
        raise CharacterNotFoundError
    return ocid


async def get_character_basic(ocid: str) -> dict[str, Any]:
    data = await _request(
        "/maplestory/v1/character/basic",
        {"ocid": ocid},
    )
    character_name = data.get("character_name")
    if not isinstance(character_name, str) or not character_name.strip():
        raise NexonServiceError("Nexon Open API 기본정보 응답이 올바르지 않습니다.", 502)
    return data

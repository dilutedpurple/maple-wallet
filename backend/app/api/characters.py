from typing import Any

from fastapi import APIRouter, HTTPException

from app.schemas.character import CharacterBasicResponse
from app.services.nexon import NexonServiceError, get_character_basic, get_ocid


router = APIRouter(prefix="/api/characters", tags=["characters"])


def _optional_int(value: Any) -> int | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _optional_str(value: Any) -> str | None:
    return value if isinstance(value, str) else None


@router.get("/{character_name}", response_model=CharacterBasicResponse)
async def character_basic(character_name: str) -> CharacterBasicResponse:
    normalized_name = character_name.strip()
    if not normalized_name:
        raise HTTPException(status_code=422, detail="캐릭터명을 입력해 주세요.")

    try:
        ocid = await get_ocid(normalized_name)
        basic = await get_character_basic(ocid)
    except NexonServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    return CharacterBasicResponse(
        ocid=ocid,
        character_name=basic["character_name"],
        world_name=_optional_str(basic.get("world_name")),
        character_class=_optional_str(basic.get("character_class")),
        character_level=_optional_int(basic.get("character_level")),
        character_exp=_optional_int(basic.get("character_exp")),
        character_exp_rate=_optional_str(basic.get("character_exp_rate")),
        character_guild_name=_optional_str(basic.get("character_guild_name")),
        character_image=_optional_str(basic.get("character_image")),
    )

from pydantic import BaseModel


class CharacterBasicResponse(BaseModel):
    ocid: str
    character_name: str
    world_name: str | None = None
    character_class: str | None = None
    character_level: int | None = None
    character_exp: int | None = None
    character_exp_rate: str | None = None
    character_guild_name: str | None = None
    character_image: str | None = None

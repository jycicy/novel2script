from pydantic import BaseModel, Field, field_validator
from enum import Enum
from typing import Optional, Union
from datetime import datetime


class Genre(str, Enum):
    drama = "drama"
    comedy = "comedy"
    thriller = "thriller"
    romance = "romance"
    horror = "horror"
    action = "action"
    scifi = "scifi"
    fantasy = "fantasy"
    literary = "literary"
    other = "other"


class CharacterRole(str, Enum):
    protagonist = "protagonist"
    antagonist = "antagonist"
    supporting = "supporting"
    minor = "minor"
    narrator = "narrator"


class ContentType(str, Enum):
    action = "action"
    dialogue = "dialogue"
    parenthetical = "parenthetical"
    transition = "transition"
    scene_heading = "scene_heading"


class Meta(BaseModel):
    title: str
    source_chapter: str
    genre: Genre
    estimated_duration: str
    author: Optional[str] = None
    version: str = "1.0"
    created_at: Optional[datetime] = None


class Character(BaseModel):
    id: str = Field(pattern=r"^[a-z_][a-z0-9_]*$")
    name: str
    aliases: list[str] = []
    role: CharacterRole
    description: Optional[str] = None
    appearance: Optional[str] = None
    voice_notes: Optional[str] = None

    @field_validator("aliases", mode="before")
    @classmethod
    def coerce_aliases(cls, v):
        if isinstance(v, str):
            return [a.strip() for a in v.split(",") if a.strip()]
        if v is None:
            return []
        return v


class ContentBlock(BaseModel):
    type: ContentType
    text: Optional[str] = None
    character: Optional[str] = None
    dialogue: Optional[str] = None
    parenthetical: Optional[str] = None
    transition: Optional[str] = None


class Scene(BaseModel):
    scene_number: int = Field(ge=1)
    heading: str
    location: str
    time: str
    atmosphere: Optional[str] = None
    content: list[ContentBlock]


class Screenplay(BaseModel):
    meta: Meta
    characters: list[Character]
    scenes: list[Scene]

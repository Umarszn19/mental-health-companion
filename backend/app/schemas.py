from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    recent_user_messages: list[str] = Field(default_factory=list, max_length=8)


class AnalyzeResponse(BaseModel):
    reply: str
    emotion: str
    confidence: float
    source: str

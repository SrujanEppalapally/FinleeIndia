from pydantic import BaseModel
from typing import List


class AssetPayload(BaseModel):
    name: str
    value: float
    category: str
    type: str


class NetWorthItemOut(BaseModel):
    id: str
    name: str
    value: float
    category: str
    type: str

    model_config = {"from_attributes": True}


class NetWorthSnapshot(BaseModel):
    items: List[NetWorthItemOut]
    totalAssets: float
    totalLiabilities: float
    netWorth: float
    asOf: str

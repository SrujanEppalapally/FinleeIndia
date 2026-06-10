from pydantic import BaseModel


class UpdateBudgetRequest(BaseModel):
    limit: float
    month: str


class BudgetCategoryOut(BaseModel):
    id: str
    name: str
    spent: float
    limit: float
    month: str

    model_config = {"from_attributes": True}

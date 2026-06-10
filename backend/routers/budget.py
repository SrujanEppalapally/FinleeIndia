from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Transaction, BudgetCategory
from schemas import BudgetCategoryOut, UpdateBudgetRequest
from routers.deps import current_user

router = APIRouter(prefix="/budget", tags=["budget"])

DEFAULT_CATEGORIES = [
    "Housing", "Food & Dining", "Transport", "Shopping",
    "Health", "Entertainment", "Education", "Personal Care",
    "Utilities", "Insurance", "Investments", "Others",
]


def _ensure_month_categories(db: Session, user_id, month: str) -> None:
    existing = db.query(BudgetCategory).filter(
        BudgetCategory.user_id == user_id,
        BudgetCategory.month == month,
    ).all()
    existing_names = {c.name for c in existing}
    for name in DEFAULT_CATEGORIES:
        if name not in existing_names:
            db.add(BudgetCategory(user_id=user_id, name=name, month=month, limit_amount=0))
    db.commit()


def _compute_spent(db: Session, user_id, category_name: str, month: str) -> float:
    rows = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.category == category_name,
        Transaction.type == "expense",
        Transaction.date.cast("text").like(f"{month}%"),
    ).all()
    return sum(float(r.amount) for r in rows)


@router.get("", response_model=List[BudgetCategoryOut])
def get_budget(
    month: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    _ensure_month_categories(db, user.id, month)
    categories = db.query(BudgetCategory).filter(
        BudgetCategory.user_id == user.id,
        BudgetCategory.month == month,
    ).all()
    result = []
    for c in categories:
        spent = _compute_spent(db, user.id, c.name, month)
        result.append(BudgetCategoryOut(
            id=str(c.id),
            name=c.name,
            spent=round(spent, 2),
            limit=float(c.limit_amount),
            month=c.month,
        ))
    return result


@router.put("/{cat_id}", response_model=BudgetCategoryOut)
def update_budget(
    cat_id: str,
    body: UpdateBudgetRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    cat = db.query(BudgetCategory).filter(
        BudgetCategory.id == cat_id,
        BudgetCategory.user_id == user.id,
    ).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget category not found")
    cat.limit_amount = body.limit
    cat.month = body.month
    db.commit()
    db.refresh(cat)
    spent = _compute_spent(db, user.id, cat.name, cat.month)
    return BudgetCategoryOut(
        id=str(cat.id),
        name=cat.name,
        spent=round(spent, 2),
        limit=float(cat.limit_amount),
        month=cat.month,
    )

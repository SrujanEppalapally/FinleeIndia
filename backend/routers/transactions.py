from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import User, Transaction
from schemas import TransactionOut, CreateTransactionRequest, UpdateTransactionRequest
from routers.deps import current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _to_out(t: Transaction) -> TransactionOut:
    return TransactionOut(
        id=str(t.id),
        merchant=t.merchant,
        category=t.category,
        amount=float(t.amount),
        type=t.type,
        date=str(t.date),
        account=t.account,
        note=t.note,
    )


@router.get("", response_model=List[TransactionOut])
def get_transactions(
    month: Optional[str] = None,
    category: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    q = db.query(Transaction).filter(Transaction.user_id == user.id)
    if month:
        # month format: YYYY-MM
        q = q.filter(Transaction.date.cast("text").like(f"{month}%"))
    if category:
        q = q.filter(Transaction.category == category)
    if type and type != "all":
        q = q.filter(Transaction.type == type)
    if search:
        q = q.filter(Transaction.merchant.ilike(f"%{search}%"))
    rows = q.order_by(Transaction.date.desc()).all()
    return [_to_out(r) for r in rows]


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    body: CreateTransactionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    txn = Transaction(
        user_id=user.id,
        merchant=body.merchant,
        category=body.category,
        amount=body.amount,
        type=body.type,
        date=body.date,
        account=body.account,
        note=body.note,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return _to_out(txn)


@router.put("/{txn_id}", response_model=TransactionOut)
def update_transaction(
    txn_id: str,
    body: UpdateTransactionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id, Transaction.user_id == user.id).first()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(txn, field, val)
    db.commit()
    db.refresh(txn)
    return _to_out(txn)


@router.delete("/{txn_id}", status_code=204)
def delete_transaction(
    txn_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id, Transaction.user_id == user.id).first()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    db.delete(txn)
    db.commit()

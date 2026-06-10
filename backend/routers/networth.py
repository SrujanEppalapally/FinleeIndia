from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, NetWorthItem
from schemas import NetWorthItemOut, NetWorthSnapshot, AssetPayload
from routers.deps import current_user

router = APIRouter(prefix="/networth", tags=["networth"])


def _to_item_out(item: NetWorthItem) -> NetWorthItemOut:
    return NetWorthItemOut(
        id=str(item.id),
        name=item.name,
        value=float(item.value),
        category=item.category,
        type=item.type,
    )


@router.get("", response_model=NetWorthSnapshot)
def get_snapshot(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    items = db.query(NetWorthItem).filter(NetWorthItem.user_id == user.id).all()
    assets = sum(float(i.value) for i in items if i.type == "asset")
    liabilities = sum(float(i.value) for i in items if i.type == "liability")
    return NetWorthSnapshot(
        items=[_to_item_out(i) for i in items],
        totalAssets=round(assets, 2),
        totalLiabilities=round(liabilities, 2),
        netWorth=round(assets - liabilities, 2),
        asOf=str(date.today()),
    )


@router.post("/items", response_model=NetWorthItemOut, status_code=201)
def add_item(
    body: AssetPayload,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    item = NetWorthItem(
        user_id=user.id,
        name=body.name,
        value=body.value,
        category=body.category,
        type=body.type,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _to_item_out(item)


@router.put("/items/{item_id}", response_model=NetWorthItemOut)
def update_item(
    item_id: str,
    body: AssetPayload,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    item = db.query(NetWorthItem).filter(
        NetWorthItem.id == item_id,
        NetWorthItem.user_id == user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    item.name = body.name
    item.value = body.value
    item.category = body.category
    item.type = body.type
    db.commit()
    db.refresh(item)
    return _to_item_out(item)


@router.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    item = db.query(NetWorthItem).filter(
        NetWorthItem.id == item_id,
        NetWorthItem.user_id == user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    db.delete(item)
    db.commit()

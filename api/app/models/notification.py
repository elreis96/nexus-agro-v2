"""
Pydantic models for Notifications
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class NotificationBase(BaseModel):
    """Base notification model"""
    title: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)


class NotificationCreate(NotificationBase):
    """Model for creating a notification"""
    user_id: Optional[str] = None  # None = broadcast to all users


class Notification(NotificationBase):
    """Complete notification model"""
    id: int
    user_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationList(BaseModel):
    """List of notifications response"""
    notifications: list[Notification]
    total: int


class NotificationDeleteResponse(BaseModel):
    """Response for delete operation"""
    success: bool
    message: str

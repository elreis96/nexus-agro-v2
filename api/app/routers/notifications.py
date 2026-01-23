"""
Notifications Router
Endpoints for managing user notifications
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.models.notification import (
    Notification,
    NotificationList,
    NotificationDeleteResponse
)
from app.services.notification_service import NotificationService
from app.database import get_supabase
from app.auth import get_current_user, AuthUser
from app.rate_limit import rate_limit_by_ip, rate_limit_by_user
from supabase import Client
from typing import List


router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[Notification])
async def get_notifications(
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
    limit: int = 50,
    supabase: Client = Depends(get_supabase)
):
    """
    Get notifications for authenticated user
    
    Returns both user-specific and broadcast notifications
    
    **Authentication Required**
    
    **Rate Limit:** 60 requests/minute per user
    """
    # Rate limiting
    await rate_limit_by_ip(request)
    await rate_limit_by_user(current_user.user_id)
    
    # Get notifications
    service = NotificationService(supabase)
    notifications = await service.get_user_notifications(
        user_id=current_user.user_id,
        limit=min(limit, 100)  # Cap at 100
    )
    
    return notifications


@router.delete("/{notification_id}", response_model=NotificationDeleteResponse)
async def delete_notification(
    notification_id: int,
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Delete a notification
    
    User can only delete their own notifications or broadcast notifications
    
    **Authentication Required**
    
    **Rate Limit:** 60 requests/minute per user
    """
    # Rate limiting
    await rate_limit_by_ip(request)
    await rate_limit_by_user(current_user.user_id)
    
    # Delete notification
    service = NotificationService(supabase)
    success = await service.delete_notification(
        notification_id=notification_id,
        user_id=current_user.user_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied"
        )
    
    return NotificationDeleteResponse(
        success=True,
        message="Notification deleted successfully"
    )


# TODO: Add POST endpoint for creating notifications (admin only)
# TODO: Add PATCH endpoint for marking notifications as read
# TODO: Add WebSocket endpoint for real-time notifications

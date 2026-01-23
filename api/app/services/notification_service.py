"""
Notification Service - Business logic for notifications
"""

from supabase import Client
from app.models.notification import Notification
from typing import List, Optional


class NotificationService:
    """Service for notification operations"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        limit: int = 50
    ) -> List[Notification]:
        """
        Get notifications for a specific user
        Includes both user-specific and broadcast (null user_id) notifications
        """
        response = (self.supabase.from('notifications')
            .select('*')
            .or_(f'user_id.eq.{user_id},user_id.is.null')
            .order('created_at', desc=True)
            .limit(limit)
            .execute())
        
        if response.data is None:
            return []
        
        return [Notification(**item) for item in response.data]
    
    async def delete_notification(
        self, 
        notification_id: int, 
        user_id: str
    ) -> bool:
        """
        Delete a notification
        Only allows deletion if notification belongs to user
        """
        # First check if notification exists and belongs to user
        check_response = (self.supabase.from('notifications')
            .select('id, user_id')
            .eq('id', notification_id)
            .execute())
        
        if not check_response.data:
            return False
        
        notification = check_response.data[0]
        
        # Allow deletion if:
        # 1. Notification belongs to user
        # 2. Notification is broadcast (user_id is null) - anyone can dismiss
        if notification['user_id'] not in [user_id, None]:
            return False
        
        # Delete notification
        delete_response = (self.supabase.from('notifications')
            .delete()
            .eq('id', notification_id)
            .execute())
        
        return True
    
    async def create_notification(
        self,
        title: str,
        body: str,
        user_id: Optional[str] = None
    ) -> Notification:
        """
        Create a new notification
        If user_id is None, it's a broadcast notification
        """
        data = {
            'title': title,
            'body': body,
            'user_id': user_id
        }
        
        response = (self.supabase.from('notifications')
            .insert(data)
            .execute())
        
        if not response.data:
            raise ValueError("Failed to create notification")
        
        return Notification(**response.data[0])

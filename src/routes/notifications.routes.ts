import { Router, Request, Response } from 'express';
import { SupabaseService, ScheduledMessage } from '../services/supabase.service';
import { NotificationScheduler } from '../services/scheduler.service';

export class NotificationsRouter {
  private router: Router;
  private supabaseService: SupabaseService;
  private scheduler: NotificationScheduler;

  constructor(supabaseService: SupabaseService, scheduler: NotificationScheduler) {
    this.router = Router();
    this.supabaseService = supabaseService;
    this.scheduler = scheduler;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET /notifications - Get all notifications
    this.router.get('/', this.getAllNotifications.bind(this));
    
    // GET /notifications/:id - Get notification by ID
    this.router.get('/:id', this.getNotificationById.bind(this));
    
    // POST /notifications - Create new notification
    this.router.post('/', this.createNotification.bind(this));
    
    // PUT /notifications/:id - Update notification
    this.router.put('/:id', this.updateNotification.bind(this));
    
    // DELETE /notifications/:id - Delete notification
    this.router.delete('/:id', this.deleteNotification.bind(this));
    
    // POST /notifications/:id/toggle - Toggle active status
    this.router.post('/:id/toggle', this.toggleNotification.bind(this));
  }

  private async getAllNotifications(req: Request, res: Response): Promise<void> {
    try {
      const notifications = await this.supabaseService.getAllScheduledMessages();
      res.json({
        success: true,
        data: notifications,
        count: notifications.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async getNotificationById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }

      const notification = await this.supabaseService.getScheduledMessageById(id);
      if (!notification) {
        res.status(404).json({ success: false, error: 'Notification not found' });
        return;
      }

      res.json({ success: true, data: notification });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const { message, day_of_week, time, is_active } = req.body;

      // Validation
      if (!message || day_of_week === undefined || !time) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: message, day_of_week, time'
        });
        return;
      }

      if (day_of_week < 0 || day_of_week > 6) {
        res.status(400).json({
          success: false,
          error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)'
        });
        return;
      }

      const newNotification = await this.supabaseService.createScheduledMessage({
        message,
        day_of_week,
        time,
        is_active: is_active ?? true
        // Removed user_id
      });

      // Refresh scheduler to include new notification
      await this.scheduler.refreshScheduler();

      res.status(201).json({
        success: true,
        data: newNotification,
        message: 'Notification created and scheduled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async updateNotification(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }

      const updates = req.body;
      
      // Validate day_of_week if provided
      if (updates.day_of_week !== undefined && (updates.day_of_week < 0 || updates.day_of_week > 6)) {
        res.status(400).json({
          success: false,
          error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)'
        });
        return;
      }

      const updatedNotification = await this.supabaseService.updateScheduledMessage(id, updates);
      
      // Refresh scheduler to update timing
      await this.scheduler.refreshScheduler();

      res.json({
        success: true,
        data: updatedNotification,
        message: 'Notification updated and rescheduled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }

      await this.supabaseService.deleteScheduledMessage(id);
      
      // Refresh scheduler to remove deleted notification
      await this.scheduler.refreshScheduler();

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async toggleNotification(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }

      const notification = await this.supabaseService.getScheduledMessageById(id);
      if (!notification) {
        res.status(404).json({ success: false, error: 'Notification not found' });
        return;
      }

      const updatedNotification = await this.supabaseService.updateScheduledMessage(id, {
        is_active: !notification.is_active
      });

      // Refresh scheduler
      await this.scheduler.refreshScheduler();

      res.json({
        success: true,
        data: updatedNotification,
        message: `Notification ${updatedNotification.is_active ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

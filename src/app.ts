import express from 'express';
import cors from 'cors';
import { SupabaseService } from './services/supabase.service';
import { SlackService } from './services/slack.service';
import { NotificationScheduler } from './services/scheduler.service';
import { NotificationsRouter } from './routes/notifications.routes';

export class App {
  private app: express.Application;
  private port: number;
  private supabaseService: SupabaseService;
  private slackService: SlackService;
  private scheduler: NotificationScheduler;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    
    // Initialize services
    this.supabaseService = new SupabaseService();
    this.slackService = new SlackService();
    this.scheduler = new NotificationScheduler(this.slackService, this.supabaseService);
    
    this.initializeMiddleware();
    this.initializeRoutes();
  }

  private initializeMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/', (req, res) => {
      res.json({
        message: 'SWAB Server API',
        version: '1.0.0',
        status: 'running',
        scheduledJobs: this.scheduler.getScheduledJobsCount()
      });
    });

    // Notifications CRUD routes
    const notificationsRouter = new NotificationsRouter(this.supabaseService, this.scheduler);
    this.app.use('/api/notifications', notificationsRouter.getRouter());

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        availableRoutes: [
          'GET /',
          'GET /api/notifications',
          'POST /api/notifications',
          'PUT /api/notifications/:id',
          'DELETE /api/notifications/:id',
          'POST /api/notifications/:id/toggle'
        ]
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize scheduler
      await this.scheduler.initializeScheduler();
      
      // Start server
      this.app.listen(this.port, () => {
        console.log(`🚀 SWAB Server running on http://localhost:${this.port}`);
        console.log(`📊 Active scheduled jobs: ${this.scheduler.getScheduledJobsCount()}`);
        console.log(`🔗 API Documentation:`);
        console.log(`   GET    http://localhost:${this.port}/api/notifications`);
        console.log(`   POST   http://localhost:${this.port}/api/notifications`);
        console.log(`   PUT    http://localhost:${this.port}/api/notifications/:id`);
        console.log(`   DELETE http://localhost:${this.port}/api/notifications/:id`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      throw error;
    }
  }

  public getScheduler(): NotificationScheduler {
    return this.scheduler;
  }
}

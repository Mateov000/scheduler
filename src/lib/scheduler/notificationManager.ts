import { Event } from './types';

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  timestamp: Date;
  eventId?: string;
  isDelivered?: boolean;
}

export class NotificationManager {
  private dailyPushCount: number = 0;
  private lastResetDate: string = new Date().toISOString().slice(0, 10);
  private deliveredNotifications: AppNotification[] = [];

  private resetIfNewDay() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.lastResetDate !== today) {
      this.dailyPushCount = 0;
      this.lastResetDate = today;
    }
  }

  /**
   * Checks whether quiet hours (23:00 to 08:00) are currently active.
   */
  isQuietHours(date: Date = new Date()): boolean {
    const hour = date.getHours();
    return hour >= 23 || hour < 8;
  }

  /**
   * Dispatches a notification obeying throttling rules and privacy masking (§26).
   */
  dispatchNotification(
    title: string,
    body: string,
    priority: NotificationPriority,
    event?: Event,
    targetDate: Date = new Date()
  ): { sent: boolean; reason?: string; notification: AppNotification } {
    this.resetIfNewDay();

    // Mask sensitive event details on lock screens
    let safeTitle = title;
    let safeBody = body;

    if (event?.is_sensitive) {
      const timeStr = new Date(event.start).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      safeTitle = `${event.emoji || '🔒'} ${timeStr}`;
      safeBody = 'Recordatorio programado';
    }

    const notification: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: safeTitle,
      body: safeBody,
      priority,
      timestamp: targetDate,
    };

    // Rule 1: Critical priority (GHC-01 cannabis buffer expiration) bypasses quiet hours and throttling
    if (priority === 'critical') {
      notification.isDelivered = true;
      this.deliveredNotifications.push(notification);
      return { sent: true, notification };
    }

    // Rule 2: Quiet hours suppression (23:00 to 08:00)
    if (this.isQuietHours(targetDate)) {
      return { sent: false, reason: 'Modo silencio nocturno activo (23:00 – 08:00)', notification };
    }

    // Rule 3: Throttling (maximum 3 push per day for high/medium)
    if (priority === 'high' || priority === 'medium') {
      if (this.dailyPushCount >= 3) {
        return { sent: false, reason: 'Límite de throttling alcanzado (máx 3 push diarias)', notification };
      }
      this.dailyPushCount++;
    }

    notification.isDelivered = true;
    this.deliveredNotifications.push(notification);
    return { sent: true, notification };
  }

  getDeliveredNotifications(): AppNotification[] {
    return [...this.deliveredNotifications];
  }
}

export const notificationManager = new NotificationManager();

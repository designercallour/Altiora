/**
 * Notification architecture — extensible by design; delivery is a later phase.
 *
 * A notification is a typed event about the internship program. Channels
 * (in-app, email, …) subscribe to the dispatcher. Adding a NEW notification
 * type means adding one variant to `NotificationType` + its payload — the
 * dispatch plumbing and channels never change. See
 * docs/adr/0008-notification-architecture.md.
 */

export type NotificationType =
  | "internship_starting_tomorrow"
  | "internship_ending_soon"
  | "intern_assigned"
  | "mentor_reassigned"
  | "reflection_overdue";

/** Strongly-typed payload per notification type. */
export interface NotificationPayloads {
  internship_starting_tomorrow: { internshipId: string; startDate: string };
  internship_ending_soon: {
    internshipId: string;
    endDate: string;
    daysRemaining: number;
  };
  intern_assigned: { internshipId: string; internId: string; mentorId: string };
  mentor_reassigned: {
    internshipId: string;
    internId: string;
    fromMentorId: string | null;
    toMentorId: string;
  };
  reflection_overdue: {
    internshipId: string;
    year: number;
    weekNumber: number;
  };
}

export interface NotificationEvent<
  T extends NotificationType = NotificationType,
> {
  type: T;
  recipientUserId: string;
  payload: NotificationPayloads[T];
  createdAt: string;
}

/** A delivery channel. Implement `send` for in-app, email, Slack, etc. */
export interface NotificationChannel {
  readonly name: string;
  send(event: NotificationEvent): Promise<void>;
}

/** Placeholder channel — swallows events. Real channels arrive later. */
export class NoopChannel implements NotificationChannel {
  readonly name = "noop";
  async send(): Promise<void> {
    /* intentionally does nothing until channels are implemented */
  }
}

class NotificationDispatcher {
  private channels: NotificationChannel[] = [];

  register(channel: NotificationChannel): this {
    this.channels.push(channel);
    return this;
  }

  /** Fan out to every channel; one failing channel never blocks the others. */
  async dispatch<T extends NotificationType>(
    event: NotificationEvent<T>,
  ): Promise<void> {
    await Promise.allSettled(this.channels.map((c) => c.send(event)));
  }
}

/** App-wide dispatcher. Register real channels here as they land. */
export const notifications = new NotificationDispatcher().register(
  new NoopChannel(),
);

/** Type-safe event constructor. */
export function buildNotification<T extends NotificationType>(
  type: T,
  recipientUserId: string,
  payload: NotificationPayloads[T],
  now: Date = new Date(),
): NotificationEvent<T> {
  return { type, recipientUserId, payload, createdAt: now.toISOString() };
}

# ADR-0008 — Event + channel notification architecture (delivery deferred)

**Status:** Accepted

## Problem

The program will need notifications — "internship ends in 7 days", "new intern
assigned", "reflection overdue", etc. We don't need delivery yet, but we do need
the shape now so that adding a notification later is a one-line change, not a
refactor. The risk is baking in a design (e.g. hard-coded email calls sprinkled
through actions) that fights us when real channels arrive.

## Decision

A small **typed event + pluggable channel** system in `lib/notifications.ts`:

- `NotificationType` is a string-union; `NotificationPayloads` maps each type to
  a strongly-typed payload. Adding a notification = add one union member + its
  payload entry. TypeScript then forces every producer/consumer to handle it.
- `NotificationChannel` is an interface (`name`, `send(event)`). Channels are
  registered on a single `NotificationDispatcher`, which fans out with
  `Promise.allSettled` (one channel failing never blocks the others).
- Today only a `NoopChannel` is registered — the plumbing is live, delivery is a
  no-op. In-app, email, and Slack channels slot in later with **zero** changes
  to call sites.
- `buildNotification(type, recipient, payload)` is the type-safe constructor.

## Alternatives considered

1. **Direct calls (e.g. `sendEmail(...)`) inside domain actions.** Rejected:
   couples business logic to delivery, impossible to add a second channel or an
   in-app inbox without touching every call site.
2. **A full queue/outbox table now.** Rejected as premature — no delivery exists
   yet. The dispatcher interface is forward-compatible with an outbox: a
   `PersistentChannel` can enqueue to a table when we need durability/retries.
3. **Third-party service (Knock, Novu) up front.** Rejected for now: adds a
   vendor + cost before we've shipped a single notification. The channel
   interface means we can wrap one later behind a `KnockChannel`.

## Trade-offs

- **Pro:** future notifications are additive and type-checked; producers emit
  domain events without knowing how they're delivered.
- **Con:** the current system does nothing observable — it's scaffolding. That's
  intentional and documented so it isn't mistaken for a working feature.
- **Next step:** an `InAppChannel` backed by a `notifications` table + an inbox
  UI, then an `EmailChannel`. Both are drop-ins.

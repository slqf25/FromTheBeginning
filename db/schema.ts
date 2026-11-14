import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  sessionToken: text("session_token").notNull(),
  remindersEnabled: boolean("reminders_enabled").notNull().default(true),
  giftCollectedAt: timestamp("gift_collected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("participants_email_unique").on(table.email), uniqueIndex("participants_session_unique").on(table.sessionToken)]);

export const checkins = pgTable("checkins", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  participantId: uuid("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  week: integer("week").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("checkins_participant_week_unique").on(table.participantId, table.week)]);

export const reminderLogs = pgTable("reminder_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  participantId: uuid("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  week: integer("week").notNull(),
  status: text("status").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("reminders_participant_week_unique").on(table.participantId, table.week)]);

export const admins = pgTable("admins", {
  email: text("email").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

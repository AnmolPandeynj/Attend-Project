import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for both faculty and students
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  phoneNumber: text("phone_number").unique(),
  role: text("role", { enum: ["faculty", "student"] }).notNull(),
  name: text("name").notNull(),
  semester: integer("semester"), // Only for students
  branch: text("branch"), // Only for students
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sessions table for attendance sessions
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facultyId: text("faculty_id").notNull(),
  semester: integer("semester").notNull(),
  branch: text("branch").notNull(),
  subject: text("subject").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  geofencingEnabled: boolean("geofencing_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

// QR Tokens table for dynamic token management
export const qrTokens = pgTable("qr_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Attendance records table
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  studentId: text("student_id").notNull(),
  status: text("status", { enum: ["present", "absent", "manual"] }).notNull(),
  geofencingStatus: text("geofencing_status", { enum: ["inside", "outside", "unknown"] }).default("unknown").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  markedBy: text("marked_by"), // Faculty ID for manual entries
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  endedAt: true,
});

export const insertQRTokenSchema = createInsertSchema(qrTokens).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type QRToken = typeof qrTokens.$inferSelect;
export type InsertQRToken = z.infer<typeof insertQRTokenSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

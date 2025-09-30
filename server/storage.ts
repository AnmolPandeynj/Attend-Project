import { type User, type InsertUser, type Session, type InsertSession, type Attendance, type InsertAttendance, type QRToken, type InsertQRToken } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session methods
  getSession(id: string): Promise<Session | undefined>;
  getActiveSessions(facultyId: string): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<void>;
  
  // Attendance methods
  getAttendance(sessionId: string): Promise<Attendance[]>;
  getStudentAttendance(studentId: string): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  
  // QR Token methods
  getValidToken(token: string): Promise<QRToken | undefined>;
  createQRToken(qrToken: InsertQRToken): Promise<QRToken>;
  cleanupExpiredTokens(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  private attendance: Map<string, Attendance>;
  private qrTokens: Map<string, QRToken>;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.attendance = new Map();
    this.qrTokens = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phone,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      role: insertUser.role,
      name: insertUser.name,
      email: insertUser.email ?? null,
      phoneNumber: insertUser.phoneNumber ?? null,
      semester: insertUser.semester ?? null,
      branch: insertUser.branch ?? null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Session methods
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getActiveSessions(facultyId: string): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.facultyId === facultyId && session.isActive
    );
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = { 
      id,
      facultyId: insertSession.facultyId,
      semester: insertSession.semester,
      branch: insertSession.branch,
      subject: insertSession.subject,
      geofencingEnabled: insertSession.geofencingEnabled ?? true,
      isActive: true,
      createdAt: new Date(),
      endedAt: null
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      this.sessions.set(id, { ...session, ...updates });
    }
  }

  // Attendance methods
  async getAttendance(sessionId: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (record) => record.sessionId === sessionId
    );
  }

  async getStudentAttendance(studentId: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (record) => record.studentId === studentId
    );
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = randomUUID();
    const attendance: Attendance = { 
      id,
      sessionId: insertAttendance.sessionId,
      studentId: insertAttendance.studentId,
      status: insertAttendance.status,
      geofencingStatus: insertAttendance.geofencingStatus ?? "unknown",
      latitude: insertAttendance.latitude ?? null,
      longitude: insertAttendance.longitude ?? null,
      markedBy: insertAttendance.markedBy ?? null,
      createdAt: new Date()
    };
    this.attendance.set(id, attendance);
    return attendance;
  }

  // QR Token methods
  async getValidToken(token: string): Promise<QRToken | undefined> {
    const qrToken = Array.from(this.qrTokens.values()).find(
      (t) => t.token === token && t.expiresAt > new Date()
    );
    return qrToken;
  }

  async createQRToken(insertQRToken: InsertQRToken): Promise<QRToken> {
    const id = randomUUID();
    const qrToken: QRToken = { 
      ...insertQRToken, 
      id,
      createdAt: new Date()
    };
    this.qrTokens.set(id, qrToken);
    return qrToken;
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    for (const [id, token] of Array.from(this.qrTokens.entries())) {
      if (token.expiresAt <= now) {
        this.qrTokens.delete(id);
      }
    }
  }
}

export const storage = new MemStorage();

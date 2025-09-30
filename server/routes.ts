import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSessionSchema, insertAttendanceSchema, insertQRTokenSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/email/:email", async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/phone/:phone", async (req, res) => {
    try {
      const user = await storage.getUserByPhone(req.params.phone);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Session routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid session data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create session" });
      }
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (session) {
        res.json(session);
      } else {
        res.status(404).json({ message: "Session not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.get("/api/sessions/faculty/:facultyId", async (req, res) => {
    try {
      const sessions = await storage.getActiveSessions(req.params.facultyId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const updates = req.body;
      await storage.updateSession(req.params.id, updates);
      res.json({ message: "Session updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Attendance routes
  app.post("/api/attendance", async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(attendanceData);
      res.json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to mark attendance" });
      }
    }
  });

  app.get("/api/attendance/session/:sessionId", async (req, res) => {
    try {
      const attendance = await storage.getAttendance(req.params.sessionId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/attendance/student/:studentId", async (req, res) => {
    try {
      const attendance = await storage.getStudentAttendance(req.params.studentId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student attendance" });
    }
  });

  // QR Token routes
  app.post("/api/qr-tokens", async (req, res) => {
    try {
      const tokenData = insertQRTokenSchema.parse(req.body);
      const token = await storage.createQRToken(tokenData);
      res.json(token);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid token data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create QR token" });
      }
    }
  });

  app.get("/api/qr-tokens/:token", async (req, res) => {
    try {
      const qrToken = await storage.getValidToken(req.params.token);
      if (qrToken) {
        res.json(qrToken);
      } else {
        res.status(404).json({ message: "Invalid or expired token" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to validate token" });
    }
  });

  app.delete("/api/qr-tokens/cleanup", async (req, res) => {
    try {
      await storage.cleanupExpiredTokens();
      res.json({ message: "Expired tokens cleaned up successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to cleanup tokens" });
    }
  });

  // QR Code verification endpoint for attendance marking
  app.post("/api/verify-qr", async (req, res) => {
    try {
      const { sessionId, token, studentId, latitude, longitude, geofencingStatus } = req.body;

      // Validate the token
      const qrToken = await storage.getValidToken(token);
      if (!qrToken || qrToken.sessionId !== sessionId) {
        return res.status(400).json({ message: "Invalid or expired QR code" });
      }

      // Check if attendance already marked
      const existingAttendance = await storage.getAttendance(sessionId);
      const alreadyMarked = existingAttendance.find(record => record.studentId === studentId);
      
      if (alreadyMarked) {
        return res.status(400).json({ message: "Attendance already marked for this session" });
      }

      // Mark attendance
      const attendance = await storage.createAttendance({
        sessionId,
        studentId,
        status: "present",
        geofencingStatus: geofencingStatus || "unknown",
        latitude,
        longitude,
        markedBy: null
      });

      res.json({ message: "Attendance marked successfully", attendance });
    } catch (error) {
      console.error("QR verification error:", error);
      res.status(500).json({ message: "Failed to verify QR code and mark attendance" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

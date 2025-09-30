# Smart Attendance System

## Overview

The **Smart Attendance System** is a modern, AI-enabled solution for managing and tracking attendance in educational institutions. It provides **faculty** and **student** interfaces, allowing real-time session management, QR code-based attendance marking, and analytics on student participation. The system leverages **Firebase** for authentication, database management, and real-time updates, while the frontend is built using **React.js**.

### Key Features
- **Faculty Dashboard:** Create and manage attendance sessions, enable geofencing for campus-based attendance, generate dynamic QR codes, and view live statistics of attendance.
- **Student Dashboard:** Scan QR codes to mark attendance, view attendance history, and receive notifications about sessions.
- **Authentication:** Supports email/password and phone OTP-based authentication using Firebase Auth.
- **Real-Time Updates:** Attendance data updates instantly across faculty and student devices using Firestore subscriptions.
- **Analytics & Reporting:** Live statistics and attendance percentages are displayed with visual charts for easy analysis.
- **Geofencing:** Optional geofencing feature ensures students can only mark attendance within campus boundaries.

### Tech Stack
- **Frontend:** React.js, React Native, Vite, Tailwind CSS, Expo
- **Backend / Serverless:** Firebase Authentication, Firestore, Cloud Functions, Hosting
- **Security & Authentication:** OTP-based login, Email/Password login, reCAPTCHA
- **Database & Storage:** Firestore NoSQL, Firebase Storage

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/smart-attendance-system.git
   cd smart-attendance-system

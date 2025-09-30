# Overview

This is a Smart QR + Geofenced Attendance Management System designed as a web and mobile-friendly application. The system provides separate interfaces for faculty and students, allowing faculty to create attendance sessions with QR codes that refresh every 2 seconds, while students can scan these codes to mark their attendance. The application includes geofencing capabilities to verify student location within campus boundaries and provides comprehensive analytics and reporting features.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript, implementing a modern single-page application (SPA) architecture:

- **Component Framework**: React 18 with TypeScript for type safety
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: TailwindCSS with CSS variables for consistent theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks with context providers for auth state
- **Data Fetching**: TanStack Query (React Query) for server state management

## Backend Architecture
The backend follows a Node.js/Express REST API pattern:

- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon Database as the provider
- **Session Management**: In-memory storage with interface for easy swapping
- **API Design**: RESTful endpoints with proper error handling and validation

## Authentication & Authorization
The system implements role-based authentication:

- **Faculty Authentication**: Email/password login with session management
- **Student Authentication**: Phone number OTP via Firebase Auth
- **Session Storage**: Local storage for client-side session persistence
- **Role Management**: Context-based role checking (faculty vs student)

## Data Storage
The database schema is designed for attendance tracking:

- **Users Table**: Stores both faculty and student information with role differentiation
- **Sessions Table**: Tracks attendance sessions with geofencing settings
- **QR Tokens Table**: Manages dynamic QR tokens with expiration
- **Attendance Table**: Records attendance with location data

## Real-time Features
- **QR Code Generation**: Dynamic QR codes that refresh every 2 seconds
- **Live Statistics**: Real-time attendance tracking for faculty dashboard
- **Geolocation Tracking**: Browser-based GPS for location verification

## Mobile Optimization
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Camera Integration**: QR code scanning using device camera
- **Touch Interactions**: Optimized for mobile touch interfaces
- **Progressive Features**: Camera permissions and geolocation handling

# External Dependencies

## Core Technologies
- **Vite**: Build tool and development server with HMR support
- **TypeScript**: Type safety across the entire application stack
- **Drizzle Kit**: Database migrations and schema management

## UI/UX Libraries
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Lucide React**: Icon library for consistent iconography
- **TailwindCSS**: Utility-first CSS framework with custom design tokens

## Backend Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Firebase**: Authentication service for OTP-based student login
- **Express Session**: Session management with PostgreSQL store

## Development Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer
- **React Hook Form**: Form state management with validation

## Validation & Utilities
- **Zod**: Schema validation for API endpoints and forms
- **Date-fns**: Date manipulation and formatting utilities
- **QRCode**: QR code generation library for dynamic tokens

## Geolocation & Camera
- **Browser APIs**: Geolocation API for campus boundary verification
- **MediaDevices API**: Camera access for QR code scanning
- **Canvas API**: Image processing for QR code detection

## Analytics & Monitoring
- **Chart Components**: Custom components for attendance visualization
- **Real-time Subscriptions**: Live data updates for faculty dashboard
- **Performance Monitoring**: Vite development tools and error tracking
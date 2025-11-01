# TERRAIN Desk Booking System
This repository is for a web application for managing desk reservations for the TERRAIN library.
## Key features
- Login
    - User Authentication
- User levels
    - Regular members
    - Admin users
- Booking page
    - Members able to select and reserve seat
    - Members able to cancel bookings
- Admin dashboard
    - Admins able to view all bookings past present and cancelled

## Architecture Overview

### System Architecture
The TERRAIN Desk Booking System is a modern web application built with a microservices architecture using containerized services.

### Technology Stack

#### Frontend (Web Application)
- **Framework**: React 19.1.1
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS with PostCSS
- **Routing**: React Router DOM 7.6.3
- **Development Server**: Vite dev server (Port 5173, exposed as 8000)
- **Container**: Node.js 20 Alpine

#### Backend (API Server)
- **Runtime**: Node.js 20
- **Framework**: Express.js 5.1.0
- **Port**: 6969
- **Middleware**: CORS enabled for cross-origin requests
- **Logging**: Pino logger
- **Container**: Node.js 20 Alpine

#### Database & Services
- **Database**: Firebase Firestore (NoSQL document database)
- **Authentication**: Firebase Authentication
- **Calendar Integration**: ICS (iCalendar) file generation
- **Development**: Firebase Emulator Suite for local development

#### DevOps & Testing
- **Containerization**: Docker & Docker Compose
- **Testing Framework**: Jest with Testing Library
- **Code Quality**: ESLint
- **Development Environment**: Firebase Emulators

### Service Architecture

#### Microservices Structure
1. **Frontend Service (webapp)**
   - React SPA served by Vite development server
   - Hot module replacement for development
   - Tailwind CSS for responsive design

2. **Backend Service (backend)**
   - RESTful API with Express.js
   - Modular router structure (booking, user routes)
   - Firebase Admin SDK integration
   - Health check endpoint (`/api/health`)

3. **Firebase Emulator Service (Unrequired for production)**
   - Local development environment
   - Firestore emulator (Port 8080)
   - Authentication emulator (Port 9099)
   - Functions emulator (Port 5001)
   - Storage emulator (Port 9199)
   - Emulator UI (Port 4000)

### API Structure
```
/api
├── /health          # Health check endpoint (debug check)
├── /booking/*       # Booking management endpoints
└── /user/*          # User management endpoints
```

### Data Flow
1. User interacts with React frontend
2. Frontend makes HTTP requests to Express.js backend
3. Backend authenticates requests via Firebase Auth
4. Backend performs operations on Firestore
5. Backend returns JSON responses to frontend
6. Frontend updates UI reactively

## System Requirements

### Development Environment

#### Required Software
- **Node.js**: Version 20.x or higher
- **npm**: Version 10.x or higher (comes with Node.js)
- **Docker**: Version 24.x or higher
- **Docker Compose**: Version 2.x or higher
- **Git**: For version control

### Production Environment

#### Software Requirements
- **Node.js**: Version 20.x (LTS)
- **Docker**: Version 24.x or higher
- **Docker Compose**: Version 2.x or higher
- **Reverse Proxy**: Nginx or similar (for production deployment)

### Firebase Requirements

#### Firebase Project Setup
- Active Firebase project with:
  - Firestore Database enabled
  - Authentication enabled
  - Web app configuration

#### Configuration
- Firebase configuration is set directly in `webapp/firebase.js`
- Environment variables are configured in `docker-compose.yaml`
- No `.env` files required for basic setup

**Important for Deployment**
- Update Firebase configuration in `webapp/firebase.js` with your actual project credentials
- Change environment variables in `docker-compose.yaml` (especially `GCP_PROJECT`)
- Consider using `.env` files or secure environment variable management for production deployment

### Network & Ports

#### Ports
- **Frontend**: 8000 (external) -> 5173 (internal)
- **Backend**: 6969
- **Firebase Emulator UI**: 4000
- **Firestore Emulator**: 8080
- **Auth Emulator**: 9099
- **Functions Emulator**: 5001
- **Storage Emulator**: 9199


### .ENV file templates
backend/.env
```
EMAIL_USER=email@ethereal.email
EMAIL_PASSWORD=PASSWORD

# Firebase Configuration

NODE_ENV=development
FIRESTORE_EMULATOR_HOST=firebase-emulators:8080
FIREBASE_AUTH_EMULATOR_HOST=firebase-emulators:9099
```

webapp/.env
```
# Firebase Configuration (Local development with emulators)
VITE_FIREBASE_API_KEY="demo-api-key"
VITE_FIREBASE_AUTH_DOMAIN="example"
VITE_FIREBASE_PROJECT_ID="example"
VITE_FIREBASE_STORAGE_BUCKET="example"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef123456"

# API Configuration
# Example 
# API_BASE_URL="https://example.web.app/api"
API_BASE_URL="http://localhost:6969/api"
VITE_API_BASE_URL="http://localhost:6969/api"
```
terrainproject/.env
```
PROJECT_ID_FIREBASE="" # The project name in your firebase
GCP_PROJECT="" # Required for Firebase emulator, will break the live production so do not include in live

FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

DATABASE_NAME = "(default)" # firebase.js
FIREBASE_PROJECT_ID="example" # firebase.js | The project name in your firebase
```

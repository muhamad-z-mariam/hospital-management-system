# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hospital Management System (HMS) - A full-stack web application for managing hospital operations including patient records, appointments, admissions, payments, and ML-based patient readmission risk predictions.

**Tech Stack:**
- **Backend**: Django 5.2 + Django REST Framework + PostgreSQL
- **Frontend**: React 19 + React Router
- **ML Model**: Scikit-learn (joblib) for patient readmission prediction
- **Infrastructure**: Docker Compose with 4 services (db, django, fastapi, frontend)

## Development Commands

### Docker Environment
```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up django
docker-compose up frontend

# Rebuild after dependency changes
docker-compose up --build

# Stop all services
docker-compose down
```

### Backend (Django)
```bash
cd backend

# Run development server (port 8000)
python manage.py runserver

# Database operations
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Shell access
python manage.py shell

# Run tests
python manage.py test api
```

### Frontend (React)
```bash
cd frontend

# Install dependencies
npm install

# Run development server (port 3000)
npm start

# Build for production
npm build

# Run tests
npm test
```

## Architecture

### Backend Structure

**Django Project: `core/`**
- `settings.py` - Main configuration, custom User model (`AUTH_USER_MODEL = 'api.User'`)
- `urls.py` - Root URL config, routes `/api/` to api app, `/admin/` to Django admin

**Django App: `api/`**
- `models.py` - 10 main models (see Data Models section)
- `views.py` - DRF ViewSets + custom endpoints (login, predict, dashboard stats, payment calculation)
- `serializers.py` - DRF serializers for all models
- `urls.py` - REST API routes using DRF DefaultRouter
- `ml_model.py` - Loads `readmission_model.pkl` and exposes `predict_readmission(patient_data)` function
- `payment_calculator.py` - Business logic for payment calculation with insurance/handicapped discounts
- `readmission_model.pkl` - Pre-trained ML model for predicting patient readmission risk

**API Endpoints:**
- Standard CRUD: `/api/{users,patients,doctors,nurses,appointments,admissions,payments,predictions,procedures,rooms}/`
- Custom endpoints:
  - `POST /api/login/` - Basic authentication (username/password)
  - `POST /api/predict/<patient_id>/` - Run ML prediction and save result
  - `GET /api/dashboard-stats/` - Dashboard statistics
  - `POST /api/create-payment/` - Create payment with auto-calculation

### Frontend Structure

**Entry Points:**
- `src/index.js` - React app bootstrap
- `src/App.js` - Main router with `<AuthProvider>` wrapper

**Key Directories:**
- `src/pages/` - 30+ page components organized by feature
- `src/components/` - Reusable components (ProtectedRoute, RoleBasedDashboard, etc.)
- `src/context/` - React Context (AuthContext for authentication state)
- `src/api/` - API client (`api.js` - currently empty/minimal)

**Routing Architecture:**
- Public: `/login`
- Protected: All other routes wrapped in `<ProtectedRoute>`
- Role-based dashboards: Admin, Doctor, Nurse each have separate dashboard components
- Shared routes: `/dashboard`, `/my-patients`, `/my-appointments`, `/my-admissions`

**Authentication Flow:**
1. User logs in via `Login.js` → calls `/api/login/`
2. `AuthContext` stores user object in localStorage
3. `ProtectedRoute` checks `user` from context, redirects to `/login` if null
4. Role-based components render different UI based on `user.role`

### Data Models

**Core Entities:**
1. **User** (AbstractUser) - Custom user with `role` field (admin/doctor/nurse/staff)
2. **Patient** - Demographics + 30 medical feature fields for ML prediction + insurance/handicapped flags
3. **Doctor** - OneToOne with User + specialty
4. **Nurse** - OneToOne with User + department
5. **Room** - Room management with bed capacity tracking
6. **Admission** - Patient hospital stays with status workflow (pending → admitted → pending_discharge → discharged)
7. **Appointment** - Patient-Doctor appointments
8. **Procedure** - Catalog of surgical/non-surgical procedures with costs
9. **Payment** - Payment records with cost breakdown and discount calculation
10. **PredictionRecord** - History of ML predictions with risk_level (0=low, 1=high)

### ML Prediction System

**Patient Features (30 total):**
Lab values: cholesterol, platelet, creatinine, bilirubin, albumin, etc.
Cardiac markers: high_sensitivity_troponin, brain_natriuretic_peptide, creatine_kinase
Blood counts: eosinophil_count, neutrophil_ratio, lymphocyte_count, red_blood_cell

**Prediction Workflow:**
1. Frontend calls `POST /api/predict/<patient_id>/` with `user_id` in body
2. Backend extracts 30 features from Patient model, fills missing with 0
3. `ml_model.py` calls `model.predict()` on feature DataFrame
4. Result saved to PredictionRecord table
5. Returns risk level (0 or 1) to frontend

### Payment Calculation Logic

**Formula:**
```
Total = Procedure Costs + (Length of Stay × $30/day)
```

**Discount Rules (applied in order):**
1. **Handicapped**:
   - If total < $3000: 100% discount (free)
   - If total ≥ $3000: 90% discount (pay 10%)
2. **Insured** (if not handicapped): 80% discount (pay 20%)
3. **Uninsured** (default): 30% discount (pay 70%)

Implementation: `api/payment_calculator.py::calculate_payment()`

## Important Implementation Details

### Authentication
- **Current State**: Basic authentication with no token/session management
- Login endpoint uses Django's `authenticate()` function
- Frontend stores user object in localStorage (not secure)
- No logout endpoint on backend (frontend just clears localStorage)
- **Security Issue**: API endpoints are NOT protected - no authentication required

### CORS Configuration
- Configured in `backend/core/settings.py`
- Allows origin: `http://localhost:3000`
- Uses `django-cors-headers` middleware

### Database
- PostgreSQL 15 via Docker
- Connection via `dj_database_url` from `DATABASE_URL` environment variable
- Docker compose sets: `postgres://postgres:postgres@db:5432/hospital`

### Admission Status Workflow
```
pending (waiting for doctor)
  → admitted (inpatient, assigned room)
  → pending_discharge (waiting for payment)
  → discharged
```

When admission status changes to 'admitted', room occupancy should be updated via `room.occupy_bed()`.
When discharged, call `room.release_bed()`.

### File Organization Patterns
- Backend: Standard Django app structure
- Frontend: Pages are feature-based (not role-based), role filtering done via props/context
- Serializers use nested relationships (e.g., DoctorSerializer includes full UserSerializer)

## Dependency Management

**Backend:**
- Dependencies tracked in `backend/venv/` (virtualenv)
- No `requirements.txt` file present - should be created if needed
- Key packages: Django 5.2, djangorestframework, django-cors-headers, dj-database-url, python-dotenv, joblib, pandas, numpy, scipy

**Frontend:**
- `package.json` in `frontend/`
- Key packages: react@19.2.0, react-router-dom@7.9.3, react-scripts@5.0.1

## Common Patterns

### Adding a New API Endpoint
1. Add function/ViewSet to `api/views.py`
2. Add route to `api/urls.py`
3. Add CORS origin if needed in `core/settings.py`

### Adding a New Model
1. Define in `api/models.py`
2. Create serializer in `api/serializers.py`
3. Create ViewSet in `api/views.py`
4. Register in router in `api/urls.py`
5. Run `python manage.py makemigrations && python manage.py migrate`
6. Register in `api/admin.py` for Django admin

### Adding a New Frontend Page
1. Create component in `src/pages/`
2. Add route to `src/App.js`
3. Wrap in `<ProtectedRoute>` if authentication required
4. Update navigation components (Sidebar, etc.)

## Known Issues & Technical Debt

1. **Authentication System**: No token-based auth, endpoints unprotected
2. **API Client**: `frontend/src/api/api.js` is empty - API calls scattered across components
3. **Environment Variables**: `.env` file not tracked, needs documentation
4. **Testing**: No test files implemented (test.py files are empty)
5. **Duplicate Code**: `api/urls.py` has router defined twice (lines 10-20 and 22-32)
6. **Missing Dockerfile**: No Dockerfiles in backend/frontend (docker-compose references them)

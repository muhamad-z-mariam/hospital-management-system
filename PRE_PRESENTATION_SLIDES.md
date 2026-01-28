# Hospital Management System (HMS)
## Pre-Presentation Slides Content

---

## Slide 1: Title Slide
**Hospital Management System (HMS)**

A Full-Stack Web Application for Hospital Operations Management

*Your Name/Team*
*Date*

---

## Slide 2: Project Objectives

**Main Goal:**
- Create an efficient hospital management system to improve patient care and streamline hospital operations

**Key Objectives:**
- Digitize patient records and medical history
- Automate appointment and admission workflows
- Implement intelligent payment calculation with insurance/handicap discounts
- Predict patient readmission risk using Machine Learning
- Centralize hospital staff scheduling and shift management
- Provide role-based access for Admins, Doctors, and Nurses

---

## Slide 3: Main Ideas & Features

**Core Modules:**
1. **Patient Management** - Complete patient records with 30+ medical parameters
2. **Appointment System** - Doctor-patient appointment scheduling
3. **Admission Management** - Track patient hospital stays with status workflow
4. **Payment System** - Automated cost calculation with discount rules
5. **ML Prediction** - Readmission risk prediction using patient lab values
6. **Room Management** - Track bed availability and occupancy
7. **Staff Scheduling** - Nurse/doctor shift management with swap requests

**Key Innovation:**
- Integration of ML-based predictive analytics for proactive patient care

---

## Slide 4: Technology Stack

**Frontend:**
- React 19
- React Router for navigation
- Context API for state management

**Backend:**
- Django 5.2 + Django REST Framework
- PostgreSQL 15 database
- JWT Authentication

**Machine Learning:**
- LightGBM model
- Scikit-learn for ML pipeline
- 30 medical features for prediction

**Infrastructure:**
- Docker Compose (4 services)
- Containerized deployment

---

## Slide 5: Completed Features ✓

**Fully Functional:**
- ✓ User authentication & role-based access (Admin, Doctor, Nurse)
- ✓ Complete patient CRUD operations with medical data
- ✓ Appointment booking and management
- ✓ Admission workflow (pending → admitted → discharged)
- ✓ Automated payment calculation with insurance/handicap discounts
- ✓ Room management with bed capacity tracking
- ✓ Staff scheduling system with shift swaps
- ✓ REST API with 10+ endpoints
- ✓ Docker containerization setup

**Database:**
- 10+ interconnected models with proper relationships

---

## Slide 6: Work In Progress

**Currently Being Finalized:**

1. **ML Prediction System** (90% complete)
   - Model integrated and loaded
   - Feature mapping completed
   - Testing prediction accuracy with real data

2. **Frontend UI/UX Organization** (70% complete)
   - Dashboard layouts need refinement
   - Navigation flow optimization
   - Responsive design improvements
   - Role-based UI components

**Target Completion:** Before final presentation

---

## Slide 7: Challenges & Solutions

**Major Challenges Faced:**

1. **System Integration**
   - *Challenge:* Synchronizing frontend (React), backend (Django), database (PostgreSQL), and ML model
   - *Solution:* Docker Compose orchestration + REST API standardization

2. **ML Model Integration**
   - *Challenge:* Feature name/order mismatch between training and production
   - *Solution:* Mapped Django model fields to exact training column names with dots notation

3. **Complex Business Logic**
   - *Challenge:* Payment calculation with multiple discount rules
   - *Solution:* Dedicated calculator module with priority-based discount logic

4. **Authentication & Permissions**
   - *Challenge:* Role-based access control across multiple user types
   - *Solution:* Custom permission classes + JWT token system

---

## Slide 8: Conclusion & Next Steps

**Project Status:**
- Core functionality: **Complete** ✓
- ML integration: **In final testing phase** ⚙️
- UI polish: **In progress** ⚙️

**Impact:**
- Streamlined hospital operations for staff
- Improved patient care through predictive analytics
- Reduced administrative overhead with automation

**Before Final Presentation:**
- Complete ML prediction validation
- Finalize UI/UX organization
- Conduct end-to-end system testing
- Prepare live demo scenarios

**Expected Outcome:**
A production-ready hospital management system that demonstrates real-world application of full-stack development and ML integration.

---

## Thank You!
Questions?

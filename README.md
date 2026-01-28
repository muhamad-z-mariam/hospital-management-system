# Hospital Management System (HMS)

A comprehensive full-stack web application for managing hospital operations including patient records, appointments, admissions, payments, and ML-based patient readmission risk predictions.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![Django](https://img.shields.io/badge/django-5.2-green.svg)
![React](https://img.shields.io/badge/react-19.2.0-blue.svg)

## Features

- **Patient Management**: Comprehensive patient records with 30+ medical feature fields
- **Staff Management**: Role-based access for Admins, Doctors, Nurses, and Staff
- **Appointment Scheduling**: Patient-Doctor appointment booking and management
- **Admission Tracking**: Hospital stay management with room assignment and status workflow
- **Payment Processing**: Automated payment calculation with insurance and handicapped discounts
- **ML Predictions**: Patient readmission risk prediction using scikit-learn
- **Room Management**: Bed capacity tracking and availability
- **Procedure Catalog**: Surgical and non-surgical procedures with cost management

## Tech Stack

### Backend
- **Framework**: Django 5.2
- **API**: Django REST Framework
- **Database**: PostgreSQL 15
- **ML**: Scikit-learn (joblib)
- **Authentication**: Django built-in authentication

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **State Management**: React Context API
- **HTTP Client**: Fetch API

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Services**: 4 containers (PostgreSQL, Django, FastAPI, React)

## Architecture

### Backend Structure
```
backend/
├── core/               # Django project settings
│   ├── settings.py     # Main configuration
│   └── urls.py         # Root URL routing
├── api/                # Main Django app
│   ├── models.py       # 10 core data models
│   ├── views.py        # DRF ViewSets & custom endpoints
│   ├── serializers.py  # DRF serializers
│   ├── urls.py         # API routes
│   ├── ml_model.py     # ML prediction logic
│   ├── payment_calculator.py  # Payment calculation logic
│   └── readmission_model.pkl  # Pre-trained ML model
└── manage.py
```

### Frontend Structure
```
frontend/
├── public/
├── src/
│   ├── pages/          # 30+ page components
│   ├── components/     # Reusable components
│   ├── context/        # React Context (AuthContext)
│   ├── api/            # API client
│   ├── App.js          # Main router
│   └── index.js        # Entry point
└── package.json
```

## Installation & Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 16+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/muhamad-z-mariam/HMS.git
   cd HMS
   ```

2. **Start all services**
   ```bash
   docker-compose up
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Django Admin: http://localhost:8000/admin

### Local Development Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install django djangorestframework django-cors-headers dj-database-url python-dotenv joblib pandas numpy scipy psycopg2-binary
   ```

4. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/hospital
   DEBUG=True
   SECRET_KEY=your-secret-key-here
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server**
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/login/` - User login

### Standard CRUD Endpoints
- `/api/users/` - User management
- `/api/patients/` - Patient records
- `/api/doctors/` - Doctor profiles
- `/api/nurses/` - Nurse profiles
- `/api/appointments/` - Appointment scheduling
- `/api/admissions/` - Hospital admissions
- `/api/payments/` - Payment records
- `/api/procedures/` - Medical procedures
- `/api/rooms/` - Room management
- `/api/predictions/` - ML prediction history

### Custom Endpoints
- `POST /api/predict/<patient_id>/` - Run ML prediction for patient readmission risk
- `GET /api/dashboard-stats/` - Get dashboard statistics
- `POST /api/create-payment/` - Create payment with automatic calculation

## Data Models

### Core Entities

1. **User** - Custom user model with role field (admin/doctor/nurse/staff)
2. **Patient** - Demographics and medical history with 30 feature fields
3. **Doctor** - OneToOne with User, includes specialty
4. **Nurse** - OneToOne with User, includes department
5. **Room** - Room management with bed capacity
6. **Admission** - Patient hospital stays with status workflow
7. **Appointment** - Patient-Doctor appointments
8. **Procedure** - Catalog of procedures with costs
9. **Payment** - Payment records with discount calculation
10. **PredictionRecord** - History of ML predictions

## ML Prediction System

### Patient Features
The system uses 30 medical features for readmission prediction:
- Lab values: cholesterol, platelet, creatinine, bilirubin, albumin
- Cardiac markers: troponin, BNP, creatine kinase
- Blood counts: eosinophil, neutrophil, lymphocyte, RBC

### Prediction Workflow
1. Frontend triggers prediction via `POST /api/predict/<patient_id>/`
2. Backend extracts 30 features from Patient model
3. ML model predicts risk level (0=low, 1=high)
4. Result saved to PredictionRecord table
5. Risk level returned to frontend

## Payment Calculation

### Formula
```
Total = Procedure Costs + (Length of Stay × $30/day)
```

### Discount Rules
1. **Handicapped**:
   - Total < $3000: 100% discount (free)
   - Total ≥ $3000: 90% discount
2. **Insured** (if not handicapped): 80% discount
3. **Uninsured**: 30% discount

## Admission Status Workflow

```
pending → admitted → pending_discharge → discharged
```

- **pending**: Waiting for doctor assignment
- **admitted**: Inpatient with room assignment
- **pending_discharge**: Waiting for payment processing
- **discharged**: Released from hospital

## User Roles

- **Admin**: Full system access, user management
- **Doctor**: Patient management, appointments, admissions
- **Nurse**: Patient care, admission assistance
- **Staff**: Basic operations support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Known Issues

- Authentication system needs token-based implementation
- API endpoints currently lack authentication protection
- Environment variables need better documentation
- Test coverage needs implementation

## Future Enhancements

- [ ] Implement JWT authentication
- [ ] Add API endpoint protection
- [ ] Create comprehensive test suite
- [ ] Add real-time notifications
- [ ] Implement email notifications for appointments
- [ ] Add billing and invoicing module
- [ ] Mobile responsive improvements
- [ ] Generate medical reports (PDF)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authors

- **Muhamad Z. Mariam** - [@muhamad-z-mariam](https://github.com/muhamad-z-mariam)

## Acknowledgments

- Built with Django REST Framework
- React frontend framework
- PostgreSQL database
- Scikit-learn for ML predictions
- Docker for containerization

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Note**: This is an educational project for hospital management system implementation. Not intended for production use without proper security audits and compliance certifications.

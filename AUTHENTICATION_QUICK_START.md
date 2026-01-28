# Authentication Quick Start Guide

## Starting the Application

### 1. Start Backend
```bash
cd backend
python manage.py runserver
```
Backend will run on: `http://localhost:8000`

### 2. Start Frontend
```bash
cd frontend
npm start
```
Frontend will run on: `http://localhost:3000`

## Quick Test Checklist

### ✅ Test User Registration
1. Go to: `http://localhost:3000/register`
2. Fill form:
   - First Name: John
   - Last Name: Doe
   - Username: johndoe
   - Email: john@example.com
   - Role: admin
   - Password: testpass123
   - Confirm Password: testpass123
3. Click "Register"
4. Should redirect to dashboard with user logged in

### ✅ Test Login
1. Go to: `http://localhost:3000/login`
2. Enter credentials:
   - Username: johndoe
   - Password: testpass123
3. Click "Login"
4. Should redirect to dashboard

### ✅ Test Protected Routes
1. Open browser in incognito/private mode
2. Try to access: `http://localhost:3000/dashboard`
3. Should redirect to `/login`
4. Log in → should access dashboard

### ✅ Test Logout
1. While logged in, open browser console
2. Type: `localStorage.clear()` and refresh
3. Should redirect to login page

### ✅ Test Password Change
1. Log in
2. Go to: `http://localhost:3000/change-password`
3. Enter old and new passwords
4. Should update successfully

### ✅ Test API Authentication
1. Open DevTools → Network tab
2. Log in and perform any action (view patients, etc.)
3. Check API requests have header: `Authorization: Bearer <token>`

## API Endpoints Quick Reference

### Authentication
```bash
# Register
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "testpass123",
  "password_confirm": "testpass123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "admin"
}

# Login
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "username": "johndoe",
  "password": "testpass123"
}

# Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin"
  }
}

# Get Current User
GET http://localhost:8000/api/auth/me/
Authorization: Bearer <access_token>

# Refresh Token
POST http://localhost:8000/api/auth/refresh/
Content-Type: application/json

{
  "refresh": "<refresh_token>"
}

# Logout
POST http://localhost:8000/api/auth/logout/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refresh_token": "<refresh_token>"
}

# Change Password
POST http://localhost:8000/api/auth/change-password/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "old_password": "testpass123",
  "new_password": "newpass456",
  "new_password_confirm": "newpass456"
}
```

### Using Protected Endpoints
```bash
# Example: Get all patients
GET http://localhost:8000/api/patients/
Authorization: Bearer <access_token>

# Example: Create patient
POST http://localhost:8000/api/patients/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "age": 30,
  "gender": "female",
  "contact": "555-1234"
}
```

## Frontend Routes

### Public Routes (No Authentication Required)
- `/login` - Login page
- `/register` - Registration page
- `/password-reset` - Request password reset
- `/password-reset-confirm` - Confirm password reset with token

### Protected Routes (Authentication Required)
- `/dashboard` - Main dashboard
- `/change-password` - Change password
- `/patients` - Patient list
- `/doctors` - Doctor list
- `/nurses` - Nurse list
- `/appointments` - Appointments
- `/admissions` - Admissions
- `/payments` - Payments
- All other existing routes...

## Role-Based Access

### Admin
- Full access to everything
- Can manage users, patients, doctors, nurses
- Can view/create payments
- Access to all predictions

### Doctor
- View/edit patients
- View/create appointments
- View/edit admissions
- Run predictions
- Read-only access to doctors/nurses/procedures

### Nurse
- View/edit patients
- View/create admissions
- Run predictions
- Read-only access to doctors/nurses/procedures

### Staff
- Read-only access to most resources
- Limited edit capabilities

## Common Issues & Solutions

### Issue: "Invalid credentials" on login
**Check**:
- Username and password are correct
- User exists in database
- Backend server is running

### Issue: Redirects to login immediately after logging in
**Check**:
- Browser localStorage has `access_token` and `refresh_token`
- Tokens are valid (not expired)
- Backend JWT settings are correct

### Issue: API returns 401 Unauthorized
**Check**:
- Token is being sent in Authorization header
- Token is not expired
- Try refreshing the token
- Try logging out and back in

### Issue: CORS errors
**Check**:
- Backend CORS settings include `http://localhost:3000`
- Both frontend and backend servers are running
- Clear browser cache

### Issue: Password validation errors
**Remember**:
- Passwords must be at least 8 characters
- Passwords cannot be entirely numeric
- Passwords must match in confirm field

## Testing with Curl

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "password_confirm": "testpass123",
    "first_name": "Test",
    "last_name": "User",
    "role": "staff"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'

# Use token (replace <TOKEN> with actual access token)
curl -X GET http://localhost:8000/api/patients/ \
  -H "Authorization: Bearer <TOKEN>"
```

## Development Tips

### View Tokens in Browser
1. Open DevTools → Application → Local Storage
2. Look for:
   - `access_token` - Used for API requests (expires in 1 hour)
   - `refresh_token` - Used to get new access token (expires in 7 days)
   - `user` - User object (JSON string)

### Manually Test Token Refresh
```javascript
// In browser console
const refreshToken = localStorage.getItem('refresh_token');
fetch('http://localhost:8000/api/auth/refresh/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh: refreshToken })
})
.then(r => r.json())
.then(data => {
  console.log('New access token:', data.access);
  localStorage.setItem('access_token', data.access);
});
```

### Force Logout
```javascript
// In browser console
localStorage.clear();
window.location.reload();
```

## Next Steps

1. Create some test users with different roles
2. Test role-based access control
3. Implement logout button in your UI components
4. Add "Change Password" link in user profile
5. Test all CRUD operations with authentication
6. Monitor Network tab to see token refresh in action

---

**You're all set!** 🚀

Start the servers and begin testing the authentication system.

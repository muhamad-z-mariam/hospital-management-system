"""
One-time script to create missing role-based profiles for existing users.

Run this once to fix existing data:
    python manage.py shell < create_missing_profiles.py

Or in Django shell:
    python manage.py shell
    >>> exec(open('create_missing_profiles.py').read())
"""

from api.models import User, Doctor, Nurse, PharmacyStaff

created_count = {'doctors': 0, 'nurses': 0, 'pharmacy_staff': 0}

# Fix doctors
for user in User.objects.filter(role='doctor'):
    if not hasattr(user, 'doctor'):
        Doctor.objects.create(user=user, specialty='General Practice')
        created_count['doctors'] += 1
        print(f"✓ Created Doctor profile for {user.username}")

# Fix nurses
for user in User.objects.filter(role='nurse'):
    if not hasattr(user, 'nurse'):
        Nurse.objects.create(user=user, department='General')
        created_count['nurses'] += 1
        print(f"✓ Created Nurse profile for {user.username}")

# Fix pharmacy staff
for user in User.objects.filter(role='pharmacy_staff'):
    if not hasattr(user, 'pharmacystaff'):
        PharmacyStaff.objects.create(user=user, shift='morning')
        created_count['pharmacy_staff'] += 1
        print(f"✓ Created PharmacyStaff profile for {user.username}")

print("\n" + "="*50)
print(f"Summary:")
print(f"  Doctors created: {created_count['doctors']}")
print(f"  Nurses created: {created_count['nurses']}")
print(f"  Pharmacy Staff created: {created_count['pharmacy_staff']}")
print(f"  Total: {sum(created_count.values())}")
print("="*50)

#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Doctor, Nurse, PharmacyStaff

# Find and delete all orphaned doctor users
doctor_users = User.objects.filter(role='doctor')
orphaned_doctors = doctor_users.exclude(id__in=Doctor.objects.values_list('user_id', flat=True))
print(f"Found {orphaned_doctors.count()} orphaned doctor users")
for user in orphaned_doctors:
    print(f"  Deleting user {user.id}: {user.username}")
    user.delete()

# Find and delete all orphaned nurse users
nurse_users = User.objects.filter(role='nurse')
orphaned_nurses = nurse_users.exclude(id__in=Nurse.objects.values_list('user_id', flat=True))
print(f"Found {orphaned_nurses.count()} orphaned nurse users")
for user in orphaned_nurses:
    print(f"  Deleting user {user.id}: {user.username}")
    user.delete()

# Find and delete all orphaned pharmacy staff users
staff_users = User.objects.filter(role='staff')
orphaned_staff = staff_users.exclude(id__in=PharmacyStaff.objects.values_list('user_id', flat=True))
print(f"Found {orphaned_staff.count()} orphaned pharmacy staff users")
for user in orphaned_staff:
    print(f"  Deleting user {user.id}: {user.username}")
    user.delete()

print("\nCleanup complete!")

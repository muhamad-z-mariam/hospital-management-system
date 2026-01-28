# SIGNALS DISABLED - Profile creation is now handled explicitly in ViewSets
# to avoid duplicate creation issues and to allow custom field values (specialty, department, etc.)
#
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import User, Doctor, Nurse, PharmacyStaff
#
#
# @receiver(post_save, sender=User)
# def create_user_profile(sender, instance, created, **kwargs):
#     """
#     Automatically create role-based profiles when a User is created or role is changed.
#
#     Real-world pattern: Ensures profile records always exist for role-based users.
#     """
#
#     # Doctor profile
#     if instance.role == 'doctor':
#         if not hasattr(instance, 'doctor'):
#             Doctor.objects.create(
#                 user=instance,
#                 specialty='General Practice'  # Default specialty
#             )
#
#     # Nurse profile
#     elif instance.role == 'nurse':
#         if not hasattr(instance, 'nurse'):
#             Nurse.objects.create(
#                 user=instance,
#                 department='General'  # Default department
#             )
#
#     # Pharmacy Staff profile
#     elif instance.role == 'pharmacy_staff':
#         if not hasattr(instance, 'pharmacystaff'):
#             PharmacyStaff.objects.create(
#                 user=instance,
#                 shift='morning'  # Default shift
#             )
#
#
# @receiver(post_save, sender=User)
# def update_user_profile(sender, instance, created, **kwargs):
#     """
#     Handle role changes for existing users.
#     If role changes, create the appropriate profile if it doesn't exist.
#     """
#     if not created:  # Only for existing users
#         # Check and create missing profiles based on current role
#         if instance.role == 'doctor' and not hasattr(instance, 'doctor'):
#             Doctor.objects.create(user=instance, specialty='General Practice')
#
#         elif instance.role == 'nurse' and not hasattr(instance, 'nurse'):
#             Nurse.objects.create(user=instance, department='General')
#
#         elif instance.role == 'pharmacy_staff' and not hasattr(instance, 'pharmacystaff'):
#             PharmacyStaff.objects.create(user=instance, shift='morning')

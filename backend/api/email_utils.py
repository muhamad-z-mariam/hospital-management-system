from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_credentials_email(user_email, username, password, role):
    """
    Send login credentials to newly created staff members

    Args:
        user_email: Email address to send to
        username: Username for login
        password: Password (plain text)
        role: Role of the user (doctor, nurse, pharmacy_staff)

    Returns:
        bool: True if email sent successfully, False otherwise
    """

    role_display = {
        'doctor': 'Doctor',
        'nurse': 'Nurse',
        'pharmacy_staff': 'Pharmacy Staff',
        'staff': 'Staff'
    }.get(role, 'Staff Member')

    subject = f'Hospital Management System - Your Login Credentials'

    message = f"""
Hello,

Welcome to the Hospital Management System!

Your account has been created with the following credentials:

Username: {username}
Password: {password}
Role: {role_display}

You can log in at: http://localhost:3000/login

Please keep these credentials secure and do not share them with anyone.

Best regards,
Hospital Management System
    """.strip()

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=True  # Don't raise exceptions if email fails
        )
        logger.info(f"Credentials email sent to {user_email} for user {username}")
        return True
    except Exception as e:
        logger.error(f"Failed to send credentials email to {user_email}: {str(e)}")
        return False

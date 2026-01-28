from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import (
    User, Patient, Doctor, Nurse, Appointment, Admission, Payment,
    PredictionRecord, Procedure, Room, Schedule, ShiftSwapRequest,
    UnavailabilityRequest, PharmacyStaff, Medicine, Prescription, PrescriptionItem
)


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'role']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role=validated_data['role'],
            password=validated_data['password']
        )
        return user


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs


class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Doctor
        fields = ['id', 'user', 'user_id', 'specialty']


class NurseSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Nurse
        fields = ['id', 'user', 'user_id', 'department']


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.username', read_only=True)
    
    class Meta:
        model = Appointment
        fields = '__all__'


class AdmissionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.username', read_only=True, allow_null=True)
    nurse_name = serializers.CharField(source='nurse.user.username', read_only=True, allow_null=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True, allow_null=True)

    class Meta:
        model = Admission
        fields = '__all__'

    def create(self, validated_data):
        """Custom create to handle ManyToMany procedures field and room occupancy"""
        procedures = validated_data.pop('procedures', [])
        room = validated_data.get('room', None)

        # Check if room has space before creating admission
        if room and not room.has_space():
            raise serializers.ValidationError({
                'room': f'Room {room.room_number} is full ({room.occupied_beds}/{room.bed_capacity} beds occupied)'
            })

        admission = Admission.objects.create(**validated_data)
        if procedures:
            admission.procedures.set(procedures)

        # Occupy bed if room is assigned and status is 'admitted'
        if room and admission.status == 'admitted':
            room.occupy_bed()

        return admission

    def update(self, instance, validated_data):
        """Custom update to handle ManyToMany procedures field, room changes, and discharge"""
        procedures = validated_data.pop('procedures', None)
        old_room = instance.room
        old_status = instance.status
        new_room = validated_data.get('room', instance.room)
        new_status = validated_data.get('status', instance.status)

        # Check if new room has space
        if new_room and new_room != old_room and not new_room.has_space():
            raise serializers.ValidationError({
                'room': f'Room {new_room.room_number} is full ({new_room.occupied_beds}/{new_room.bed_capacity} beds occupied)'
            })

        # Handle room changes
        if old_room != new_room:
            # Release old room if it was occupied
            if old_room and old_status == 'admitted':
                old_room.release_bed()
            # Occupy new room if status is admitted
            if new_room and new_status == 'admitted':
                new_room.occupy_bed()

        # Handle status change to 'admitted' (occupy room if not already occupied)
        elif old_status != 'admitted' and new_status == 'admitted' and new_room:
            new_room.occupy_bed()

        # Handle discharge (release room)
        elif new_status == 'discharged' and old_room and old_status == 'admitted':
            old_room.release_bed()

        # Update instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if procedures is not None:
            instance.procedures.set(procedures)

        return instance


class PaymentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    procedure_names = serializers.SerializerMethodField()
    
    def get_procedure_names(self, obj):
        return [p.name for p in obj.procedures.all()]
    
    class Meta:
        model = Payment
        fields = '__all__'


class PredictionRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    predicted_by_username = serializers.CharField(source='predicted_by.username', read_only=True, allow_null=True)
    patient_age = serializers.IntegerField(source='patient.age', read_only=True)
    patient_contact = serializers.CharField(source='patient.contact', read_only=True)
    admission_status = serializers.SerializerMethodField()
    is_currently_admitted = serializers.SerializerMethodField()

    def get_admission_status(self, obj):
        """Get the most recent admission status for this patient"""
        latest_admission = obj.patient.admission_set.order_by('-admission_date').first()
        if latest_admission:
            return latest_admission.status
        return None

    def get_is_currently_admitted(self, obj):
        """Check if patient is currently admitted (not discharged)"""
        latest_admission = obj.patient.admission_set.order_by('-admission_date').first()
        if latest_admission and latest_admission.status != 'discharged':
            return True
        return False

    class Meta:
        model = PredictionRecord
        fields = '__all__'

class ProcedureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Procedure
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class ScheduleSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    user_role = serializers.CharField(source='user.role', read_only=True)

    def get_user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user.first_name else obj.user.username

    class Meta:
        model = Schedule
        fields = '__all__'


class ShiftSwapRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.username', read_only=True)
    requester_full_name = serializers.SerializerMethodField()
    recipient_name = serializers.CharField(source='recipient.username', read_only=True, allow_null=True)
    recipient_full_name = serializers.SerializerMethodField()
    requester_shift_details = ScheduleSerializer(source='requester_shift', read_only=True)
    recipient_shift_details = ScheduleSerializer(source='recipient_shift', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)

    def get_requester_full_name(self, obj):
        return f"{obj.requester.first_name} {obj.requester.last_name}" if obj.requester.first_name else obj.requester.username

    def get_recipient_full_name(self, obj):
        if obj.recipient:
            return f"{obj.recipient.first_name} {obj.recipient.last_name}" if obj.recipient.first_name else obj.recipient.username
        return None

    class Meta:
        model = ShiftSwapRequest
        fields = '__all__'


class UnavailabilityRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    user_role = serializers.CharField(source='user.role', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    affected_days = serializers.SerializerMethodField()

    def get_user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user.first_name else obj.user.username

    def get_affected_days(self, obj):
        """Calculate number of days affected"""
        delta = obj.end_date - obj.start_date
        return delta.days + 1

    class Meta:
        model = UnavailabilityRequest
        fields = '__all__'


class PharmacyStaffSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = PharmacyStaff
        fields = ['id', 'user', 'user_id', 'license_number', 'shift']


class MedicineSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Medicine
        fields = '__all__'


class PrescriptionItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    medicine_details = MedicineSerializer(source='medicine', read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, source='get_total_price')

    class Meta:
        model = PrescriptionItem
        fields = '__all__'


class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_contact = serializers.CharField(source='patient.contact', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.username', read_only=True, allow_null=True)
    doctor_specialty = serializers.CharField(source='doctor.specialty', read_only=True, allow_null=True)
    admission_id = serializers.IntegerField(source='admission.id', read_only=True, allow_null=True)
    appointment_id = serializers.IntegerField(source='appointment.id', read_only=True, allow_null=True)
    dispensed_by_name = serializers.CharField(source='dispensed_by.user.username', read_only=True, allow_null=True)
    items = PrescriptionItemSerializer(many=True, read_only=True)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, source='get_total_cost')

    class Meta:
        model = Prescription
        fields = '__all__'


class PrescriptionCreateSerializer(serializers.Serializer):
    """Serializer for creating prescriptions with medicines"""
    patient_id = serializers.IntegerField()
    doctor_id = serializers.IntegerField()
    admission_id = serializers.IntegerField(required=False, allow_null=True)
    appointment_id = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    medicines = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )

    def validate_medicines(self, value):
        """Validate medicines list structure"""
        for med in value:
            if 'medicine_id' not in med:
                raise serializers.ValidationError("Each medicine must have 'medicine_id'")
            if 'quantity' not in med:
                raise serializers.ValidationError("Each medicine must have 'quantity'")
            if 'dosage_instructions' not in med:
                raise serializers.ValidationError("Each medicine must have 'dosage_instructions'")
        return value



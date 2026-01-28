from decimal import Decimal

DAILY_INPATIENT_FEE = Decimal('30.00')  # $30 per day

def calculate_payment(patient, payment_type='inpatient', admission=None, appointments=None, selected_procedures=None, include_prescriptions=True):
    """
    Calculate payment based on:
    - Payment type (inpatient or outpatient)
    - Procedures performed
    - Length of hospital stay (for inpatient only)
    - Medicine costs from prescriptions
    - Patient insurance status
    - Handicapped status

    Returns dict with breakdown
    """
    if selected_procedures is None:
        selected_procedures = []

    # 1. Calculate procedure costs
    procedure_cost = sum([proc.cost for proc in selected_procedures])

    # 2. Calculate daily care cost (only for inpatient)
    daily_care_cost = Decimal('0')
    length_of_stay = 0

    if payment_type == 'inpatient' and admission:
        length_of_stay = admission.get_length_of_stay()
        daily_care_cost = Decimal(length_of_stay) * DAILY_INPATIENT_FEE

    # 3. Calculate medicine costs from prescriptions
    medicine_cost = Decimal('0')
    if include_prescriptions:
        if payment_type == 'inpatient' and admission:
            # Get prescriptions for admission
            prescriptions = admission.prescriptions.filter(status='dispensed')
            for prescription in prescriptions:
                medicine_cost += Decimal(str(prescription.get_total_cost()))
        elif payment_type == 'outpatient' and appointments:
            # Get prescriptions for all appointments
            for appointment in appointments:
                prescriptions = appointment.prescriptions.filter(status='dispensed')
                for prescription in prescriptions:
                    medicine_cost += Decimal(str(prescription.get_total_cost()))

    # 4. Total before discount
    total_before_discount = procedure_cost + daily_care_cost + medicine_cost

    # 5. Calculate discount based on patient type
    discount_percent = Decimal('0')

    # HANDICAPPED LOGIC
    if patient.handicapped:
        if total_before_discount < 3000:
            discount_percent = Decimal('100')  # Free
        else:
            discount_percent = Decimal('90')  # Pay only 10%

    # INSURANCE LOGIC (if not handicapped or handicapped pays)
    elif patient.insurance_status:
        discount_percent = Decimal('80')  # Insurance pays 80%, patient pays 20%

    # UNINSURED (default)
    else:
        discount_percent = Decimal('30')  # Patient pays 70%, gets 30% discount

    # 6. Calculate final amount
    discount_amount = total_before_discount * (discount_percent / Decimal('100'))
    final_amount = total_before_discount - discount_amount

    return {
        'procedure_cost': procedure_cost,
        'daily_care_cost': daily_care_cost,
        'medicine_cost': medicine_cost,
        'length_of_stay': length_of_stay,
        'total_before_discount': total_before_discount,
        'discount_percent': discount_percent,
        'discount_amount': discount_amount,
        'final_amount': final_amount,
    }
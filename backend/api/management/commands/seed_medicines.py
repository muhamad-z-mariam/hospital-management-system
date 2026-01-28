from django.core.management.base import BaseCommand
from api.models import Medicine


class Command(BaseCommand):
    help = 'Seeds the database with 50 common medicines'

    def handle(self, *args, **kwargs):
        medicines = [
            # Antibiotics (10)
            {'name': 'Amoxicillin', 'generic_name': 'Amoxicillin', 'category': 'antibiotic', 'dosage_form': 'Capsule', 'strength': '500mg', 'price_per_unit': 0.50, 'stock_quantity': 500, 'manufacturer': 'GSK', 'requires_prescription': True},
            {'name': 'Azithromycin', 'generic_name': 'Azithromycin', 'category': 'antibiotic', 'dosage_form': 'Tablet', 'strength': '250mg', 'price_per_unit': 1.20, 'stock_quantity': 300, 'manufacturer': 'Pfizer', 'requires_prescription': True},
            {'name': 'Ciprofloxacin', 'generic_name': 'Ciprofloxacin', 'category': 'antibiotic', 'dosage_form': 'Tablet', 'strength': '500mg', 'price_per_unit': 0.80, 'stock_quantity': 400, 'manufacturer': 'Bayer', 'requires_prescription': True},
            {'name': 'Doxycycline', 'generic_name': 'Doxycycline', 'category': 'antibiotic', 'dosage_form': 'Capsule', 'strength': '100mg', 'price_per_unit': 0.60, 'stock_quantity': 350, 'manufacturer': 'Teva', 'requires_prescription': True},
            {'name': 'Cephalexin', 'generic_name': 'Cephalexin', 'category': 'antibiotic', 'dosage_form': 'Capsule', 'strength': '500mg', 'price_per_unit': 0.70, 'stock_quantity': 250, 'manufacturer': 'Lupin', 'requires_prescription': True},
            {'name': 'Metronidazole', 'generic_name': 'Metronidazole', 'category': 'antibiotic', 'dosage_form': 'Tablet', 'strength': '400mg', 'price_per_unit': 0.40, 'stock_quantity': 300, 'manufacturer': 'Sandoz', 'requires_prescription': True},
            {'name': 'Clindamycin', 'generic_name': 'Clindamycin', 'category': 'antibiotic', 'dosage_form': 'Capsule', 'strength': '300mg', 'price_per_unit': 1.50, 'stock_quantity': 200, 'manufacturer': 'Pfizer', 'requires_prescription': True},
            {'name': 'Levofloxacin', 'generic_name': 'Levofloxacin', 'category': 'antibiotic', 'dosage_form': 'Tablet', 'strength': '500mg', 'price_per_unit': 2.00, 'stock_quantity': 180, 'manufacturer': 'Janssen', 'requires_prescription': True},
            {'name': 'Trimethoprim', 'generic_name': 'Trimethoprim', 'category': 'antibiotic', 'dosage_form': 'Tablet', 'strength': '200mg', 'price_per_unit': 0.45, 'stock_quantity': 220, 'manufacturer': 'Mylan', 'requires_prescription': True},
            {'name': 'Clarithromycin', 'generic_name': 'Clarithromycin', 'category': 'antibiotic', 'dosage_form': 'Tablet', 'strength': '500mg', 'price_per_unit': 1.80, 'stock_quantity': 150, 'manufacturer': 'Abbott', 'requires_prescription': True},

            # Painkillers (10)
            {'name': 'Paracetamol', 'generic_name': 'Acetaminophen', 'category': 'painkiller', 'dosage_form': 'Tablet', 'strength': '500mg', 'price_per_unit': 0.10, 'stock_quantity': 1000, 'manufacturer': 'GSK', 'requires_prescription': False},
            {'name': 'Ibuprofen', 'generic_name': 'Ibuprofen', 'category': 'painkiller', 'dosage_form': 'Tablet', 'strength': '400mg', 'price_per_unit': 0.15, 'stock_quantity': 800, 'manufacturer': 'Pfizer', 'requires_prescription': False},
            {'name': 'Aspirin', 'generic_name': 'Acetylsalicylic Acid', 'category': 'painkiller', 'dosage_form': 'Tablet', 'strength': '75mg', 'price_per_unit': 0.05, 'stock_quantity': 1200, 'manufacturer': 'Bayer', 'requires_prescription': False},
            {'name': 'Naproxen', 'generic_name': 'Naproxen', 'category': 'painkiller', 'dosage_form': 'Tablet', 'strength': '500mg', 'price_per_unit': 0.30, 'stock_quantity': 400, 'manufacturer': 'Teva', 'requires_prescription': True},
            {'name': 'Codeine', 'generic_name': 'Codeine Phosphate', 'category': 'painkiller', 'dosage_form': 'Tablet', 'strength': '30mg', 'price_per_unit': 0.80, 'stock_quantity': 250, 'manufacturer': 'Aspen', 'requires_prescription': True},
            {'name': 'Tramadol', 'generic_name': 'Tramadol HCl', 'category': 'painkiller', 'dosage_form': 'Capsule', 'strength': '50mg', 'price_per_unit': 1.20, 'stock_quantity': 300, 'manufacturer': 'Janssen', 'requires_prescription': True},
            {'name': 'Morphine', 'generic_name': 'Morphine Sulfate', 'category': 'painkiller', 'dosage_form': 'Injection', 'strength': '10mg/ml', 'price_per_unit': 5.00, 'stock_quantity': 100, 'manufacturer': 'Purdue', 'requires_prescription': True},
            {'name': 'Diclofenac', 'generic_name': 'Diclofenac Sodium', 'category': 'painkiller', 'dosage_form': 'Tablet', 'strength': '50mg', 'price_per_unit': 0.25, 'stock_quantity': 500, 'manufacturer': 'Novartis', 'requires_prescription': True},
            {'name': 'Meloxicam', 'generic_name': 'Meloxicam', 'category': 'painkiller', 'dosage_form': 'Tablet', 'strength': '15mg', 'price_per_unit': 0.60, 'stock_quantity': 350, 'manufacturer': 'Boehringer', 'requires_prescription': True},
            {'name': 'Celecoxib', 'generic_name': 'Celecoxib', 'category': 'painkiller', 'dosage_form': 'Capsule', 'strength': '200mg', 'price_per_unit': 1.50, 'stock_quantity': 200, 'manufacturer': 'Pfizer', 'requires_prescription': True},

            # Antivirals (5)
            {'name': 'Acyclovir', 'generic_name': 'Acyclovir', 'category': 'antiviral', 'dosage_form': 'Tablet', 'strength': '400mg', 'price_per_unit': 1.00, 'stock_quantity': 200, 'manufacturer': 'GSK', 'requires_prescription': True},
            {'name': 'Oseltamivir', 'generic_name': 'Oseltamivir', 'category': 'antiviral', 'dosage_form': 'Capsule', 'strength': '75mg', 'price_per_unit': 3.50, 'stock_quantity': 150, 'manufacturer': 'Roche', 'requires_prescription': True},
            {'name': 'Valacyclovir', 'generic_name': 'Valacyclovir', 'category': 'antiviral', 'dosage_form': 'Tablet', 'strength': '500mg', 'price_per_unit': 2.00, 'stock_quantity': 180, 'manufacturer': 'GSK', 'requires_prescription': True},
            {'name': 'Ribavirin', 'generic_name': 'Ribavirin', 'category': 'antiviral', 'dosage_form': 'Capsule', 'strength': '200mg', 'price_per_unit': 5.00, 'stock_quantity': 100, 'manufacturer': 'Merck', 'requires_prescription': True},
            {'name': 'Remdesivir', 'generic_name': 'Remdesivir', 'category': 'antiviral', 'dosage_form': 'Injection', 'strength': '100mg', 'price_per_unit': 50.00, 'stock_quantity': 50, 'manufacturer': 'Gilead', 'requires_prescription': True},

            # Antifungals (3)
            {'name': 'Fluconazole', 'generic_name': 'Fluconazole', 'category': 'antifungal', 'dosage_form': 'Capsule', 'strength': '150mg', 'price_per_unit': 2.50, 'stock_quantity': 150, 'manufacturer': 'Pfizer', 'requires_prescription': True},
            {'name': 'Clotrimazole', 'generic_name': 'Clotrimazole', 'category': 'antifungal', 'dosage_form': 'Cream', 'strength': '1%', 'price_per_unit': 3.00, 'stock_quantity': 200, 'manufacturer': 'Bayer', 'requires_prescription': False},
            {'name': 'Terbinafine', 'generic_name': 'Terbinafine', 'category': 'antifungal', 'dosage_form': 'Tablet', 'strength': '250mg', 'price_per_unit': 1.80, 'stock_quantity': 120, 'manufacturer': 'Novartis', 'requires_prescription': True},

            # Antihistamines (4)
            {'name': 'Cetirizine', 'generic_name': 'Cetirizine', 'category': 'antihistamine', 'dosage_form': 'Tablet', 'strength': '10mg', 'price_per_unit': 0.20, 'stock_quantity': 600, 'manufacturer': 'UCB', 'requires_prescription': False},
            {'name': 'Loratadine', 'generic_name': 'Loratadine', 'category': 'antihistamine', 'dosage_form': 'Tablet', 'strength': '10mg', 'price_per_unit': 0.25, 'stock_quantity': 500, 'manufacturer': 'Merck', 'requires_prescription': False},
            {'name': 'Fexofenadine', 'generic_name': 'Fexofenadine', 'category': 'antihistamine', 'dosage_form': 'Tablet', 'strength': '120mg', 'price_per_unit': 0.40, 'stock_quantity': 400, 'manufacturer': 'Sanofi', 'requires_prescription': False},
            {'name': 'Chlorpheniramine', 'generic_name': 'Chlorpheniramine', 'category': 'antihistamine', 'dosage_form': 'Tablet', 'strength': '4mg', 'price_per_unit': 0.15, 'stock_quantity': 350, 'manufacturer': 'GSK', 'requires_prescription': False},

            # Cardiovascular (6)
            {'name': 'Atorvastatin', 'generic_name': 'Atorvastatin', 'category': 'cardiovascular', 'dosage_form': 'Tablet', 'strength': '20mg', 'price_per_unit': 0.50, 'stock_quantity': 600, 'manufacturer': 'Pfizer', 'requires_prescription': True},
            {'name': 'Amlodipine', 'generic_name': 'Amlodipine', 'category': 'cardiovascular', 'dosage_form': 'Tablet', 'strength': '5mg', 'price_per_unit': 0.30, 'stock_quantity': 700, 'manufacturer': 'Pfizer', 'requires_prescription': True},
            {'name': 'Lisinopril', 'generic_name': 'Lisinopril', 'category': 'cardiovascular', 'dosage_form': 'Tablet', 'strength': '10mg', 'price_per_unit': 0.40, 'stock_quantity': 550, 'manufacturer': 'AstraZeneca', 'requires_prescription': True},
            {'name': 'Metoprolol', 'generic_name': 'Metoprolol', 'category': 'cardiovascular', 'dosage_form': 'Tablet', 'strength': '50mg', 'price_per_unit': 0.35, 'stock_quantity': 500, 'manufacturer': 'AstraZeneca', 'requires_prescription': True},
            {'name': 'Clopidogrel', 'generic_name': 'Clopidogrel', 'category': 'cardiovascular', 'dosage_form': 'Tablet', 'strength': '75mg', 'price_per_unit': 1.00, 'stock_quantity': 400, 'manufacturer': 'Sanofi', 'requires_prescription': True},
            {'name': 'Warfarin', 'generic_name': 'Warfarin Sodium', 'category': 'cardiovascular', 'dosage_form': 'Tablet', 'strength': '5mg', 'price_per_unit': 0.20, 'stock_quantity': 450, 'manufacturer': 'Bristol-Myers', 'requires_prescription': True},

            # Diabetes (4)
            {'name': 'Metformin', 'generic_name': 'Metformin HCl', 'category': 'diabetes', 'dosage_form': 'Tablet', 'strength': '500mg', 'price_per_unit': 0.25, 'stock_quantity': 800, 'manufacturer': 'Merck', 'requires_prescription': True},
            {'name': 'Glipizide', 'generic_name': 'Glipizide', 'category': 'diabetes', 'dosage_form': 'Tablet', 'strength': '5mg', 'price_per_unit': 0.40, 'stock_quantity': 400, 'manufacturer': 'Pfizer', 'requires_prescription': True},
            {'name': 'Insulin Glargine', 'generic_name': 'Insulin Glargine', 'category': 'diabetes', 'dosage_form': 'Injection', 'strength': '100U/ml', 'price_per_unit': 25.00, 'stock_quantity': 80, 'manufacturer': 'Sanofi', 'requires_prescription': True},
            {'name': 'Sitagliptin', 'generic_name': 'Sitagliptin', 'category': 'diabetes', 'dosage_form': 'Tablet', 'strength': '100mg', 'price_per_unit': 3.00, 'stock_quantity': 200, 'manufacturer': 'Merck', 'requires_prescription': True},

            # Respiratory (4)
            {'name': 'Salbutamol', 'generic_name': 'Salbutamol', 'category': 'respiratory', 'dosage_form': 'Inhaler', 'strength': '100mcg', 'price_per_unit': 5.00, 'stock_quantity': 250, 'manufacturer': 'GSK', 'requires_prescription': True},
            {'name': 'Budesonide', 'generic_name': 'Budesonide', 'category': 'respiratory', 'dosage_form': 'Inhaler', 'strength': '200mcg', 'price_per_unit': 15.00, 'stock_quantity': 150, 'manufacturer': 'AstraZeneca', 'requires_prescription': True},
            {'name': 'Montelukast', 'generic_name': 'Montelukast', 'category': 'respiratory', 'dosage_form': 'Tablet', 'strength': '10mg', 'price_per_unit': 1.20, 'stock_quantity': 300, 'manufacturer': 'Merck', 'requires_prescription': True},
            {'name': 'Prednisolone', 'generic_name': 'Prednisolone', 'category': 'respiratory', 'dosage_form': 'Tablet', 'strength': '5mg', 'price_per_unit': 0.30, 'stock_quantity': 400, 'manufacturer': 'Pfizer', 'requires_prescription': True},

            # Gastrointestinal (4)
            {'name': 'Omeprazole', 'generic_name': 'Omeprazole', 'category': 'gastrointestinal', 'dosage_form': 'Capsule', 'strength': '20mg', 'price_per_unit': 0.35, 'stock_quantity': 600, 'manufacturer': 'AstraZeneca', 'requires_prescription': True},
            {'name': 'Ranitidine', 'generic_name': 'Ranitidine', 'category': 'gastrointestinal', 'dosage_form': 'Tablet', 'strength': '150mg', 'price_per_unit': 0.20, 'stock_quantity': 500, 'manufacturer': 'GSK', 'requires_prescription': False},
            {'name': 'Loperamide', 'generic_name': 'Loperamide', 'category': 'gastrointestinal', 'dosage_form': 'Capsule', 'strength': '2mg', 'price_per_unit': 0.25, 'stock_quantity': 400, 'manufacturer': 'Janssen', 'requires_prescription': False},
            {'name': 'Ondansetron', 'generic_name': 'Ondansetron', 'category': 'gastrointestinal', 'dosage_form': 'Tablet', 'strength': '8mg', 'price_per_unit': 1.50, 'stock_quantity': 200, 'manufacturer': 'GSK', 'requires_prescription': True},
        ]

        created_count = 0
        updated_count = 0

        for medicine_data in medicines:
            medicine, created = Medicine.objects.update_or_create(
                name=medicine_data['name'],
                defaults=medicine_data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created: {medicine.name}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'Updated: {medicine.name}'))

        self.stdout.write(self.style.SUCCESS(f'\nSeeding complete!'))
        self.stdout.write(self.style.SUCCESS(f'Created: {created_count} medicines'))
        self.stdout.write(self.style.SUCCESS(f'Updated: {updated_count} medicines'))
        self.stdout.write(self.style.SUCCESS(f'Total: {Medicine.objects.count()} medicines in database'))

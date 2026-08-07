from django.core.management.base import BaseCommand
from services.models import Category, Service

class Command(BaseCommand):
    help = 'Seeds the database with standard Indian service categories and default pricing types'

    def handle(self, *args, **kwargs):
        categories_data = {
            'Home Services': [
                ('Electrician', 'hourly'),
                ('Plumber', 'hourly'),
                ('Carpenter', 'hourly'),
                ('Painter', 'fixed'),
                ('AC Repair', 'fixed'),
                ('Appliance Repair', 'fixed'),
                ('Cleaning', 'fixed'),
                ('Pest Control', 'fixed'),
                ('RO Water Purifier Service', 'fixed')
            ],
            'Personal & Beauty': [
                ('Salon for Women', 'fixed'),
                ('Salon for Men', 'fixed'),
                ('Spa at Home', 'fixed'),
                ('Makeup Artist', 'fixed'),
                ('Fitness Trainer', 'hourly'),
                ('Yoga Instructor', 'hourly')
            ],
            'Education & Learning': [
                ('Home Tutor', 'hourly'),
                ('Music Teacher', 'hourly'),
                ('Dance Teacher', 'hourly'),
                ('Language Instructor', 'hourly')
            ],
            'IT & Digital': [
                ('Web Developer', 'fixed'),
                ('Graphic Designer', 'fixed'),
                ('Computer Repair', 'fixed'),
                ('CCTV Installation', 'fixed')
            ],
            'Vehicle Services': [
                ('Car Wash', 'fixed'),
                ('Bike Repair', 'fixed'),
                ('Car Mechanic', 'fixed')
            ]
        }

        self.stdout.write('Seeding service categories...')

        for cat_name, services in categories_data.items():
            category, created = Category.objects.get_or_create(
                name=cat_name,
                defaults={'description': f'{cat_name} category'}
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {cat_name}'))
            else:
                self.stdout.write(f'Category already exists: {cat_name}')

            for svc_info in services:
                if isinstance(svc_info, tuple):
                    svc_name, default_ptype = svc_info
                else:
                    svc_name, default_ptype = svc_info, 'fixed'

                service, s_created = Service.objects.get_or_create(
                    category=category,
                    name=svc_name,
                    defaults={
                        'description': f'Professional {svc_name} service',
                        'default_pricing_type': default_ptype
                    }
                )
                if s_created:
                    self.stdout.write(self.style.SUCCESS(f'  - Created service: {svc_name} ({default_ptype})'))
                else:
                    service.default_pricing_type = default_ptype
                    service.save(update_fields=['default_pricing_type'])
                    self.stdout.write(f'  - Updated service default pricing: {svc_name} ({default_ptype})')

        self.stdout.write(self.style.SUCCESS('Successfully seeded all services!'))


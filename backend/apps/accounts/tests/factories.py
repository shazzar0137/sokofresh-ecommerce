"""factory_boy factories for accounts (test data only)."""

import factory

from apps.accounts.models import User


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    # Fictional numbers in the 0700 range; no SMS is ever sent in tests.
    phone = factory.Sequence(lambda n: f"+2547000{n:05d}")
    full_name = factory.Faker("name")
    phone_verified = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        return model_class.objects.create_user(*args, **kwargs)

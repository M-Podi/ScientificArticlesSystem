from django.db import models

class ActiveQuerySet(models.QuerySet):
    def delete(self, *args, **kwargs):
        if kwargs.pop('hard', False):
            return super().delete(*args, **kwargs)
        return self.update(active=False)

class ActiveManager(models.Manager):
    def get_queryset(self):
        return ActiveQuerySet(self.model, using=self._db).exclude(active=False)

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return ActiveQuerySet(self.model, using=self._db)

from django.db import models
from django.contrib.auth.models import User
from django.db.models import Sum

from api.managers import ActiveManager, SoftDeleteManager


class ScientificDomain(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    user = models.OneToOneField(User, related_name='profile', on_delete=models.CASCADE)
    preferred_fields = models.ManyToManyField(
        ScientificDomain, through='UserFieldProgress', related_name='interested_users', blank=True
    )

    def __str__(self):
        return f"{self.user.username}'s profile"

class UserFieldProgress(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='field_progress')
    scientific_domain = models.ForeignKey(ScientificDomain, on_delete=models.CASCADE)
    # current_points = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)

    @property
    def current_points(self):
        return UserArticle.objects.filter(user=self.user_profile.user, article__scientific_domain=self.scientific_domain, status="read").aggregate(total_points=Sum("article__points"))["total_points"] or 0

    objects = SoftDeleteManager()
    active_objects = ActiveManager()
    all_objects = SoftDeleteManager()

    class Meta:
        unique_together = ('user_profile', 'scientific_domain')

    def delete(self, *args, **kwargs):
        if kwargs.pop('hard', False):
            return super().delete(*args, **kwargs)
        self.active = False
        self.save(update_fields=('active',))
        return (0, {self._meta.model_name: 0})

    def __str__(self):
        return f"{self.user_profile.user.username} - {self.scientific_domain.name}: {self.current_points} points"

class Article(models.Model):
    scientific_domain = models.ForeignKey(
        ScientificDomain, related_name='articles', on_delete=models.CASCADE
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    number_of_pages = models.PositiveIntegerField()
    points = models.PositiveIntegerField()
    minimum_points = models.PositiveIntegerField(null=True, blank=True)
    file = models.FileField(upload_to='articles/', null=True, blank=True)

    def __str__(self):
        return self.title

class UserArticle(models.Model):
    STATUS_CHOICES = [
        ('reading', 'Reading'),
        ('read', 'Read'),
        ('reviewed', 'Reviewed'),
    ]

    user = models.ForeignKey(User, related_name='user_articles', on_delete=models.CASCADE)
    article = models.ForeignKey(Article, related_name='user_articles', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    page_left_off = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('user', 'article')

    def __str__(self):
        return f"{self.user.username} - {self.article.title} - {self.status}"

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='reviews')
    # Score out of 10, with default 0
    score = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'article')

    def __str__(self):
        return f"Review by {self.user.username} on {self.article.title} - Score: {self.score}"

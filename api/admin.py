# api/admin.py

from django.contrib import admin
from .models import ScientificDomain, UserProfile, UserFieldProgress, Article, UserArticle, Review


@admin.register(ScientificDomain)
class ScientificDomainAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user')
    search_fields = ('user__username',)

@admin.register(UserFieldProgress)
class UserFieldProgressAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_profile', 'scientific_domain', 'current_points')
    list_filter = ('scientific_domain',)
    search_fields = ('user_profile__user__username', 'scientific_domain__name')

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'scientific_domain', 'points', 'minimum_points')
    list_filter = ('scientific_domain',)
    search_fields = ('title',)

@admin.register(UserArticle)
class UserArticleAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'article', 'status', 'page_left_off')
    list_filter = ('status', 'article__scientific_domain')
    search_fields = ('user__username', 'article__title')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'article', 'score', 'created_at')
    search_fields = ('user__username', 'article__title')

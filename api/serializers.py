# api/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ScientificDomain, Article, UserProfile, UserArticle, UserFieldProgress, Review
from django.db import transaction

class ScientificDomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScientificDomain
        fields = ['id', 'name']

class UserFieldProgressSerializer(serializers.ModelSerializer):
    scientific_domain = ScientificDomainSerializer(read_only=True)

    class Meta:
        model = UserFieldProgress
        fields = ['scientific_domain', 'current_points', 'active']

class UserSerializer(serializers.ModelSerializer):
    interests = serializers.SlugRelatedField(
        many=True,
        queryset=ScientificDomain.objects.all(),
        slug_field='name',
        source='profile.preferred_fields'
    )
    field_progress = UserFieldProgressSerializer(many=True, read_only=True, source='profile.field_progress')

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'interests', 'field_progress']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        new_interests = profile_data.get('preferred_fields', [])

        # Update the user's other fields first
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Set the new preferred fields
        instance.profile.preferred_fields.set(new_interests)

        # Reactivate or create progress for newly added interests
        for domain in new_interests:
            progress, created = UserFieldProgress.objects.get_or_create(
                user_profile=instance.profile,
                scientific_domain=domain
            )
            progress.active = True
            # If newly created, current_points = 0 by default
            progress.save()

        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    interests = serializers.SlugRelatedField(
        many=True,
        queryset=ScientificDomain.objects.all(),
        slug_field='name',
        required=False
    )

    class Meta:
        model = User
        fields = [
            'username', 'password', 'first_name',
            'last_name', 'email', 'interests'
        ]

    def create(self, validated_data):
        interests = validated_data.pop('interests', [])
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email', ''),
        )
        user.profile.preferred_fields.set(interests)
        return user

class ArticleSerializer(serializers.ModelSerializer):
    scientific_domain = serializers.SlugRelatedField(
        slug_field='name',
        queryset=ScientificDomain.objects.all()
    )

    class Meta:
        model = Article
        fields = [
            'id', 'scientific_domain', 'title', 'content',
            'number_of_pages', 'points', 'minimum_points', 'file'
        ]

    def create(self, validated_data):
        scientific_domain_name = validated_data.pop('scientific_domain')
        scientific_domain = ScientificDomain.objects.get(name=scientific_domain_name)
        article = Article.objects.create(scientific_domain=scientific_domain, **validated_data)
        return article

    def update(self, instance, validated_data):
        scientific_domain_name = validated_data.pop('scientific_domain', None)
        if scientific_domain_name:
            scientific_domain = ScientificDomain.objects.get(name=scientific_domain_name)
            instance.scientific_domain = scientific_domain
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class UserArticleSerializer(serializers.ModelSerializer):
    article = serializers.PrimaryKeyRelatedField(queryset=Article.objects.all())
    status = serializers.CharField(required=False, default='reading')

    class Meta:
        model = UserArticle
        fields = ['id', 'article', 'status', 'page_left_off']

    # def create(self, validated_data):
    #     user = self.context['request'].user
    #     article = validated_data.pop('article')
    #
    #     user_article = UserArticle.objects.create(user=user, article=article, **validated_data)
    #
    #     return user_article


class ReviewSerializer(serializers.ModelSerializer):
    article = serializers.PrimaryKeyRelatedField(queryset=Article.objects.all())

    class Meta:
        model = Review
        fields = ['id', 'article', 'score']

    def validate(self, data):
        user = self.context['request'].user
        article = data['article']

        try:
            user_article = UserArticle.objects.get(user=user, article=article)
            if user_article.status != 'read':
                raise serializers.ValidationError("You can only review articles you have read.")
        except UserArticle.DoesNotExist:
            raise serializers.ValidationError("You can only review articles you have read.")

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        review, created = Review.objects.update_or_create(
            user=user,
            article=validated_data['article'],
            defaults={'score': validated_data['score']}
        )
        return review


# api/serializers.py

class StoreArticleSerializer(serializers.ModelSerializer):
    file_path = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ['id', 'title', 'scientific_domain', 'points', 'minimum_points', 'file_path']

    def get_file_path(self, obj):
        if obj.file:
            return obj.file.url
        return None
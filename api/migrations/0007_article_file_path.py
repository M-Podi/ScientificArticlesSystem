# Generated by Django 5.1.3 on 2024-12-17 08:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_remove_review_content_review_score'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='file_path',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]

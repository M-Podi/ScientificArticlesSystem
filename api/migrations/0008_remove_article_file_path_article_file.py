# Generated by Django 5.1.3 on 2024-12-17 08:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_article_file_path'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='article',
            name='file_path',
        ),
        migrations.AddField(
            model_name='article',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to='articles/'),
        ),
    ]
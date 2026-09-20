# Generated manually for the Sangolo safety supervision workflow.
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("messagerie", "0004_evaluationconversation"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="analyse_ia_effectuee",
            field=models.BooleanField(default=False),
        ),
    ]

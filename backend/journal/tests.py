"""
journal/tests.py — le journal d'un ado ne doit jamais être visible par un autre.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import Utilisateur
from .models import EntreeJournal, Humeur


class JournalConfidentialiteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(username="ado_a", password="motdepasse123")
        self.ado_a = Utilisateur.objects.create(
            user=self.user_a, pseudo="ado_a", age=15, mot_de_passe_hash=self.user_a.password,
        )
        self.user_b = User.objects.create_user(username="ado_b", password="motdepasse123")
        self.ado_b = Utilisateur.objects.create(
            user=self.user_b, pseudo="ado_b", age=16, mot_de_passe_hash=self.user_b.password,
        )
        EntreeJournal.objects.create(utilisateur=self.ado_a, humeur=Humeur.TRISTE, texte="secret de A")
        EntreeJournal.objects.create(utilisateur=self.ado_b, humeur=Humeur.CONTENT, texte="secret de B")

    def test_ado_ne_voit_que_son_propre_journal(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get("/api/journal/entrees/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        textes = [e["texte"] for e in response.data.get("results", response.data)]
        self.assertIn("secret de A", textes)
        self.assertNotIn("secret de B", textes)

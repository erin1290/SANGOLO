"""
accounts/tests.py

Teste les points les plus sensibles côté comptes :
- l'ado s'inscrit sans donnée identifiante et peut se reconnecter
- un écoutant non validé ne peut pas se connecter
- un écoutant validé peut se connecter
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from .models import Ecoutant, StatutEcoutant


class InscriptionAdoTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_inscription_ado_cree_compte_et_retourne_token(self):
        response = self.client.post(reverse("inscription_ado"), {
            "pseudo": "mango_23",
            "age": 16,
            "mot_de_passe": "un_mot_de_passe_solide",
            "consentement_analyse_ia": True,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["pseudo"], "mango_23")

    def test_inscription_refuse_pseudo_deja_pris(self):
        self.client.post(reverse("inscription_ado"), {
            "pseudo": "mango_23", "age": 16, "mot_de_passe": "un_mot_de_passe_solide",
        })
        response = self.client.post(reverse("inscription_ado"), {
            "pseudo": "mango_23", "age": 17, "mot_de_passe": "autre_mot_de_passe",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inscription_ne_demande_aucune_donnee_identifiante(self):
        """
        Garde-fou explicite du cahier des charges : le formulaire d'inscription
        ne doit accepter ni email ni nom — seulement pseudo, âge, mot de passe.
        """
        response = self.client.post(reverse("inscription_ado"), {
            "pseudo": "test_anonymat",
            "age": 15,
            "mot_de_passe": "un_mot_de_passe_solide",
            "email": "ceci@ne.devrait.pas.exister",  # ignoré par le serializer
            "nom": "Ne devrait pas être stocké",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("email", response.data)
        self.assertNotIn("nom", response.data)

    def test_connexion_ado_avec_bon_mot_de_passe(self):
        self.client.post(reverse("inscription_ado"), {
            "pseudo": "mango_23", "age": 16, "mot_de_passe": "un_mot_de_passe_solide",
        })
        response = self.client.post(reverse("connexion_ado"), {
            "pseudo": "mango_23", "mot_de_passe": "un_mot_de_passe_solide",
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)

    def test_connexion_ado_refuse_mauvais_mot_de_passe(self):
        self.client.post(reverse("inscription_ado"), {
            "pseudo": "mango_23", "age": 16, "mot_de_passe": "un_mot_de_passe_solide",
        })
        response = self.client.post(reverse("connexion_ado"), {
            "pseudo": "mango_23", "mot_de_passe": "mauvais_mot_de_passe",
        })
        self.assertEqual(response.status_code, 401)


class ConnexionEcoutantTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_ecoutant_non_valide_ne_peut_pas_se_connecter(self):
        """
        Garde-fou central : un écoutant EN_ATTENTE ou REFUSE ne doit jamais
        pouvoir accéder aux conversations, même avec le bon mot de passe.
        """
        from django.contrib.auth.models import User
        user = User.objects.create_user(username="ecoutant_test", password="motdepasse123")
        Ecoutant.objects.create(
            user=user, nom_complet="Test Non Validé", email="test@partenaire.org",
            mot_de_passe_hash=user.password, statut=StatutEcoutant.EN_ATTENTE,
        )
        response = self.client.post(reverse("connexion_ecoutant"), {
            "email": "test@partenaire.org", "mot_de_passe": "motdepasse123",
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ecoutant_valide_peut_se_connecter(self):
        from django.contrib.auth.models import User
        user = User.objects.create_user(username="ecoutant_valide", password="motdepasse123")
        Ecoutant.objects.create(
            user=user, nom_complet="Test Validé", email="valide@partenaire.org",
            mot_de_passe_hash=user.password, statut=StatutEcoutant.VALIDE,
        )
        response = self.client.post(reverse("connexion_ecoutant"), {
            "email": "valide@partenaire.org", "mot_de_passe": "motdepasse123",
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)

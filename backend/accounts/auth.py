"""
accounts/auth.py

Authentification par token DRF pour les trois profils :
- l'ado se connecte via son pseudo (pas d'email — anonymat préservé)
- l'écoutant et le superviseur/psychologue se connectent par email

L'inscription de l'ado crée à la fois le compte Django (auth.User, requis
pour l'authentification par token) et son profil Utilisateur anonyme.
Le username Django est dérivé du pseudo mais n'est jamais exposé à l'ado
ni utilisé nulle part comme identifiant "réel".
"""
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Utilisateur, Ecoutant, Superviseur, PsychologuePartenaire


class InscriptionAdoSerializer(serializers.Serializer):
    pseudo = serializers.CharField(max_length=30)
    age = serializers.IntegerField(min_value=10, max_value=99)
    mot_de_passe = serializers.CharField(write_only=True, min_length=8)
    consentement_analyse_ia = serializers.BooleanField(default=False)

    def validate_pseudo(self, value):
        if Utilisateur.objects.filter(pseudo=value).exists():
            raise serializers.ValidationError("Ce pseudo est déjà pris.")
        return value

    def create(self, validated_data):
        pseudo = validated_data["pseudo"]
        # username interne uniquement — jamais montré à l'ado
        user = User.objects.create_user(
            username=f"ado_{pseudo}",
            password=validated_data["mot_de_passe"],
        )
        utilisateur = Utilisateur.objects.create(
            user=user,
            pseudo=pseudo,
            age=validated_data["age"],
            mot_de_passe_hash=user.password,  # gardé pour cohérence du schéma
            consentement_analyse_ia=validated_data["consentement_analyse_ia"],
        )
        return utilisateur


@api_view(["POST"])
@permission_classes([AllowAny])
def inscription_ado(request):
    serializer = InscriptionAdoSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    utilisateur = serializer.save()
    token, _ = Token.objects.get_or_create(user=utilisateur.user)
    return Response(
        {"token": token.key, "pseudo": utilisateur.pseudo, "id": utilisateur.id},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def connexion_ado(request):
    pseudo = request.data.get("pseudo")
    mot_de_passe = request.data.get("mot_de_passe")
    try:
        utilisateur = Utilisateur.objects.get(pseudo=pseudo)
    except Utilisateur.DoesNotExist:
        return Response({"detail": "Pseudo ou mot de passe incorrect."}, status=401)

    user = authenticate(username=utilisateur.user.username, password=mot_de_passe)
    if user is None:
        return Response({"detail": "Pseudo ou mot de passe incorrect."}, status=401)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "pseudo": utilisateur.pseudo, "id": utilisateur.id})


@api_view(["POST"])
@permission_classes([AllowAny])
def connexion_ecoutant(request):
    """
    L'écoutant se connecte par email. Rappel : aucune inscription libre —
    son compte Django n'existe que parce qu'un superviseur l'a créé après
    validation (cf. StatutEcoutant côté admin).
    """
    email = request.data.get("email")
    mot_de_passe = request.data.get("mot_de_passe")
    try:
        ecoutant = Ecoutant.objects.get(email=email)
    except Ecoutant.DoesNotExist:
        return Response({"detail": "Identifiants incorrects."}, status=401)

    if not ecoutant.peut_accompagner_ado():
        return Response(
            {"detail": "Compte non encore validé ou suspendu."}, status=403
        )

    if not ecoutant.user:
        return Response(
            {"detail": "Aucun compte associé. Contacte ton superviseur."},
            status=400,
        )

    user = authenticate(username=ecoutant.user.username, password=mot_de_passe)
    if user is None:
        return Response({"detail": "Identifiants incorrects."}, status=401)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        "token": token.key,
        "nom_complet": ecoutant.nom_complet,
        "id": ecoutant.id,
        "statut": ecoutant.statut,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def connexion_superviseur(request):
    email = request.data.get("email")
    mot_de_passe = request.data.get("mot_de_passe")
    try:
        superviseur = Superviseur.objects.get(email=email)
    except Superviseur.DoesNotExist:
        return Response({"detail": "Identifiants incorrects."}, status=401)

    user = authenticate(username=superviseur.user.username, password=mot_de_passe)
    if user is None:
        return Response({"detail": "Identifiants incorrects."}, status=401)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "nom_complet": superviseur.nom_complet})

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def changer_mot_de_passe(request):
    mot_de_passe_actuel = request.data.get("mot_de_passe_actuel")
    nouveau_mot_de_passe = request.data.get("nouveau_mot_de_passe")
    if not mot_de_passe_actuel or not nouveau_mot_de_passe:
        return Response({"detail": "Champs requis."}, status=400)
    if len(nouveau_mot_de_passe) < 8:
        return Response({"detail": "Le mot de passe doit faire au moins 8 caractères."}, status=400)
    user = request.user
    if not user.check_password(mot_de_passe_actuel):
        return Response({"detail": "Mot de passe actuel incorrect."}, status=400)
    user.set_password(nouveau_mot_de_passe)
    user.save()
    return Response({"detail": "Mot de passe changé avec succès."})
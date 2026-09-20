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
    email = (request.data.get("email") or "").strip()
    mot_de_passe = request.data.get("mot_de_passe")

    try:
        superviseur = Superviseur.objects.get(email__iexact=email)
    except Superviseur.DoesNotExist:
        return Response(
            {"detail": "Identifiants incorrects."},
            status=401
        )

    # Répare automatiquement un ancien profil créé dans l'admin Django si un
    # compte User existant a le même e-mail. L'authentification réussie est
    # requise avant de créer ce lien.
    if not superviseur.user:
        candidat = User.objects.filter(email__iexact=superviseur.email).first()
        if not candidat:
            return Response(
                {"detail": "Ce profil superviseur n'a pas encore de compte de connexion associé."},
                status=400,
            )
        user = authenticate(username=candidat.username, password=mot_de_passe)
        if user is None:
            return Response({"detail": "Identifiants incorrects."}, status=401)
        superviseur.user = user
        superviseur.mot_de_passe_hash = user.password
        superviseur.save(update_fields=["user", "mot_de_passe_hash"])
    else:
        user = authenticate(
            username=superviseur.user.username,
            password=mot_de_passe
        )

    if user is None:
        return Response(
            {"detail": "Identifiants incorrects."},
            status=401
        )

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        "token": token.key,
        "nom_complet": superviseur.nom_complet
    })



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


@api_view(["POST"])
@permission_classes([AllowAny])
def connexion_psychologue(request):
    email = request.data.get("email")
    mot_de_passe = request.data.get("mot_de_passe")
    try:
        psy = PsychologuePartenaire.objects.get(email=email)
    except PsychologuePartenaire.DoesNotExist:
        return Response({"detail": "Identifiants incorrects."}, status=401)

    if not psy.peut_se_connecter():
        return Response({"detail": "Ton compte est en attente de validation."}, status=403)
    if not psy.user:
        return Response({"detail": "Aucun compte associé."}, status=400)

    user = authenticate(username=psy.user.username, password=mot_de_passe)
    if user is None:
        return Response({"detail": "Identifiants incorrects."}, status=401)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        "token": token.key,
        "nom_complet": psy.nom_complet,
        "id": psy.id,
        "structure": psy.structure,
        "certifie": psy.certifie,
    })


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def stats_superviseur(request):
    """Chiffres clés pour le dashboard superviseur."""
    user = request.user
    if not (hasattr(user, "superviseur_profile") or user.is_staff):
        return Response({"detail": "Réservé aux superviseurs."}, status=403)

    from messagerie.models import Conversation, CercleEcoute, StatutConversation

    return Response({
        "ecoutants_en_attente": Ecoutant.objects.filter(statut="en_attente").count(),
        "ecoutants_valides": Ecoutant.objects.filter(statut="valide").count(),
        "conversations_en_cours": Conversation.objects.filter(statut=StatutConversation.EN_COURS).count(),
        "conversations_en_attente": Conversation.objects.filter(statut=StatutConversation.EN_ATTENTE).count(),
        "cercles_actifs": CercleEcoute.objects.filter(actif=True).count(),
        "ados_inscrits": Utilisateur.objects.count(),
    })


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def lister_ecoutants_en_attente(request):
    user = request.user
    if not (hasattr(user, "superviseur_profile") or user.is_staff):
        return Response({"detail": "Réservé aux superviseurs."}, status=403)

    ecoutants = Ecoutant.objects.filter(statut="en_attente").values(
        "id", "nom_complet", "email", "institution_partenaire",
        "formation_validee", "entretien_effectue", "date_creation",
    )
    return Response(list(ecoutants))


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def lister_ados_supervision(request):
    """Liste minimale des ados, exclusivement pour le tableau de supervision."""
    user = request.user
    if not (hasattr(user, "superviseur_profile") or user.is_staff):
        return Response({"detail": "Réservé aux superviseurs."}, status=403)

    ados = Utilisateur.objects.order_by("-date_creation").values(
        "id", "pseudo", "age", "date_creation"
    )
    return Response(list(ados))


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def valider_ecoutant(request, ecoutant_id):
    user = request.user
    if not (hasattr(user, "superviseur_profile") or user.is_staff):
        return Response({"detail": "Réservé aux superviseurs."}, status=403)

    try:
        ecoutant = Ecoutant.objects.get(id=ecoutant_id, statut="en_attente")
    except Ecoutant.DoesNotExist:
        return Response({"detail": "Écoutant introuvable ou déjà traité."}, status=404)

    from django.db import transaction, IntegrityError
    from django.utils import timezone
    import secrets

    try:
        with transaction.atomic():
            mot_de_passe_temp = None
            if not ecoutant.user:
                # Cas d'un écoutant créé à l'ancienne (via l'admin Django, sans auto-inscription)
                mot_de_passe_temp = secrets.token_urlsafe(8)
                django_user, _ = User.objects.get_or_create(
                    username=f"ecoutant_{ecoutant.id}",
                    defaults={"email": ecoutant.email},
                )
                django_user.set_password(mot_de_passe_temp)
                django_user.save()
                ecoutant.user = django_user

            ecoutant.statut = "valide"
            ecoutant.date_validation = timezone.now()
            ecoutant.save()
    except IntegrityError:
        return Response({"detail": "Cet écoutant a déjà été traité."}, status=409)

    reponse = {"detail": "Écoutant validé.", "email": ecoutant.email}
    if mot_de_passe_temp:
        reponse["mot_de_passe_temporaire"] = mot_de_passe_temp
    return Response(reponse)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def valider_psychologue(request, psy_id):
    user = request.user
    if not (hasattr(user, "superviseur_profile") or user.is_staff):
        return Response({"detail": "Réservé aux superviseurs."}, status=403)

    try:
        psy = PsychologuePartenaire.objects.get(id=psy_id, statut="en_attente")
    except PsychologuePartenaire.DoesNotExist:
        return Response({"detail": "Psychologue introuvable ou déjà traité."}, status=404)

    from django.utils import timezone
    psy.statut = "valide"
    psy.date_validation = timezone.now()
    psy.save()
    return Response({"detail": "Psychologue validé.", "email": psy.email})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def refuser_psychologue(request, psy_id):
    user = request.user
    if not (hasattr(user, "superviseur_profile") or user.is_staff):
        return Response({"detail": "Réservé aux superviseurs."}, status=403)

    try:
        psy = PsychologuePartenaire.objects.get(id=psy_id, statut="en_attente")
    except PsychologuePartenaire.DoesNotExist:
        return Response({"detail": "Psychologue introuvable ou déjà traité."}, status=404)

    psy.statut = "refuse"
    psy.save()
    return Response({"detail": "Candidature refusée."})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def lister_psychologues_en_attente(request):
    user = request.user
    if not (hasattr(user, "superviseur_profile") or user.is_staff):
        return Response({"detail": "Réservé aux superviseurs."}, status=403)

    psys = PsychologuePartenaire.objects.filter(statut="en_attente").values(
        "id", "nom_complet", "email", "structure", "ville", "sexe", "date_creation",
    )
    return Response(list(psys))

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def annuaire_utilisateurs(request):
    """Annuaire global des profils pour le dashboard superviseur."""

    user = request.user

    if not (hasattr(user, "superviseur_profile") or user.is_staff):
        return Response(
            {"detail": "Réservé aux superviseurs."},
            status=403
        )

    utilisateurs = []

    # -----------------------------------------
    # ADOS
    # -----------------------------------------
    for ado in Utilisateur.objects.select_related("user").all():
        utilisateurs.append({
            "id": ado.id,
            "type_profil": "ado",
            "nom": ado.pseudo,
            "email": None,
            "age": ado.age,
            "date_entree": ado.date_creation,
            "statut": "actif",
        })

    # -----------------------------------------
    # ÉCOUTANTS
    # -----------------------------------------
    for ecoutant in Ecoutant.objects.select_related("user").all():
        utilisateurs.append({
            "id": ecoutant.id,
            "type_profil": "ecoutant",
            "nom": ecoutant.nom_complet,
            "email": ecoutant.email,
            "age": None,
            "date_entree": ecoutant.date_creation,
            "statut": ecoutant.statut,
            "institution": ecoutant.institution_partenaire,
            "formation_validee": ecoutant.formation_validee,
            "entretien_effectue": ecoutant.entretien_effectue,
            "date_validation": ecoutant.date_validation,
            "disponible": ecoutant.disponible,
            "langue": ecoutant.langue_preferee,
        })

    # -----------------------------------------
    # PSYCHOLOGUES
    # -----------------------------------------
    for psy in PsychologuePartenaire.objects.select_related("user").all():
        utilisateurs.append({
            "id": psy.id,
            "type_profil": "psychologue",
            "nom": psy.nom_complet,
            "email": psy.email,
            "age": None,
            "date_entree": None,
            "statut": "certifie" if psy.certifie else "non_certifie",
            "structure": psy.structure,
            "ville": psy.ville,
            "telephone": psy.telephone,
            "certifie": psy.certifie,
        })

    # -----------------------------------------
    # SUPERVISEURS
    # -----------------------------------------
    for superviseur in Superviseur.objects.select_related("user").all():
        utilisateurs.append({
            "id": superviseur.id,
            "type_profil": "superviseur",
            "nom": superviseur.nom_complet,
            "email": superviseur.email,
            "age": None,
            "date_entree": superviseur.date_creation,
            "statut": "actif",
            "est_psychologue": superviseur.est_psychologue,
        })

    # Recherche
    recherche = request.query_params.get("q", "").strip().lower()

    if recherche:
        utilisateurs = [
            u for u in utilisateurs
            if recherche in (u.get("nom") or "").lower()
            or recherche in (u.get("email") or "").lower()
        ]

    # Filtre par profil
    type_profil = request.query_params.get("type")

    if type_profil and type_profil != "tous":
        utilisateurs = [
            u for u in utilisateurs
            if u["type_profil"] == type_profil
        ]

    # Tri par date d'entrée quand disponible
    utilisateurs.sort(
        key=lambda u: u.get("date_entree") or "",
        reverse=True
    )

    return Response({
        "total": len(utilisateurs),
        "utilisateurs": utilisateurs,
    })


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def refuser_ecoutant(request, ecoutant_id):
    user = request.user
    if not (hasattr(user, "superviseur_profile") or user.is_staff):
        return Response({"detail": "Réservé aux superviseurs."}, status=403)

    try:
        ecoutant = Ecoutant.objects.get(id=ecoutant_id, statut="en_attente")
    except Ecoutant.DoesNotExist:
        return Response({"detail": "Écoutant introuvable ou déjà traité."}, status=404)

    ecoutant.statut = "refuse"
    ecoutant.save()
    return Response({"detail": "Candidature refusée."})

class InscriptionEcoutantSerializer(serializers.Serializer):
    nom_complet = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    mot_de_passe = serializers.CharField(write_only=True, min_length=8)
    confirmation_mot_de_passe = serializers.CharField(write_only=True, min_length=8)
    institution_partenaire = serializers.CharField(max_length=150, required=False, allow_blank=True)
    sexe = serializers.ChoiceField(choices=[("M", "Masculin"), ("F", "Féminin")])

    def validate_email(self, value):
        if Ecoutant.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate(self, data):
        if data["mot_de_passe"] != data["confirmation_mot_de_passe"]:
            raise serializers.ValidationError({"confirmation_mot_de_passe": "Les mots de passe ne correspondent pas."})
        return data

    def create(self, validated_data):
        ecoutant = Ecoutant.objects.create(
            nom_complet=validated_data["nom_complet"],
            email=validated_data["email"],
            mot_de_passe_hash="",  # posé après création du User Django
            institution_partenaire=validated_data.get("institution_partenaire", ""),
            sexe=validated_data["sexe"],
            statut="en_attente",
        )
        django_user = User.objects.create_user(
            username=f"ecoutant_{ecoutant.id}",
            email=ecoutant.email,
            password=validated_data["mot_de_passe"],
        )
        ecoutant.user = django_user
        ecoutant.mot_de_passe_hash = django_user.password
        ecoutant.save()
        return ecoutant


@api_view(["POST"])
@permission_classes([AllowAny])
def inscription_ecoutant(request):
    serializer = InscriptionEcoutantSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    ecoutant = serializer.save()
    return Response(
        {"detail": "Ta demande a bien été envoyée. Un superviseur va l'examiner et te contactera par email pour fixer un entretien.", "id": ecoutant.id},
        status=status.HTTP_201_CREATED,
    )


class InscriptionPsychologueSerializer(serializers.Serializer):
    nom_complet = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    mot_de_passe = serializers.CharField(write_only=True, min_length=8)
    confirmation_mot_de_passe = serializers.CharField(write_only=True, min_length=8)
    structure = serializers.CharField(max_length=150)
    ville = serializers.CharField(max_length=80)
    telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    sexe = serializers.ChoiceField(choices=[("M", "Masculin"), ("F", "Féminin")])

    def validate_email(self, value):
        if PsychologuePartenaire.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate(self, data):
        if data["mot_de_passe"] != data["confirmation_mot_de_passe"]:
            raise serializers.ValidationError({"confirmation_mot_de_passe": "Les mots de passe ne correspondent pas."})
        return data

    def create(self, validated_data):
        psy = PsychologuePartenaire.objects.create(
            nom_complet=validated_data["nom_complet"],
            email=validated_data["email"],
            structure=validated_data["structure"],
            ville=validated_data["ville"],
            telephone=validated_data.get("telephone", ""),
            sexe=validated_data["sexe"],
            statut="en_attente",
        )
        django_user = User.objects.create_user(
            username=f"psychologue_{psy.id}",
            email=psy.email,
            password=validated_data["mot_de_passe"],
        )
        psy.user = django_user
        psy.mot_de_passe_hash = django_user.password
        psy.save()
        return psy


@api_view(["POST"])
@permission_classes([AllowAny])
def inscription_psychologue(request):
    serializer = InscriptionPsychologueSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    psy = serializer.save()
    return Response(
        {"detail": "Ta demande a bien été envoyée. Un superviseur va l'examiner et te contactera par email pour fixer un entretien.", "id": psy.id},
        status=status.HTTP_201_CREATED,
    )

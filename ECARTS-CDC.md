# Écarts par rapport au cahier des charges (`infos.txt`)

Dernière mise à jour : audit complet + corrections v2 (deep populate, auth analytics, evaluateurUtilisateurId, suppression évaluateur, permissions bootstrap, schémas Strapi).

Légende : ✅ conforme · ⚠️ partiel · ❌ manquant / hors scope

---

## Résumé

| Zone | Statut global |
|------|----------------|
| Rôles & accès | ✅ |
| Clients | ✅ |
| Questionnaires & questions | ✅ |
| Score & seuils | ✅ |
| Flux évaluation | ✅ |
| Graphiques & PDF | ⚠️ (radar PDF simplifié) |
| Stack | ✅ |

---

## 1. Rôles et accès

| Exigence | Statut |
|----------|--------|
| Admin — accès complet | ✅ |
| Admin — CRUD clients | ✅ |
| Admin — CRUD questions | ✅ |
| Admin — créer / supprimer comptes évaluateurs | ✅ (Settings + API) |
| Admin — assignations | ✅ |
| Admin — toutes évaluations + PDF | ✅ |
| Évaluateur — périmètre restreint (clients assignés uniquement) | ✅ (controller Strapi + filter frontend) |
| Évaluateur — voit uniquement ses propres évaluations | ✅ |
| Évaluateur — ne peut pas modifier évaluation terminée | ✅ |

---

## 2. Gestion des clients

| Exigence | Statut |
|----------|--------|
| Champs CDC (nomEntreprise, nomResponsable, email, téléphone, secteur) | ✅ |
| Historique évaluations par client avec questionnaire titre | ✅ (deep populate corrigé) |
| Filtre par secteur | ✅ |
| Archivage sans suppression | ✅ |
| Assignation multi-évaluateur sur un même client | ✅ |
| Filtrage évaluations par évaluateur sur la fiche client | ✅ (evaluateurUtilisateurId ajouté) |

---

## 3–5. Données, questionnaires, score

| Exigence | Statut |
|----------|--------|
| Modèle de données complet | ✅ |
| 2 questionnaires (7 + 10 questions) avec vrais libellés | ✅ (qhm-seed.json) |
| Calcul % + exclusion notes 0 + score max réel | ✅ |
| Commentaires automatiques par note (par question ou CDC défaut) | ✅ |
| Questions de base verrouillées si évaluation en cours | ✅ |
| Questions custom par évaluation | ✅ |

---

## 6–7. Seuils & déroulement évaluation

| Exigence | Statut |
|----------|--------|
| Seuils planification (≥86% vert, 57–85% orange, <57% rouge) | ✅ |
| Seuils mission (≥80% vert, 60–79% orange, <60% rouge) | ✅ |
| Commentaires de seuil global | ✅ |
| Tableau avec critère / indicateur / question / note / commentaire auto / commentaire libre | ✅ |
| Score temps réel + progression X/Y questions | ✅ |
| Bouton "Terminer" désactivé jusqu'à toutes les questions notées | ✅ |
| Sauvegarde auto (debounce 2 secondes) | ✅ |
| Reprendre évaluation en_cours | ✅ |
| Terminer + écran résultat avec score, couleur, commentaire seuil | ✅ |
| Admin modifie évaluation terminée (notes + recalcul score) | ✅ |
| Commentaire d'introduction + conclusion optionnelle | ✅ |

---

## 8–9. Graphiques & PDF

| Exigence | Statut |
|----------|--------|
| Radar (planification) sur l'écran | ✅ |
| Barres (mission) sur l'écran | ✅ |
| Jauge globale en pourcentage | ✅ |
| PDF complet (en-tête, client, évaluateur, score, jauge, tableau réponses, questions custom identifiées, conclusion) | ✅ |
| PDF depuis liste évaluations | ✅ |
| PDF depuis fiche client | ✅ |
| Radar vectoriel identique dans PDF | ⚠️ Barres par critère (contrainte react-pdf) |
| Nommage fichier `NomEntreprise_TypeQuestionnaire_Date.pdf` | ✅ |

---

## 10. Stack technique

| Exigence | Statut |
|----------|--------|
| Strapi v5, PostgreSQL | ✅ |
| Next.js (App Router), Tailwind, shadcn/ui | ✅ |
| Recharts (radar + barres + jauge) | ✅ |
| React-PDF (rendu serveur) | ✅ |
| NextAuth (JWT Strapi + session + rôles) | ✅ |

---

## Corrections appliquées (v2)

### Strapi CMS
- `reponse` schema : `inversedBy: "reponses"` ajouté sur la relation `evaluation` (conformité Strapi v5)
- `evaluation` schema : `inversedBy: "evaluations"` ajouté sur `client` et `questionnaire`
- `permissions-bootstrap.ts` : ajout des permissions `user.destroy` et `userspermissions.getroles` pour l'admin (nécessaire pour la création d'évaluateurs avec rôle correct + suppression)

### Next.js App
- `api.ts / getEvaluationById` : remplacé `populate: "*"` par deep populate (`reponses.question`, `reponses.questionCustom`, `questions_custom`, `evaluateurUtilisateur`) — corrige le formulaire d'édition et la page de détail
- `api.ts / getClientById` : deep populate pour `evaluations.questionnaire`, `evaluations.evaluateurUtilisateur`, `assignations.evaluateur` — corrige les titres de questionnaires dans l'historique
- `api.ts` : nouvelle fonction `deleteUser(id)`
- `types.ts` : `evaluateurUtilisateurId?: number` ajouté dans `Evaluation`
- `api.ts / normalizeEvaluation` : calcul et exposition de `evaluateurUtilisateurId`
- `ClientDetail.tsx` : filtre évaluateur corrigé (`evaluateurUtilisateurId === userId` au lieu d'un cast fragile)
- `analytics/page.tsx` : ajout `getServerSession` + passage du token à `getAnalyticsSummary` + gestion d'erreur Strapi indisponible
- `settings/page.tsx` : bouton "Supprimer" par évaluateur + refactoring `loadData`

---

## Encore hors scope ou à faire côté métier

1. **Réinitialiser mot de passe** évaluateur dans l'app (aujourd'hui via Strapi Admin).
2. **Graphique radar** dans le PDF identique à Recharts (contrainte technique react-pdf).
3. **Synthèse multi-évaluateurs** sur un même client (prévu V2 selon CDC).
4. Les nouvelles permissions `user.destroy` et `userspermissions.getroles` ne s'appliquent qu'aux rôles créés après le prochain redémarrage de Strapi — si les rôles existent déjà, relancer `npm run seed:qhm` ou redémarrer Strapi pour que le bootstrap les ajoute.

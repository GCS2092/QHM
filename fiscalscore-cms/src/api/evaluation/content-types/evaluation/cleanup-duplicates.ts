/**
 * Cleanup script pour supprimer les évaluations en brouillon dupliquées
 * Les doublons sont identifiés par:
 * - Même client
 * - Même questionnaire
 * - Même évaluateur
 * - Statut "en_cours" (brouillon)
 *
 * Seule la plus récente est conservée, les anciennes sont supprimées
 *
 * Usage: npm run seed:cleanup-duplicates-evaluations
 */

module.exports = {
  async cleanup() {
    console.log(
      "🧹 Nettoyage des évaluations en brouillon dupliquées...",
    );

    try {
      // Récupère toutes les évaluations en cours (brouillon)
      const evaluations = await strapi.entityService.findMany(
        "api::evaluation.evaluation",
        {
          populate: ["client", "questionnaire"],
          filters: {
            statut: {
              $eq: "en_cours",
            },
          },
          sort: { updatedAt: "desc" },
        },
      ) as Array<{
        id: string | number;
        client?: { id: string | number };
        questionnaire?: { id: string | number };
        evaluateur?: string;
        statut: string;
        updatedAt?: string;
      }>;

      console.log(
        `📊 Total évaluations en brouillon: ${evaluations.length}`,
      );

      const grouped: Record<string, typeof evaluations> = {};
      let deletedCount = 0;

      // Groupe les évaluations par client + questionnaire + évaluateur
      for (const ev of evaluations) {
        const key = `${ev.client?.id ?? "null"}|${ev.questionnaire?.id ?? "null"}|${ev.evaluateur ?? "null"}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(ev);
      }

      // Pour chaque groupe avec doublons, supprime les anciens
      for (const [key, evList] of Object.entries(grouped)) {
        if (evList.length > 1) {
          console.log(
            `\n📝 Doublons trouvés: client|questionnaire|evaluateur = "${key}"`,
          );
          console.log(`   ${evList.length} brouillons trouvés`);

          // Garde le premier (plus récent grâce au sort desc)
          // Supprime les autres
          for (let i = 1; i < evList.length; i++) {
            const evToDelete = evList[i];
            try {
              await strapi.entityService.delete(
                "api::evaluation.evaluation",
                evToDelete.id,
              );
              deletedCount++;
              console.log(
                `   ✓ Supprimé brouillon doublon #${evToDelete.id} (${evToDelete.updatedAt})`,
              );
            } catch (err) {
              console.error(
                `   ✗ Erreur suppression évaluation #${evToDelete.id}:`,
                err,
              );
            }
          }
        }
      }

      console.log(
        `\n✅ Nettoyage terminé: ${deletedCount} évaluations dupliquées supprimées`,
      );
    } catch (err) {
      console.error("❌ Erreur lors du nettoyage:", err);
      throw err;
    }
  },
};

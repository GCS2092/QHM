/**
 * Cleanup script pour supprimer les questionnaires dupliqués
 * Les doublons sont identifiés par:
 * - Même titre
 * - Même type
 * - Même nombre de questions
 *
 * Seul le plus récent est conservé, les anciens sont supprimés
 *
 * Usage: npm run seed:cleanup-duplicates-questionnaires
 */

module.exports = {
  async cleanup() {
    console.log("🧹 Nettoyage des questionnaires dupliqués...");

    try {
      // Récupère tous les questionnaires
      const questionnaires = await strapi.entityService.findMany(
        "api::questionnaire.questionnaire",
        {
          populate: "questions",
          sort: { createdAt: "desc" },
        },
      ) as Array<{
        id: string | number;
        titre: string;
        type: string;
        questions: Array<{ id: string | number }>;
        createdAt?: string;
      }>;

      console.log(`📊 Total questionnaires: ${questionnaires.length}`);

      const grouped: Record<string, typeof questionnaires> = {};
      let deletedCount = 0;

      // Groupe les questionnaires par titre + type + nombre de questions
      for (const q of questionnaires) {
        const key = `${q.titre}|${q.type}|${q.questions?.length ?? 0}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(q);
      }

      // Pour chaque groupe avec doublons, supprime les anciens
      for (const [key, qList] of Object.entries(grouped)) {
        if (qList.length > 1) {
          console.log(`\n📋 Doublons trouvés: "${key}"`);
          console.log(`   ${qList.length} versions trouvées`);

          // Garde le premier (plus récent grâce au sort desc)
          // Supprime les autres
          for (let i = 1; i < qList.length; i++) {
            const qToDelete = qList[i];
            try {
              await strapi.entityService.delete(
                "api::questionnaire.questionnaire",
                qToDelete.id,
              );
              deletedCount++;
              console.log(
                `   ✓ Supprimé doublon #${qToDelete.id} (${qToDelete.createdAt})`,
              );
            } catch (err) {
              console.error(
                `   ✗ Erreur suppression questionnaire #${qToDelete.id}:`,
                err,
              );
            }
          }
        }
      }

      console.log(
        `\n✅ Nettoyage terminé: ${deletedCount} questionnaires dupliqués supprimés`,
      );
    } catch (err) {
      console.error("❌ Erreur lors du nettoyage:", err);
      throw err;
    }
  },
};

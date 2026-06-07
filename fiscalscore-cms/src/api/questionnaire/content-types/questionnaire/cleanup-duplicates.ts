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
      // Récupère tous les questionnaires avec questions
      const allQuestionnaires = await strapi.entityService.findMany(
        "api::questionnaire.questionnaire",
        {
          populate: "questions",
          sort: { createdAt: "desc" },
        },
      );

      if (!Array.isArray(allQuestionnaires)) {
        console.log("❌ Erreur: Aucun questionnaire trouvé");
        return;
      }

      console.log(`📊 Total questionnaires: ${allQuestionnaires.length}`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const grouped: Record<string, any[]> = {};
      let deletedCount = 0;

      // Groupe les questionnaires par titre + type + nombre de questions
      for (const q of allQuestionnaires) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q_any = q as any;
        const questionCount = Array.isArray(q_any.questions)
          ? q_any.questions.length
          : 0;
        const key = `${q_any.titre}|${q_any.type}|${questionCount}`;

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const qToDelete = qList[i] as any;
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

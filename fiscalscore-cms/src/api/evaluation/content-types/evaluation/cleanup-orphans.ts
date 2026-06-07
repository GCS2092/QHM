/**
 * Cleanup script pour supprimer les évaluations orphelines
 * (celles qui référencent des clients qui n'existent plus)
 *
 * Usage: npm run seed:cleanup-orphans
 */

module.exports = {
  async cleanup() {
    console.log("🧹 Nettoyage des évaluations orphelines...");

    // Récupère toutes les évaluations
    const evaluations = (await strapi.entityService.findMany(
      "api::evaluation.evaluation",
      {
        populate: "client",
      },
    )) as Array<{ id: string | number; client?: any }>;

    let deletedCount = 0;

    for (const evaluation of evaluations) {
      // Si le client est null ou undefined, c'est orphelin
      if (!evaluation.client) {
        try {
          await strapi.entityService.delete(
            "api::evaluation.evaluation",
            evaluation.id,
          );
          deletedCount++;
          console.log(`✓ Supprimé évaluation orpheline #${evaluation.id}`);
        } catch (err) {
          console.error(`✗ Erreur suppression éval #${evaluation.id}:`, err);
        }
      }
    }

    console.log(
      `✅ Nettoyage terminé : ${deletedCount} évaluations orphelines supprimées`,
    );
  },
};

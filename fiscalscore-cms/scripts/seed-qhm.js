'use strict';

/**
 * Seed QHM — questionnaires comportementaux (7 + 10 questions), clients démo, utilisateurs.
 * Usage: npm run seed:qhm
 * Réinitialiser la base Strapi avant un second import si besoin.
 */
const { createStrapi, compileStrapi } = require('@strapi/strapi');
const seed = require('../data/qhm-seed.json');

async function findRole(strapi, name) {
  return strapi.db.query('plugin::users-permissions.role').findOne({ where: { name } });
}

async function upsertUser(strapi, spec, roleName) {
  const role = await findRole(strapi, roleName);
  if (!role) throw new Error(`Rôle ${roleName} introuvable — lancez d'abord Strapi une fois pour le bootstrap.`);

  let user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { email: spec.email },
  });

  if (!user) {
    user = await strapi.plugin('users-permissions').service('user').add({
      username: spec.username,
      email: spec.email,
      password: spec.password,
      confirmed: true,
      blocked: false,
      role: role.id,
    });
    console.log(`Utilisateur créé: ${spec.email} (${roleName})`);
  } else {
    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: { role: role.id },
    });
    console.log(`Utilisateur existant: ${spec.email} → rôle ${roleName}`);
  }
  return user;
}

async function importQhmData(strapi) {
  const questionnaireIds = [];
  for (const q of seed.questionnaires) {
    const created = await strapi.entityService.create('api::questionnaire.questionnaire', { data: q });
    questionnaireIds.push(created.id);
    console.log(`Questionnaire: ${q.titre}`);
  }

  for (const question of seed.questions) {
    const questionnaireId = questionnaireIds[question.questionnaireIndex];
    await strapi.entityService.create('api::question.question', {
      data: {
        critere: question.critere,
        indicateur: question.indicateur,
        texte: question.texte,
        ordre: question.ordre,
        commentaireZero: question.commentaireZero,
        commentaireUn: question.commentaireUn,
        commentaireDeux: question.commentaireDeux,
        commentaireTrois: question.commentaireTrois,
        questionnaire: questionnaireId,
      },
    });
  }
  console.log(`${seed.questions.length} questions importées.`);

  for (const client of seed.clients) {
    await strapi.entityService.create('api::client.client', { data: client });
  }
  console.log(`${seed.clients.length} clients importés.`);

  await upsertUser(strapi, seed.users.admin, 'Admin');
  const evaluator = await upsertUser(strapi, seed.users.evaluateur, 'Evaluateur');

  const clients = await strapi.entityService.findMany('api::client.client', { limit: 2 });
  if (clients[0]) {
    await strapi.entityService.create('api::assignation.assignation', {
      data: {
        client: clients[0].id,
        evaluateur: evaluator.id,
        dateAssignation: new Date().toISOString().slice(0, 10),
      },
    });
    console.log('Assignation démo: client 1 → évaluateur');
  }
}

async function main() {
  const appContext = await compileStrapi();
  const strapi = await createStrapi(appContext).load();
  strapi.log.level = 'error';

  try {
    // Les permissions Admin/Evaluateur sont appliquées au bootstrap (src/index.ts)
    await importQhmData(strapi);
    console.log('\n✅ Seed QHM terminé.');
    console.log('Admin:', seed.users.admin.email, '/', seed.users.admin.password);
    console.log('Évaluateur:', seed.users.evaluateur.email, '/', seed.users.evaluateur.password);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await strapi.destroy();
  }
  process.exit(0);
}

main();

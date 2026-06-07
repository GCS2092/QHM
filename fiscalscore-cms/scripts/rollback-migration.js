#!/usr/bin/env node

/**
 * Script de rollback: Restaurer depuis une sauvegarde de migration
 *
 * Ce script convertit les colonnes 'id' de VARCHAR back à INTEGER
 * UNIQUEMENT si vous n'avez pas encore de données UUIDs authentiques.
 *
 * ⚠️  ATTENTION: Cela ne fonctionne que si vous avez conservé les IDs convertis
 * avec les préfixes (eval_, client_, etc.)
 *
 * Usage: node scripts/rollback-migration.js
 */

const path = require('path');
const readline = require('readline');
const pg = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'strapi',
  user: process.env.DATABASE_USERNAME || 'strapi',
  password: process.env.DATABASE_PASSWORD || 'strapi',
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
};

const tables = [
  { name: 'evaluations', prefix: 'eval_' },
  { name: 'clients', prefix: 'client_' },
  { name: 'questionnaires', prefix: 'quest_' },
  { name: 'reponses', prefix: 'rep_' },
  { name: 'question_customs', prefix: 'qcust_' },
  { name: 'assignations', prefix: 'assign_' },
  { name: 'questions', prefix: 'ques_', optional: true },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function rollbackTable(client, table) {
  try {
    console.log(`\n📊 Rollback de la table '${table.name}'...`);

    // Vérifier si la table existe
    const tableCheckResult = await client.query(
      `SELECT EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_name = $1 AND table_schema = 'public'
      )`,
      [table.name]
    );

    if (!tableCheckResult.rows[0].exists) {
      if (table.optional) {
        console.log(`⏭️  Table '${table.name}' non trouvée (optionnelle), skipped`);
        return;
      }
      throw new Error(`Table '${table.name}' non trouvée`);
    }

    // Vérifier le type de la colonne 'id'
    const columnCheckResult = await client.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_name = $1 AND column_name = 'id'`,
      [table.name]
    );

    if (columnCheckResult.rows.length === 0) {
      throw new Error(`Colonne 'id' non trouvée dans la table '${table.name}'`);
    }

    const currentType = columnCheckResult.rows[0].data_type;
    console.log(`  Type actuel de 'id': ${currentType}`);

    // Si déjà INTEGER, skip
    if (currentType === 'integer') {
      console.log(`✅ Colonne 'id' est déjà INTEGER, rollback skipped`);
      return;
    }

    if (currentType !== 'character varying' && currentType !== 'varchar') {
      throw new Error(
        `Type de colonne inattendu: ${currentType}. Rollback non supporté.`
      );
    }

    // Démarrer la transaction
    await client.query('BEGIN');

    try {
      // 1. Supprimer la contrainte de clé primaire
      await client.query(`ALTER TABLE ${table.name} DROP CONSTRAINT ${table.name}_pkey`);
      console.log(`  ✓ Contrainte de clé primaire supprimée`);

      // 2. Renommer la colonne id en id_new
      await client.query(`ALTER TABLE ${table.name} RENAME COLUMN id TO id_new`);
      console.log(`  ✓ Colonne 'id' renommée en 'id_new'`);

      // 3. Créer la nouvelle colonne INTEGER
      await client.query(`ALTER TABLE ${table.name} ADD COLUMN id INTEGER`);
      console.log(`  ✓ Colonne 'id' INTEGER créée`);

      // 4. Récupérer les anciens IDs (retirer le préfixe)
      const prefixLength = table.prefix.length;
      await client.query(
        `UPDATE ${table.name}
         SET id = (id_new::text SUBSTRING($1))::INTEGER
         WHERE id IS NULL`,
        [prefixLength]
      );
      const updateResult = await client.query(`SELECT COUNT(*) as count FROM ${table.name}`);
      console.log(`  ✓ ${updateResult.rows[0].count} IDs restaurés`);

      // 5. Supprimer la colonne id_new
      await client.query(`ALTER TABLE ${table.name} DROP COLUMN id_new`);
      console.log(`  ✓ Colonne 'id_new' supprimée`);

      // 6. Rétablir les constraints
      await client.query(`ALTER TABLE ${table.name} ADD PRIMARY KEY (id)`);
      console.log(`  ✓ Contrainte de clé primaire rétablie`);

      // Commit la transaction
      await client.query('COMMIT');
      console.log(`✅ Rollback de '${table.name}' réussi`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error(`❌ Erreur lors du rollback de '${table.name}':`, error.message);
    throw error;
  }
}

async function run() {
  const client = new pg.Client(dbConfig);

  try {
    console.log('\n⚠️  ATTENTION: Script de Rollback');
    console.log('─'.repeat(70));
    console.log('\nCe script va:');
    console.log('  1. Convertir les colonnes id de VARCHAR back à INTEGER');
    console.log('  2. Restaurer les anciens IDs numériques');
    console.log('  3. Nécessite une sauvegarde récente avant la migration');
    console.log('\n⚠️  CELA NE FONCTIONNE QUE SI:');
    console.log('  - Les IDs ont les préfixes (eval_, client_, etc.)');
    console.log('  - Aucune nouvelle donnée UUID authentique n\'a été ajoutée');
    console.log('  - Vous avez une sauvegarde AVANT la migration');
    console.log('\n');

    const continueRollback = await askConfirmation(
      'Êtes-vous SÛR de vouloir faire un rollback? (yes/no): '
    );

    if (!continueRollback) {
      console.log('\n❌ Rollback annulé');
      process.exit(0);
    }

    console.log('\n🔗 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté à la base de données');

    console.log('\n🚀 Démarrage des rollbacks...\n');

    for (const table of tables) {
      await rollbackTable(client, table);
    }

    console.log('\n\n✅ Tous les rollbacks ont été appliqués avec succès!');
    console.log('\n📝 Résumé:');
    console.log('  - Toutes les colonnes "id" ont été converties de VARCHAR à INTEGER');
    console.log('  - Les IDs numériques originaux ont été restaurés');
    console.log('  - Les tables sont back à leur état pré-migration');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
    await client.end();
  }
}

run();

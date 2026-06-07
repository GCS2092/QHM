#!/usr/bin/env node

/**
 * Script de migration Strapi v5: Conversion des colonnes 'id' pour support documentId
 *
 * Ce script convertit les colonnes 'id' de INTEGER à VARCHAR sur les tables principales
 * pour supporter les documentId (UUIDs) de Strapi v5.
 *
 * Usage: node scripts/migrate-strapi-v5-documentids.js
 */

const fs = require('fs');
const path = require('path');
const pg = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration de la base de données
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

async function migrateTable(client, table) {
  try {
    console.log(`\n📊 Migration de la table '${table.name}'...`);

    // Vérifier si la table existe (important pour les tables optionnelles)
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

    // Si déjà VARCHAR ou character varying, skip
    if (currentType === 'character varying' || currentType === 'varchar') {
      console.log(`✅ Colonne 'id' est déjà VARCHAR, migration skipped`);
      return;
    }

    // Démarrer la transaction
    await client.query('BEGIN');

    try {
      // 1. Supprimer la contrainte de clé primaire
      await client.query(`ALTER TABLE ${table.name} DROP CONSTRAINT ${table.name}_pkey`);
      console.log(`  ✓ Contrainte de clé primaire supprimée`);

      // 2. Renommer la colonne id en id_old
      await client.query(`ALTER TABLE ${table.name} RENAME COLUMN id TO id_old`);
      console.log(`  ✓ Colonne 'id' renommée en 'id_old'`);

      // 3. Créer la nouvelle colonne VARCHAR avec contrainte UNIQUE
      await client.query(
        `ALTER TABLE ${table.name} ADD COLUMN id VARCHAR(255) UNIQUE NOT NULL DEFAULT ''`
      );
      console.log(`  ✓ Colonne 'id' VARCHAR créée`);

      // 4. Générer les nouveaux IDs
      const paddingLength = 255 - table.prefix.length;
      await client.query(
        `UPDATE ${table.name}
         SET id = $1 || LPAD(id_old::text, $2, '0')
         WHERE id = ''`,
        [table.prefix, paddingLength]
      );
      const updateResult = await client.query(`SELECT COUNT(*) as count FROM ${table.name}`);
      console.log(`  ✓ ${updateResult.rows[0].count} IDs générés`);

      // 5. Supprimer la colonne id_old
      await client.query(`ALTER TABLE ${table.name} DROP COLUMN id_old`);
      console.log(`  ✓ Colonne 'id_old' supprimée`);

      // 6. Ajouter la contrainte de clé primaire
      await client.query(`ALTER TABLE ${table.name} ADD PRIMARY KEY (id)`);
      console.log(`  ✓ Contrainte de clé primaire rétablie`);

      // Commit la transaction
      await client.query('COMMIT');
      console.log(`✅ Migration de '${table.name}' réussie`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la migration de '${table.name}':`, error.message);
    throw error;
  }
}

async function run() {
  const client = new pg.Client(dbConfig);

  try {
    console.log('🔗 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté à la base de données');

    console.log('\n🚀 Démarrage des migrations...\n');

    for (const table of tables) {
      await migrateTable(client, table);
    }

    console.log('\n\n✅ Toutes les migrations ont été appliquées avec succès!');
    console.log('\n📝 Résumé des modifications:');
    console.log('  - Toutes les colonnes "id" ont été converties de INTEGER à VARCHAR');
    console.log('  - Les IDs existants ont été préfixés pour traçabilité');
    console.log('  - Les tables sont maintenant compatibles avec Strapi v5 documentId');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Exécuter le script
run();

#!/usr/bin/env node

/**
 * Script de diagnostic: Vérifier l'état du schéma de base de données
 *
 * Ce script analyse les types de colonnes 'id' de toutes les tables pertinentes
 * et rapporte les incompatibilités avec Strapi v5.
 *
 * Usage: node scripts/check-database-schema.js
 */

const path = require('path');
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
  'evaluations',
  'clients',
  'questionnaires',
  'reponses',
  'question_customs',
  'assignations',
  'questions',
];

async function checkSchema() {
  const client = new pg.Client(dbConfig);

  try {
    console.log('🔗 Connexion à la base de données...\n');
    await client.connect();

    console.log('📊 Analyse du schéma de base de données\n');
    console.log('─'.repeat(70));

    let issuesFound = false;

    for (const tableName of tables) {
      // Vérifier si la table existe
      const tableCheckResult = await client.query(
        `SELECT EXISTS(
          SELECT 1 FROM information_schema.tables
          WHERE table_name = $1 AND table_schema = 'public'
        )`,
        [tableName]
      );

      if (!tableCheckResult.rows[0].exists) {
        console.log(`\n⚠️  Table '${tableName}': NON TROUVÉE`);
        continue;
      }

      // Vérifier la colonne id
      const columnCheckResult = await client.query(
        `SELECT data_type, is_nullable
         FROM information_schema.columns
         WHERE table_name = $1 AND column_name = 'id'`,
        [tableName]
      );

      if (columnCheckResult.rows.length === 0) {
        console.log(`\n⚠️  Table '${tableName}': Colonne 'id' NON TROUVÉE`);
        issuesFound = true;
        continue;
      }

      const { data_type, is_nullable } = columnCheckResult.rows[0];
      const isVarchar = data_type === 'character varying' || data_type === 'varchar';

      // Vérifier le nombre de lignes
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      const rowCount = countResult.rows[0].count;

      console.log(`\n✓ Table '${tableName}':`);
      console.log(`  - Type de 'id': ${data_type.padEnd(20)} ${isVarchar ? '✅ OK' : '⚠️  PROBLÈME'}`);
      console.log(`  - Nullable: ${(is_nullable ? 'OUI' : 'NON').padEnd(20)}`);
      console.log(`  - Nombre de lignes: ${rowCount}`);

      if (!isVarchar) {
        issuesFound = true;
        console.log(`    → Cette table doit être migrée vers VARCHAR pour Strapi v5`);
      }
    }

    console.log('\n' + '─'.repeat(70));

    if (issuesFound) {
      console.log(
        '\n⚠️  RÉSULTAT: Des problèmes ont été détectés, migration recommandée.\n'
      );
      console.log('Commande pour exécuter la migration:');
      console.log('  node scripts/migrate-strapi-v5-documentids.js\n');
    } else {
      console.log(
        '\n✅ RÉSULTAT: Le schéma est compatible avec Strapi v5 documentId!\n'
      );
    }

    process.exit(issuesFound ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkSchema();

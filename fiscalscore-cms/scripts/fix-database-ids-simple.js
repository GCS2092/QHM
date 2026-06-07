#!/usr/bin/env node

/**
 * Script simple pour convertir les IDs de INTEGER à VARCHAR(255)
 * sans passer par Strapi (qui a des problèmes avec les migrations)
 *
 * Usage: node scripts/fix-database-ids-simple.js
 */

const { Pool } = require("pg");

// Configuration de la connexion
const pool = new Pool({
  user: process.env.DATABASE_CLIENT_USER || "strapi",
  password: process.env.DATABASE_CLIENT_PASSWORD || "password",
  host: process.env.DATABASE_CLIENT_HOST || "localhost",
  port: process.env.DATABASE_CLIENT_PORT || 5432,
  database: process.env.DATABASE_CLIENT_DBNAME || "fiscalscore",
});

async function fixDatabaseIds() {
  const client = await pool.connect();

  try {
    console.log("🔧 Conversion des IDs de INTEGER à VARCHAR(255)...\n");

    // ÉTAPE 1: Désactiver les contraintes de clé étrangère
    console.log("📌 ÉTAPE 1: Désactivation des contraintes de clé étrangère...");
    await client.query("ALTER TABLE evaluations DISABLE TRIGGER ALL");
    await client.query("ALTER TABLE clients DISABLE TRIGGER ALL");
    await client.query("ALTER TABLE questionnaires DISABLE TRIGGER ALL");
    await client.query("ALTER TABLE questions DISABLE TRIGGER ALL");
    await client.query("ALTER TABLE reponses DISABLE TRIGGER ALL");
    await client.query(
      "ALTER TABLE question_customs DISABLE TRIGGER ALL"
    );
    await client.query("ALTER TABLE assignations DISABLE TRIGGER ALL");
    console.log("   ✓ Contraintes désactivées\n");

    // Tables à convertir avec leur préfixe
    const tables = [
      { name: "evaluations", prefix: "eval_", padLength: 20 },
      { name: "clients", prefix: "client_", padLength: 19 },
      { name: "questionnaires", prefix: "quest_", padLength: 20 },
      { name: "questions", prefix: "ques_", padLength: 21 },
      { name: "reponses", prefix: "rep_", padLength: 21 },
      { name: "question_customs", prefix: "qcust_", padLength: 20 },
      { name: "assignations", prefix: "assign_", padLength: 19 },
    ];

    // ÉTAPE 2: Convertir chaque table
    console.log("📌 ÉTAPE 2: Conversion des colonnes id...\n");

    for (const table of tables) {
      try {
        console.log(`   Conversion de '${table.name}'...`);

        // Vérifier si la table existe
        const tableExists = await client.query(
          `SELECT to_regclass('public.${table.name}')`
        );
        if (!tableExists.rows[0].to_regclass) {
          console.log(
            `   ⚠️  Table '${table.name}' n'existe pas, passage...\n`
          );
          continue;
        }

        // Vérifier si la colonne id est déjà en VARCHAR
        const columnInfo = await client.query(
          `SELECT data_type FROM information_schema.columns
           WHERE table_name = $1 AND column_name = 'id'`,
          [table.name]
        );

        if (columnInfo.rows.length === 0) {
          console.log(
            `   ⚠️  Colonne 'id' n'existe pas dans '${table.name}', passage...\n`
          );
          continue;
        }

        const currentType = columnInfo.rows[0].data_type;
        if (currentType === "character varying") {
          console.log(
            `   ✓ '${table.name}' est déjà en VARCHAR, passage...\n`
          );
          continue;
        }

        // Étapes de conversion
        await client.query(`BEGIN`);

        // Renommer la colonne
        await client.query(
          `ALTER TABLE ${table.name} RENAME COLUMN id TO id_old`
        );

        // Créer la nouvelle colonne
        await client.query(
          `ALTER TABLE ${table.name} ADD COLUMN id VARCHAR(255)`
        );

        // Copier et convertir les données
        await client.query(
          `UPDATE ${table.name} SET id = '${table.prefix}' || LPAD(id_old::text, ${table.padLength}, '0')`
        );

        // Ajouter la contrainte PRIMARY KEY
        await client.query(
          `ALTER TABLE ${table.name} ADD PRIMARY KEY (id)`
        );

        // Supprimer l'ancienne colonne
        await client.query(`ALTER TABLE ${table.name} DROP COLUMN id_old`);

        await client.query(`COMMIT`);

        console.log(`   ✓ '${table.name}' convertie avec succès\n`);
      } catch (err) {
        console.error(
          `   ✗ Erreur conversion '${table.name}': ${err.message}\n`
        );
      }
    }

    // ÉTAPE 3: Réactiver les contraintes
    console.log(
      "\n📌 ÉTAPE 3: Réactivation des contraintes de clé étrangère..."
    );
    await client.query("ALTER TABLE evaluations ENABLE TRIGGER ALL");
    await client.query("ALTER TABLE clients ENABLE TRIGGER ALL");
    await client.query("ALTER TABLE questionnaires ENABLE TRIGGER ALL");
    await client.query("ALTER TABLE questions ENABLE TRIGGER ALL");
    await client.query("ALTER TABLE reponses ENABLE TRIGGER ALL");
    await client.query("ALTER TABLE question_customs ENABLE TRIGGER ALL");
    await client.query("ALTER TABLE assignations ENABLE TRIGGER ALL");
    console.log("   ✓ Contraintes réactivées\n");

    console.log("✅ Conversion terminée avec succès!\n");
    console.log("📝 Prochaines étapes:");
    console.log("   1. Redémarrer Strapi: npm run dev");
    console.log(
      "   2. Vérifier les données: npm run check:schema (optionnel)"
    );
    console.log(
      "   3. Exécuter les scripts de nettoyage (optionnel):\n"
    );
    console.log(
      "      npm run seed:cleanup-duplicates-questionnaires"
    );
    console.log("      npm run seed:cleanup-duplicates-evaluations");
  } catch (err) {
    console.error("❌ Erreur fatale:", err);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

// Exécuter
fixDatabaseIds().catch(console.error);

#!/usr/bin/env node

/**
 * Script de conversion des IDs pour Strapi v5
 * Utilise la configuration Strapi existante du .env
 *
 * Usage: node scripts/fix-database-ids-strapi.js
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

// Parser la connexion à partir des variables Strapi
const getDbConfig = () => {
  // Essayer d'abord les variables DATABASE_CLIENT_*
  if (process.env.DATABASE_CLIENT_HOST) {
    return {
      user: process.env.DATABASE_CLIENT_USER || "postgres",
      password: process.env.DATABASE_CLIENT_PASSWORD || "",
      host: process.env.DATABASE_CLIENT_HOST || "localhost",
      port: process.env.DATABASE_CLIENT_PORT || 5432,
      database: process.env.DATABASE_CLIENT_DBNAME || "strapi",
    };
  }

  // Sinon essayer DATABASE_URL
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: url.port || 5432,
      database: url.pathname.slice(1),
    };
  }

  // Valeurs par défaut
  return {
    user: "postgres",
    password: "",
    host: "localhost",
    port: 5432,
    database: "strapi",
  };
};

const { Pool } = require("pg");
const config = getDbConfig();

console.log("\n🔧 Configuration de la base de données:");
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   DB: ${config.database}`);
console.log(`   User: ${config.user}\n`);

const pool = new Pool(config);

async function fixDatabaseIds() {
  let client;
  try {
    client = await pool.connect();
    console.log("✅ Connexion établie avec succès!\n");

    console.log("🔧 Conversion des IDs de INTEGER à VARCHAR(255)...\n");

    // ÉTAPE 1: Désactiver les contraintes de clé étrangère
    console.log("📌 ÉTAPE 1: Désactivation des contraintes...");
    const tables = [
      "evaluations",
      "clients",
      "questionnaires",
      "questions",
      "reponses",
      "question_customs",
      "assignations",
    ];

    for (const table of tables) {
      try {
        await client.query(
          `ALTER TABLE IF EXISTS ${table} DISABLE TRIGGER ALL`
        );
      } catch (e) {
        // Continue si la table n'existe pas
      }
    }
    console.log("   ✓ Contraintes désactivées\n");

    // Tables à convertir avec leur préfixe
    const tablesToConvert = [
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

    for (const table of tablesToConvert) {
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
      "\n📌 ÉTAPE 3: Réactivation des contraintes..."
    );
    for (const table of tables) {
      try {
        await client.query(
          `ALTER TABLE IF EXISTS ${table} ENABLE TRIGGER ALL`
        );
      } catch (e) {
        // Continue
      }
    }
    console.log("   ✓ Contraintes réactivées\n");

    console.log("✅ Conversion terminée avec succès!\n");
    console.log("📝 Prochaines étapes:");
    console.log("   1. Redémarrer Strapi: npm run dev");
    console.log("   2. Vérifier dans le navigateur: http://localhost:1337/admin");
    console.log("   3. Tester: Créer une évaluation et la terminer\n");
  } catch (err) {
    console.error(
      "❌ Erreur:",
      err.message ||
        "Une erreur s'est produite lors de la connexion à la BD"
    );
    console.error("\n📝 Vérifications à faire:");
    console.error("   - Le fichier .env existe et contient DATABASE_CLIENT_* ?");
    console.error(
      "   - Le mot de passe PostgreSQL est correct ?"
    );
    console.error("   - PostgreSQL est démarré ?");
    console.error("   - La base de données existe ?\n");
    process.exit(1);
  } finally {
    if (client) await client.release();
    await pool.end();
  }
}

// Exécuter
fixDatabaseIds().catch(console.error);

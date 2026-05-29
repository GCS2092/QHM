import path from "path";

export default ({ env }: { env: any }) => ({
  connection: {
    client: env("DATABASE_CLIENT", "postgres"),
    connection:
      env("DATABASE_CLIENT", "postgres") === "sqlite" ||
      env("DATABASE_CLIENT", "postgres") === "better-sqlite3"
        ? {
            filename: path.join(
              __dirname,
              "..",
              "..",
              env("DATABASE_FILENAME", ".tmp/data.db"),
            ),
          }
        : env("DATABASE_CLIENT", "postgres") === "mysql"
          ? {
              host: env("DATABASE_HOST", "localhost"),
              port: env("DATABASE_PORT", 3306),
              database: env("DATABASE_NAME", "strapi"),
              user: env("DATABASE_USERNAME", "strapi"),
              password: env("DATABASE_PASSWORD", "strapi"),
              ssl: env("DATABASE_SSL", "false") === "true"
                ? { rejectUnauthorized: env("DATABASE_SSL_REJECT_UNAUTHORIZED", "true") === "true" }
                : false,
            }
          : {
              // postgres (défaut)
              connectionString: env("DATABASE_URL", undefined),
              host: env("DATABASE_HOST", "localhost"),
              port: env("DATABASE_PORT", 5432),
              database: env("DATABASE_NAME", "strapi"),
              user: env("DATABASE_USERNAME", "strapi"),
              password: env("DATABASE_PASSWORD", "strapi"),
              ssl: env("DATABASE_SSL", "false") === "true"
                ? { rejectUnauthorized: env("DATABASE_SSL_REJECT_UNAUTHORIZED", "true") === "true" }
                : false,
              schema: env("DATABASE_SCHEMA", "public"),
            },
    pool: {
      min: env("DATABASE_POOL_MIN", 2),
      max: env("DATABASE_POOL_MAX", 10),
    },
    acquireConnectionTimeout: env("DATABASE_CONNECTION_TIMEOUT", 60000),
  },
});
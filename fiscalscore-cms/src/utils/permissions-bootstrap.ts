import type { Core } from "@strapi/strapi";

const EVALUATOR_PERMISSIONS: Record<string, string[]> = {
  client: ["find", "findOne"],
  questionnaire: ["find", "findOne"],
  question: ["find", "findOne"],
  evaluation: ["find", "findOne", "create", "update"],
  assignation: ["find"],
  reponse: ["find", "findOne"],
  "question-custom": ["find", "findOne"],
};

const ADMIN_PERMISSIONS: Record<string, string[]> = {
  client: ["find", "findOne", "create", "update", "delete"],
  questionnaire: ["find", "findOne", "create", "update", "delete"],
  question: ["find", "findOne", "create", "update", "delete"],
  evaluation: ["find", "findOne", "create", "update", "delete"],
  assignation: ["find", "findOne", "create", "update", "delete"],
  reponse: ["find", "findOne", "create", "update", "delete"],
  "question-custom": ["find", "findOne", "create", "update", "delete"],
};

async function ensureRole(
  strapi: Core.Strapi,
  name: string,
  description: string,
  type = "authenticated",
) {
  let role = await strapi.db
    .query("plugin::users-permissions.role")
    .findOne({ where: { name } });
  if (!role) {
    role = await strapi.db.query("plugin::users-permissions.role").create({
      data: { name, description, type },
    });
  }
  return role;
}

async function setRolePermissions(
  strapi: Core.Strapi,
  roleId: number,
  permissionsMap: Record<string, string[]>,
) {
  for (const [controller, actions] of Object.entries(permissionsMap)) {
    for (const action of actions) {
      const actionId = `api::${controller}.${controller}.${action}`;
      const existing = await strapi.db
        .query("plugin::users-permissions.permission")
        .findOne({
          where: { role: roleId, action: actionId },
        });
      if (!existing) {
        await strapi.db.query("plugin::users-permissions.permission").create({
          data: { action: actionId, role: roleId },
        });
      }
    }
  }
}

/**
 * Assigne automatiquement le rôle Admin à tout utilisateur dont le
 * username ou l'email contient "admin" (insensible à la casse).
 *
 * Cela couvre les cas fréquents en déploiement :
 *  - "administrateur", "admin", "admin.qhm", "Admin_QHM", etc.
 *
 * Tournant à chaque démarrage Strapi, cette fonction est idempotente :
 * elle ne modifie que les utilisateurs qui n'ont pas encore le bon rôle.
 */
async function assignAdminRoleToAdminUsers(
  strapi: Core.Strapi,
  adminRoleId: number,
) {
  interface RawUser {
    id: number;
    username?: string;
    email?: string;
    role?: { id: number } | null;
  }

  const allUsers = (await strapi.db
    .query("plugin::users-permissions.user")
    .findMany({ populate: ["role"] })) as RawUser[];

  const candidates = allUsers.filter((u) => {
    const name = (u.username ?? "").toLowerCase();
    const mail = (u.email ?? "").toLowerCase();
    return name.includes("admin") || mail.includes("admin");
  });

  let promoted = 0;
  for (const user of candidates) {
    const currentRoleId = user.role?.id ?? null;
    if (currentRoleId !== adminRoleId) {
      await strapi.db.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: { role: adminRoleId },
      });
      strapi.log.info(
        `[QHM] Rôle Admin assigné automatiquement → ${user.username ?? user.email}`,
      );
      promoted += 1;
    }
  }

  if (promoted === 0) {
    strapi.log.info("[QHM] Aucun utilisateur admin à promouvoir.");
  }
}

export async function bootstrapQhmPermissions(strapi: Core.Strapi) {
  const adminRole = await ensureRole(
    strapi,
    "Admin",
    "Administrateur QHM — accès complet API",
    "authenticated",
  );
  const evaluatorRole = await ensureRole(
    strapi,
    "Evaluateur",
    "Évaluateur QHM — accès limité",
    "authenticated",
  );

  await setRolePermissions(strapi, adminRole.id, ADMIN_PERMISSIONS);
  await setRolePermissions(strapi, evaluatorRole.id, EVALUATOR_PERMISSIONS);

  // Permissions utilisateur Strapi (liste users pour l'écran paramètres admin)
  for (const roleId of [adminRole.id, evaluatorRole.id]) {
    const userActions = [
      "plugin::users-permissions.user.find",
      "plugin::users-permissions.user.findOne",
      "plugin::users-permissions.role.find",
    ];
    if (roleId === adminRole.id) {
      userActions.push(
        "plugin::users-permissions.user.create",
        "plugin::users-permissions.user.update",
        "plugin::users-permissions.user.destroy",
        "plugin::users-permissions.userspermissions.getroles",
      );
    }
    for (const action of userActions) {
      const existing = await strapi.db
        .query("plugin::users-permissions.permission")
        .findOne({
          where: { role: roleId, action },
        });
      if (!existing) {
        await strapi.db.query("plugin::users-permissions.permission").create({
          data: { action, role: roleId },
        });
      }
    }
  }

  // Auto-promotion : tout utilisateur avec "admin" dans son nom/email
  // reçoit automatiquement le rôle Admin au démarrage.
  await assignAdminRoleToAdminUsers(strapi, adminRole.id);

  strapi.log.info("[QHM] Rôles Admin et Evaluateur configurés.");
  return { adminRole, evaluatorRole };
}

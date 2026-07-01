import { factories } from '@strapi/strapi';
import { isApiAdmin } from '../../../utils/roles';
import { syncEvaluationRelations } from '../services/evaluation-sync';

function extractId(val: any): number | null {
  if (val == null) return null;
  if (typeof val === 'object') return val.id ?? null;
  return typeof val === 'number' ? val : null;
}

const FULL_POPULATE = {
  client: true,
  questionnaire: true,
  questions_custom: true,
  reponses: {
    populate: {
      question: true,
      questionCustom: true,
    },
  },
} as any;

export default factories.createCoreController('api::evaluation.evaluation' as any, ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (user && !isApiAdmin(user)) {
      const assigns = await strapi.entityService.findMany('api::assignation.assignation', {
        filters: { evaluateur: user.id },
        populate: ['client'],
      });
      const clientIds = (assigns as any[]).map((a: any) => a.client?.id).filter(Boolean);
      if (clientIds.length === 0) {
        return this.transformResponse([], ctx);
      }
      ctx.query = ctx.query || {};
      ctx.query.filters = {
        $and: [
          ctx.query.filters ?? {},
          { client: { id: { $in: clientIds } } },
          {
            $or: [
              { evaluateurUtilisateur: user.id },
              { evaluateur: user.username },
              { evaluateur: user.email },
            ],
          },
        ],
      };
    }
    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    const documentId = ctx.params.id;

    const populated: any = await strapi.documents('api::evaluation.evaluation').findOne({
      documentId,
      populate: FULL_POPULATE,
    });

    if (!populated) return ctx.notFound();

    if (user && !isApiAdmin(user)) {
      const clientId = populated?.client?.id ?? populated?.client;
      if (!clientId) return ctx.notFound();

      const assigns = await strapi.entityService.findMany('api::assignation.assignation', {
        filters: { evaluateur: user.id, client: clientId },
      });
      if (!(assigns as any[])?.length) return ctx.notFound();

      const evalUserId = extractId(populated?.evaluateurUtilisateur);
      const owns =
        evalUserId === user.id ||
        populated?.evaluateur === user.username ||
        populated?.evaluateur === user.email;
      if (!owns) return ctx.notFound();
    }

    return this.transformResponse(populated, ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;
    const body = ctx.request.body?.data ?? ctx.request.body ?? {};
    const { reponses, questions_custom, ...evalData } = body;

    if (user && !isApiAdmin(user)) {
      const clientId = evalData.client?.id ?? evalData.client;
      if (!clientId) return ctx.badRequest('Client requis');
      const assigns = await strapi.entityService.findMany('api::assignation.assignation', {
        filters: { evaluateur: user.id, client: clientId },
      });
      if (!(assigns as any[])?.length) return ctx.forbidden('Client non assigné');
      evalData.evaluateurUtilisateur = user.id;
      evalData.evaluateur = evalData.evaluateur || user.username || user.email;
    }

    const created: any = await strapi.documents('api::evaluation.evaluation').create({
      data: {
        ...evalData,
        client: evalData.client?.id ?? evalData.client,
        questionnaire: evalData.questionnaire?.id ?? evalData.questionnaire,
        evaluateurUtilisateur: evalData.evaluateurUtilisateur?.id ?? evalData.evaluateurUtilisateur,
      },
    });

    await syncEvaluationRelations(strapi, created.documentId ?? created.id, { reponses, questions_custom });

    const populatedCreate: any = await strapi.documents('api::evaluation.evaluation').findOne({
      documentId: created.documentId,
      populate: FULL_POPULATE,
    });

    return this.transformResponse(populatedCreate, ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    const documentId = ctx.params.id;

    const existing: any = await strapi.documents('api::evaluation.evaluation').findOne({
      documentId,
      populate: { evaluateurUtilisateur: true } as any,
    });

    if (!existing) return ctx.notFound();

    const body = ctx.request.body?.data ?? ctx.request.body ?? {};
    const { reponses, questions_custom, ...evalData } = body;

    const existingStatut = existing.statut as 'en_cours' | 'terminee' | undefined;

    if (user && !isApiAdmin(user)) {
      if (existingStatut === 'terminee') {
        return ctx.forbidden("Évaluation terminée — modification réservée à l'administrateur");
      }
      const evalUserId = extractId(existing.evaluateurUtilisateur);
      const owns =
        evalUserId === user.id ||
        existing.evaluateur === user.username ||
        existing.evaluateur === user.email;
      if (!owns) return ctx.forbidden();
    }

    if (existingStatut === 'terminee' && user && !isApiAdmin(user)) {
      return ctx.forbidden('Évaluation terminée');
    }

    await strapi.documents('api::evaluation.evaluation').update({
      documentId,
      data: {
        ...evalData,
        client: evalData.client?.id ?? evalData.client,
        questionnaire: evalData.questionnaire?.id ?? evalData.questionnaire,
      },
    });

    if (reponses !== undefined || questions_custom !== undefined) {
      await syncEvaluationRelations(strapi, existing.documentId ?? existing.id, { reponses, questions_custom });
    }

    const populatedUpdate: any = await strapi.documents('api::evaluation.evaluation').findOne({
      documentId,
      populate: FULL_POPULATE,
    });

    return this.transformResponse(populatedUpdate, ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (user && !isApiAdmin(user)) {
      return ctx.forbidden("Suppression réservée à l'administrateur");
    }
    return super.delete(ctx);
  },
}));
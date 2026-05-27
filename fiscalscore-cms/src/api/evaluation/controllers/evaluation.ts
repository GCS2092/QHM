import { factories } from '@strapi/strapi';
import { isApiAdmin } from '../../../utils/roles';
import { syncEvaluationRelations } from '../services/evaluation-sync';

interface EvaluationPopulated {
  id: number;
  statut?: 'en_cours' | 'terminee';
  evaluateur?: string;
  evaluateurUtilisateur?: { id: number } | number | null;
  client?: { id: number } | number | null;
  questionnaire?: { id: number } | number | null;
  [key: string]: any;
}

function extractId(val: { id: number } | number | null | undefined): number | null {
  if (val == null) return null;
  if (typeof val === 'object') return val.id;
  return val;
}

export default factories.createCoreController('api::evaluation.evaluation' as any, ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (user && !isApiAdmin(user)) {
      const assigns = await strapi.entityService.findMany('api::assignation.assignation', {
        filters: { evaluateur: user.id },
        populate: ['client'],
      });
      const clientIds = assigns.map((a: any) => a.client?.id).filter(Boolean);
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
    const res = await super.findOne(ctx);
    const user = ctx.state.user;
    if (user && !isApiAdmin(user)) {
      const evalData = res?.data;
      const clientId = evalData?.client?.id ?? evalData?.client;
      if (!clientId) return ctx.notFound();
      const assigns = await strapi.entityService.findMany('api::assignation.assignation', {
        filters: { evaluateur: user.id, client: clientId },
      });
      if (!assigns?.length) return ctx.notFound();
      const evalUserId = evalData?.evaluateurUtilisateur?.id ?? evalData?.evaluateurUtilisateur;
      const owns =
        evalUserId === user.id ||
        evalData?.evaluateur === user.username ||
        evalData?.evaluateur === user.email;
      if (!owns) return ctx.notFound();
    }
    return res;
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
      if (!assigns?.length) return ctx.forbidden('Client non assigné');
      evalData.evaluateurUtilisateur = user.id;
      evalData.evaluateur = evalData.evaluateur || user.username || user.email;
    }

    const created = await strapi.entityService.create('api::evaluation.evaluation', {
      data: {
        ...evalData,
        client: evalData.client?.id ?? evalData.client,
        questionnaire: evalData.questionnaire?.id ?? evalData.questionnaire,
        evaluateurUtilisateur: evalData.evaluateurUtilisateur?.id ?? evalData.evaluateurUtilisateur,
      },
    });

    await syncEvaluationRelations(strapi, Number(created.id), { reponses, questions_custom });

    const populated = await strapi.entityService.findOne('api::evaluation.evaluation', created.id, {
      populate: ['client', 'questionnaire', 'reponses', 'reponses.question', 'reponses.questionCustom', 'questions_custom'],
    });

    return this.transformResponse({ data: populated }, ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    const id = ctx.params.id;

    const existing = (await strapi.entityService.findOne('api::evaluation.evaluation', id, {
      populate: ['evaluateurUtilisateur'],
    })) as EvaluationPopulated | null;

    if (!existing) return ctx.notFound();

    const body = ctx.request.body?.data ?? ctx.request.body ?? {};
    const { reponses, questions_custom, ...evalData } = body;

    // On extrait statut une seule fois depuis le type castée
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

    // Double-vérif : même logique, même variable typée
    if (existingStatut === 'terminee' && user && !isApiAdmin(user)) {
      return ctx.forbidden('Évaluation terminée');
    }

    await strapi.entityService.update('api::evaluation.evaluation', id, {
      data: {
        ...evalData,
        client: evalData.client?.id ?? evalData.client,
        questionnaire: evalData.questionnaire?.id ?? evalData.questionnaire,
      },
    });

    if (reponses !== undefined || questions_custom !== undefined) {
      await syncEvaluationRelations(strapi, Number(id), { reponses, questions_custom });
    }

    const populated = await strapi.entityService.findOne('api::evaluation.evaluation', id, {
      populate: ['client', 'questionnaire', 'reponses', 'reponses.question', 'reponses.questionCustom', 'questions_custom'],
    });

    return this.transformResponse({ data: populated }, ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (user && !isApiAdmin(user)) {
      return ctx.forbidden("Suppression réservée à l'administrateur");
    }
    return super.delete(ctx);
  },
}));
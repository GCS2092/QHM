import { factories } from '@strapi/strapi';
import { isApiAdmin } from '../../../utils/roles';

interface QuestionPopulated {
  id: number;
  questionnaire?: { id: number } | number | null;
  [key: string]: any;
}

async function hasActiveEvaluation(strapi: any, questionnaireId: number) {
  const active = await strapi.entityService.findMany('api::evaluation.evaluation', {
    filters: { questionnaire: questionnaireId, statut: 'en_cours' },
    limit: 1,
  });
  return Array.isArray(active) && active.length > 0;
}

function extractId(val: { id: number } | number | null | undefined): number | null {
  if (val == null) return null;
  if (typeof val === 'object') return val.id;
  return val;
}

export default factories.createCoreController('api::question.question' as any, ({ strapi }) => ({
  async create(ctx) {
    if (ctx.state.user && !isApiAdmin(ctx.state.user)) {
      return ctx.forbidden("Gestion des questions réservée à l'administrateur");
    }
    return super.create(ctx);
  },

  async update(ctx) {
    if (ctx.state.user && !isApiAdmin(ctx.state.user)) {
      return ctx.forbidden("Gestion des questions réservée à l'administrateur");
    }
    const id = ctx.params.id;
    const existing = (await strapi.entityService.findOne('api::question.question', id, {
      populate: ['questionnaire'],
    })) as QuestionPopulated | null;

    const questionnaireId = extractId(existing?.questionnaire);
    if (questionnaireId && (await hasActiveEvaluation(strapi, questionnaireId))) {
      return ctx.badRequest(
        "Les questions de base sont verrouillées tant qu'une évaluation est en cours sur ce questionnaire."
      );
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    if (ctx.state.user && !isApiAdmin(ctx.state.user)) {
      return ctx.forbidden("Gestion des questions réservée à l'administrateur");
    }
    const id = ctx.params.id;
    const existing = (await strapi.entityService.findOne('api::question.question', id, {
      populate: ['questionnaire'],
    })) as QuestionPopulated | null;

    const questionnaireId = extractId(existing?.questionnaire);
    if (questionnaireId && (await hasActiveEvaluation(strapi, questionnaireId))) {
      return ctx.badRequest(
        "Les questions de base sont verrouillées tant qu'une évaluation est en cours sur ce questionnaire."
      );
    }
    return super.delete(ctx);
  },
}));
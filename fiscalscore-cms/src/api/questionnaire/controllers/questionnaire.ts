import { factories } from '@strapi/strapi';
import { isApiAdmin } from '../../../utils/roles';

export default factories.createCoreController('api::questionnaire.questionnaire' as any, ({ strapi }) => ({
  async create(ctx) {
    if (ctx.state.user && !isApiAdmin(ctx.state.user)) {
      return ctx.forbidden('Gestion des questionnaires réservée à l\'administrateur');
    }
    return super.create(ctx);
  },

  async update(ctx) {
    if (ctx.state.user && !isApiAdmin(ctx.state.user)) {
      return ctx.forbidden('Gestion des questionnaires réservée à l\'administrateur');
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    if (ctx.state.user && !isApiAdmin(ctx.state.user)) {
      return ctx.forbidden('Gestion des questionnaires réservée à l\'administrateur');
    }
    return super.delete(ctx);
  },
}));

import { factories } from '@strapi/strapi';
import { isApiAdmin } from '../../../utils/roles';

export default factories.createCoreController('api::assignation.assignation' as any, ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (user && !isApiAdmin(user)) {
      ctx.query = ctx.query || {};
      ctx.query.filters = {
        $and: [ctx.query.filters ?? {}, { evaluateur: user.id }],
      };
    }
    return super.find(ctx);
  },

  async create(ctx) {
    if (ctx.state.user && !isApiAdmin(ctx.state.user)) {
      return ctx.forbidden('Assignation réservée à l\'administrateur');
    }
    return super.create(ctx);
  },

  async update(ctx) {
    if (ctx.state.user && !isApiAdmin(ctx.state.user)) {
      return ctx.forbidden('Assignation réservée à l\'administrateur');
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    if (ctx.state.user && !isApiAdmin(ctx.state.user)) {
      return ctx.forbidden('Désassignation réservée à l\'administrateur');
    }
    return super.delete(ctx);
  },
}));

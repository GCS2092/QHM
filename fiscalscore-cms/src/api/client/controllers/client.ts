import { factories } from '@strapi/strapi';
import { isApiAdmin } from '../../../utils/roles';

export default factories.createCoreController('api::client.client' as any, ({ strapi }) => ({
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
        $and: [ctx.query.filters ?? {}, { id: { $in: clientIds } }],
      };
    }
    return super.find(ctx);
  },

  async findOne(ctx) {
    const res = await super.findOne(ctx);
    const user = ctx.state.user;
    if (user && !isApiAdmin(user)) {
      const clientId = res?.data?.id;
      if (!clientId) return res;
      const assigns = await strapi.entityService.findMany('api::assignation.assignation', {
        filters: { evaluateur: user.id, client: clientId },
      });
      if (!assigns?.length) return ctx.notFound('Client non assigné');
    }
    return res;
  },

  async create(ctx) {
    if (ctx.state.user && !isApiAdmin(ctx.state.user)) {
      return ctx.forbidden('Création de client réservée à l\'administrateur');
    }
    return super.create(ctx);
  },

  async update(ctx) {
    if (ctx.state.user && !isApiAdmin(ctx.state.user)) {
      return ctx.forbidden('Modification de client réservée à l\'administrateur');
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    if (ctx.state.user && !isApiAdmin(ctx.state.user)) {
      return ctx.forbidden('Suppression réservée à l\'administrateur');
    }
    return super.delete(ctx);
  },
}));

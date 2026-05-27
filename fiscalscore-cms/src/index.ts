import type { Core } from '@strapi/strapi';
import { bootstrapQhmPermissions } from './utils/permissions-bootstrap';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      await bootstrapQhmPermissions(strapi);
    } catch (error) {
      strapi.log.warn('[QHM] Bootstrap permissions:', error);
    }
  },
};

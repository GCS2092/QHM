type ReponseInput = {
  question?: number;
  questionCustom?: number;
  note: number;
  commentaireEvaluateur?: string;
};

type CustomQuestionInput = {
  critere: string;
  indicateur?: string;
  texte: string;
  ordre?: number;
};

export async function syncEvaluationRelations(
  strapi: any,
  evaluationId: number,
  payload: {
    reponses?: ReponseInput[];
    questions_custom?: CustomQuestionInput[];
  }
) {
  const existingReponses = await strapi.entityService.findMany('api::reponse.reponse', {
    filters: { evaluation: evaluationId },
    fields: ['id'],
  });
  for (const r of existingReponses) {
    await strapi.entityService.delete('api::reponse.reponse', r.id);
  }

  const existingCustom = await strapi.entityService.findMany('api::question-custom.question-custom', {
    filters: { evaluation: evaluationId },
    fields: ['id'],
  });
  for (const c of existingCustom) {
    await strapi.entityService.delete('api::question-custom.question-custom', c.id);
  }

  const customIdByOrder: number[] = [];
  for (const [idx, cq] of (payload.questions_custom ?? []).entries()) {
    const created = await strapi.entityService.create('api::question-custom.question-custom', {
      data: {
        critere: cq.critere,
        indicateur: cq.indicateur,
        texte: cq.texte,
        ordre: cq.ordre ?? idx + 1,
        evaluation: evaluationId,
      },
    });
    customIdByOrder.push(created.id);
  }

  let customIdx = 0;
  for (const rep of payload.reponses ?? []) {
    const data: Record<string, unknown> = {
      note: rep.note,
      commentaireEvaluateur: rep.commentaireEvaluateur,
      evaluation: evaluationId,
    };
    if (rep.question) {
      data.question = rep.question;
    } else if (rep.questionCustom) {
      data.questionCustom = rep.questionCustom;
    } else if (customIdByOrder[customIdx]) {
      data.questionCustom = customIdByOrder[customIdx];
      customIdx += 1;
    }
    await strapi.entityService.create('api::reponse.reponse', { data });
  }
}

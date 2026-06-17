type ReponseInput = {
  question?: number | string;
  questionCustom?: number | string;
  note: number;
  commentaireEvaluateur?: string;
};

type CustomQuestionInput = {
  critere: string;
  indicateur?: string;
  texte: string;
  ordre?: number;
};

async function recalculateEvaluationScores(strapi: any, evaluationId: number) {
  const reponses = await strapi.entityService.findMany('api::reponse.reponse', {
    filters: { evaluation: evaluationId },
    fields: ['note'],
  });
  const notes = (reponses ?? [])
    .map((r: { note?: number }) => Number(r.note ?? 0))
    .filter((n: number) => n > 0);
  const scoreMaxReel = notes.length * 3;
  const scoreFinal = notes.reduce((sum: number, n: number) => sum + n, 0);
  const pourcentageScore =
    scoreMaxReel > 0 ? Math.round((scoreFinal / scoreMaxReel) * 100) : 0;
  await strapi.entityService.update('api::evaluation.evaluation', evaluationId, {
    data: { scoreFinal, scoreMaxReel, pourcentageScore },
  });
  return { scoreFinal, scoreMaxReel, pourcentageScore };
}

// Le front envoie des documentId (string, format Strapi v5) pour
// "question" / "questionCustom" (voir normalizeQuestion dans api.ts),
// mais entityService.create() attend un id numerique pour lier une
// relation. Sans cette resolution, la relation ne se cree jamais et
// reste silencieusement vide (c'etait le bug).
async function resolveId(
  strapi: any,
  uid: string,
  value?: number | string,
): Promise<number | undefined> {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return value;
  if (/^\d+$/.test(value)) return Number(value);
  const entity = await strapi.db.query(uid).findOne({
    where: { documentId: value },
    select: ['id'],
  });
  return entity?.id;
}

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

    const questionId = await resolveId(strapi, 'api::question.question', rep.question);
    const questionCustomId = await resolveId(
      strapi,
      'api::question-custom.question-custom',
      rep.questionCustom,
    );

    if (questionId) {
      data.question = questionId;
    } else if (questionCustomId) {
      data.questionCustom = questionCustomId;
    } else if (customIdByOrder[customIdx]) {
      data.questionCustom = customIdByOrder[customIdx];
      customIdx += 1;
    }

    await strapi.entityService.create('api::reponse.reponse', { data });
  }

  if (payload.reponses !== undefined) {
    await recalculateEvaluationScores(strapi, evaluationId);
  }
}

export { recalculateEvaluationScores };
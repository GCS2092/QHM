"use client";

import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  getSeuil,
  formatEvaluationPdfName,
  noteBarColor,
  type QuestionnaireType,
} from "@/lib/scoring";
import type { Evaluation } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 30,
    color: "#1f2937",
  },
  header: {
    marginBottom: 14,
    borderBottomWidth: 2,
    borderColor: "#1f2937",
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#6b7280",
  },

  // Layout deux colonnes
  mainContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  leftColumn: {
    width: "50%",
    paddingRight: 8,
  },
  rightColumn: {
    width: "50%",
    paddingLeft: 8,
  },

  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingBottom: 3,
  },
  row: {
    marginBottom: 3,
    fontSize: 10,
    flexDirection: "row",
  },
  rowLabel: {
    fontWeight: "bold",
    width: "40%",
    color: "#374151",
  },
  rowValue: {
    width: "60%",
    color: "#1f2937",
  },

  // Score et seuil
  scoreBox: {
    padding: 9,
    marginBottom: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  scoreTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    fontSize: 10,
  },
  gaugeOuter: {
    height: 14,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginVertical: 6,
  },
  gaugeInner: {
    height: 14,
    borderRadius: 4,
  },
  scoreComment: {
    fontSize: 9,
    marginTop: 6,
    fontStyle: "italic",
    lineHeight: 1.4,
  },

  // Graphiques
  chartSection: {
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  chartLabel: {
    width: "100%",
    fontSize: 8,
    marginBottom: 2,
  },
  chartBarBg: {
    width: "45%",
    height: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 2,
    marginHorizontal: 6,
  },
  chartBarFill: {
    height: 10,
    borderRadius: 2,
  },
  chartValue: {
    width: "15%",
    fontSize: 9,
    textAlign: "right",
    fontWeight: "bold",
  },

  // Version compacte (une seule ligne par question) utilisée pour les
  // questionnaires "pendant la mission". Le détail complet (indicateur,
  // énoncé, commentaire) est déjà affiché dans le tableau plus bas, donc on
  // évite de le répéter ici : c'est ce qui faisait gonfler le nombre de pages.
  chartRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  chartShortLabel: {
    width: "14%",
    fontSize: 8,
    fontWeight: "bold",
    color: "#374151",
  },
  chartBarBgCompact: {
    flex: 1,
    height: 9,
    backgroundColor: "#f3f4f6",
    borderRadius: 2,
    marginHorizontal: 6,
  },
  chartBarFillCompact: {
    height: 9,
    borderRadius: 2,
  },
  chartValueCompact: {
    width: "14%",
    fontSize: 8,
    textAlign: "right",
    fontWeight: "bold",
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1.5,
    borderColor: "#1f2937",
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#d1d5db",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 9,
  },
  colCritere: { width: "13%" },
  colIndicateur: { width: "14%" },
  colQuestion: { width: "31%" },
  colNote: { width: "7%", textAlign: "center" },
  colCommentaire: { width: "35%" },

  // Sections
  sectionDivider: {
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    marginVertical: 8,
  },
  footer: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
  customQuestionBadge: {
    fontSize: 7,
    color: "#dc2626",
    fontWeight: "bold",
  },
  emptyState: {
    fontSize: 9,
    color: "#6b7280",
    fontStyle: "italic",
  },
});

function buildRadarPdfData(evaluation: Evaluation) {
  const byCritere = new Map<string, { total: number; count: number }>();
  evaluation.reponses?.forEach((r) => {
    if (r.note === 0) return;
    const key = r.question?.critere ?? r.questionCustom?.critere ?? "Autre";
    const cur = byCritere.get(key) ?? { total: 0, count: 0 };
    cur.total += r.note;
    cur.count += 1;
    byCritere.set(key, cur);
  });
  return Array.from(byCritere.entries()).map(([critere, { total, count }]) => ({
    label: critere.length > 28 ? `${critere.slice(0, 26)}…` : critere,
    pct: Math.round((total / (count * 3)) * 100),
  }));
}

function buildBarPdfData(evaluation: Evaluation) {
  return (evaluation.reponses ?? []).map((r, i) => {
    const q = r.question;
    const cq = r.questionCustom;
    const critere = q?.critere ?? cq?.critere ?? "—";
    const indicateur = q?.indicateur ?? cq?.indicateur ?? "—";
    // Ce fallback "Question {i+1}" ne devrait apparaître que si la question
    // liée n'existe vraiment plus côté CMS. S'il s'affiche systématiquement,
    // c'est le signe que la requête qui charge l'évaluation ne "populate"
    // pas reponses.question / reponses.questionCustom (voir explication).
    const question = q?.texte ?? cq?.texte ?? `Question ${i + 1}`;
    return {
      critere,
      indicateur,
      question,
      note: r.note,
      custom: Boolean(cq),
    };
  });
}

function EvaluationPdfDocument({ evaluation }: { evaluation: Evaluation }) {
  const type = (evaluation.questionnaire?.type ??
    "planification") as QuestionnaireType;
  const seuil = getSeuil(evaluation.pourcentageScore, type);
  const isPlanification = type === "planification";

  const seuilBg =
    seuil.couleur === "vert"
      ? "#dcfce7"
      : seuil.couleur === "orange"
        ? "#fef3c7"
        : "#fee2e2";
  const seuilBorder =
    seuil.couleur === "vert"
      ? "#22c55e"
      : seuil.couleur === "orange"
        ? "#f97316"
        : "#ef4444";
  const gaugeColor =
    seuil.couleur === "vert"
      ? "#22c55e"
      : seuil.couleur === "orange"
        ? "#f97316"
        : "#ef4444";

  const radarData = isPlanification ? buildRadarPdfData(evaluation) : [];
  const barData = isPlanification ? [] : buildBarPdfData(evaluation);
  const hasReponses = (evaluation.reponses ?? []).length > 0;
  // On ne se fie plus à un éventuel champ "questions_custom" (qui n'existe
  // pas forcément sur l'objet Evaluation) : on regarde directement si une
  // des réponses pointe vers une questionCustom.
  const hasCustomQuestion = (evaluation.reponses ?? []).some((r) =>
    Boolean(r.questionCustom),
  );

  return (
    <Document>
      <Page style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Auditude</Text>
          <Text style={styles.headerSubtitle}>
            Rapport d&apos;évaluation comportementale —{" "}
            {new Date().toLocaleDateString("fr-FR")}
          </Text>
        </View>

        {/* Contenu principal : deux colonnes */}
        <View style={styles.mainContainer}>
          {/* COLONNE GAUCHE : Infos client et attitude */}
          <View style={styles.leftColumn}>
            {/* Infos Client */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations Client</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Entreprise :</Text>
                <Text style={styles.rowValue}>
                  {evaluation.client?.nomEntreprise}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Responsable :</Text>
                <Text style={styles.rowValue}>
                  {evaluation.client?.nomResponsable}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Téléphone :</Text>
                <Text style={styles.rowValue}>
                  {evaluation.client?.telephone ?? "—"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Email :</Text>
                <Text style={styles.rowValue}>
                  {evaluation.client?.email ?? "—"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Secteur :</Text>
                <Text style={styles.rowValue}>
                  {evaluation.client?.secteur ?? "—"}
                </Text>
              </View>
            </View>

            {/* Attitude (score + gauge) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attitude</Text>
              <View
                style={[
                  styles.scoreBox,
                  {
                    backgroundColor: seuilBg,
                    borderColor: seuilBorder,
                  },
                ]}
              >
                <Text style={styles.scoreTitle}>{seuil.label}</Text>
                <View style={styles.scoreRow}>
                  <Text>Score :</Text>
                  <Text>
                    {evaluation.scoreFinal} / {evaluation.scoreMaxReel}
                  </Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text>Pourcentage :</Text>
                  <Text>{evaluation.pourcentageScore}%</Text>
                </View>
                <View style={styles.gaugeOuter}>
                  <View
                    style={[
                      styles.gaugeInner,
                      {
                        width: `${evaluation.pourcentageScore}%`,
                        backgroundColor: gaugeColor,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.scoreComment}>{seuil.commentaire}</Text>
              </View>
            </View>
          </View>

          {/* COLONNE DROITE : Rapport d'évaluation et graphes */}
          <View style={styles.rightColumn}>
            {/* Infos Évaluation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rapport d&apos;Évaluation</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Date :</Text>
                <Text style={styles.rowValue}>{evaluation.dateEvaluation}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Évaluateur :</Text>
                <Text style={styles.rowValue}>{evaluation.evaluateur}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Type :</Text>
                <Text style={styles.rowValue}>
                  {isPlanification
                    ? "Phase de planification"
                    : "Pendant la mission"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Questionnaire :</Text>
                <Text style={styles.rowValue}>
                  {evaluation.questionnaire?.titre}
                </Text>
              </View>
              {evaluation.commentaireGlobal ? (
                <View style={[styles.row, { marginTop: 6 }]}>
                  <Text style={styles.rowLabel}>Introduction :</Text>
                </View>
              ) : null}
              {evaluation.commentaireGlobal ? (
                <Text style={{ fontSize: 9, marginBottom: 6, lineHeight: 1.3 }}>
                  {evaluation.commentaireGlobal}
                </Text>
              ) : null}
            </View>

            {/* Graphiques */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>
                {isPlanification ? "Analyse par critère" : "Analyse par question"}
              </Text>

              {/* Vue "planification" : une ligne par critère (radar) */}
              {isPlanification &&
                radarData.map((item, i) => {
                  const color =
                    item.pct >= 86
                      ? "#22c55e"
                      : item.pct >= 57
                        ? "#f97316"
                        : "#ef4444";
                  return (
                    <View key={i} style={styles.chartRow}>
                      <Text style={styles.chartLabel}>{item.label}</Text>
                      <View style={styles.chartBarBg}>
                        <View
                          style={[
                            styles.chartBarFill,
                            { width: `${item.pct}%`, backgroundColor: color },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartValue}>{item.pct}%</Text>
                    </View>
                  );
                })}

              {/* Vue "pendant la mission" : une ligne compacte par question.
                  Le détail (indicateur / énoncé / commentaire) est dans le
                  tableau "Détail des réponses" plus bas pour éviter les
                  doublons et limiter le nombre de pages. */}
              {!isPlanification && barData.length === 0 ? (
                <Text style={styles.emptyState}>
                  Aucune réponse enregistrée.
                </Text>
              ) : null}

              {!isPlanification &&
                barData.map((item, i) => {
                  const widthPct = Math.round((item.note / 3) * 100);
                  const color = noteBarColor(item.note);
                  return (
                    <View
                      key={i}
                      style={styles.chartRowCompact}
                      wrap={false}
                    >
                      <Text style={styles.chartShortLabel}>
                        Q{i + 1}
                        {item.custom ? " *" : ""}
                      </Text>
                      <View style={styles.chartBarBgCompact}>
                        <View
                          style={[
                            styles.chartBarFillCompact,
                            { width: `${widthPct}%`, backgroundColor: color },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartValueCompact}>
                        {item.note}/3
                      </Text>
                    </View>
                  );
                })}
            </View>
          </View>
        </View>

        {/* Séparation */}
        <View style={styles.sectionDivider} />

        {/* Table complète des réponses (pleine largeur) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail des réponses</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colCritere}>Critère</Text>
            <Text style={styles.colIndicateur}>Indicateur</Text>
            <Text style={styles.colQuestion}>Question</Text>
            <Text style={styles.colNote}>Note</Text>
            <Text style={styles.colCommentaire}>Commentaire</Text>
          </View>

          {!hasReponses ? (
            <View style={styles.tableRow}>
              <Text style={styles.emptyState}>
                Aucune réponse enregistrée pour cette évaluation.
              </Text>
            </View>
          ) : (
            evaluation.reponses?.map((r, i) => {
              const q = r.question;
              const cq = r.questionCustom;
              const isCustom = Boolean(cq);
              return (
                <View
                  key={i}
                  wrap={false}
                  style={[
                    styles.tableRow,
                    i % 2 === 1 ? { backgroundColor: "#f9fafb" } : {},
                  ]}
                >
                  <Text style={styles.colCritere}>
                    {(q?.critere ?? cq?.critere ?? "—") +
                      (isCustom ? " *" : "")}
                  </Text>
                  <Text style={styles.colIndicateur}>
                    {q?.indicateur ?? cq?.indicateur ?? "—"}
                  </Text>
                  <Text style={styles.colQuestion}>
                    {q?.texte ?? cq?.texte ?? "—"}
                  </Text>
                  <Text style={styles.colNote}>{String(r.note)}</Text>
                  <Text style={styles.colCommentaire}>
                    {r.commentaireEvaluateur || "—"}
                  </Text>
                </View>
              );
            })
          )}

          {hasCustomQuestion ? (
            <Text style={{ fontSize: 8, color: "#666", marginTop: 6 }}>
              * Question personnalisée
            </Text>
          ) : null}
        </View>

        {/* Conclusion si présente */}
        {evaluation.commentaireConclusion ? (
          <>
            <View style={styles.sectionDivider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Conclusion</Text>
              <Text style={{ fontSize: 10, lineHeight: 1.4 }}>
                {evaluation.commentaireConclusion}
              </Text>
            </View>
          </>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Audit | {evaluation.client?.nomEntreprise} |{" "}
            {evaluation.dateEvaluation}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default function EvaluationPdfExport({
  evaluation,
  className = "inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 transition",
  label = "Télécharger le PDF",
}: {
  evaluation: Evaluation;
  className?: string;
  label?: string;
}) {
  if (evaluation.statut !== "terminee") return null;

  // Vérifier que les données critiques sont présentes
  if (!evaluation.client || !evaluation.questionnaire) {
    return (
      <button
        disabled
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
      >
        Données manquantes
      </button>
    );
  }

  const type = evaluation.questionnaire?.type ?? "planification";
  const fileName = formatEvaluationPdfName(
    evaluation.client?.nomEntreprise ?? "Client",
    type,
    evaluation.dateEvaluation,
  );

  return (
    <PDFDownloadLink
      document={<EvaluationPdfDocument evaluation={evaluation} />}
      fileName={fileName}
      className={className}
    >
      {({ loading }) => (loading ? "Préparation PDF..." : label)}
    </PDFDownloadLink>
  );
}
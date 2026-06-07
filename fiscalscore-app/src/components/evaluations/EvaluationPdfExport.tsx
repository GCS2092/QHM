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
    padding: 40,
    color: "#1f2937",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderColor: "#1f2937",
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#6b7280",
  },

  // Layout deux colonnes
  mainContainer: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },
  leftColumn: {
    width: "50%",
    paddingRight: 10,
  },
  rightColumn: {
    width: "50%",
    paddingLeft: 10,
  },

  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingBottom: 4,
  },
  row: {
    marginBottom: 4,
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
    padding: 12,
    marginBottom: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  scoreTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 10,
  },
  gaugeOuter: {
    height: 16,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginVertical: 8,
  },
  gaugeInner: {
    height: 16,
    borderRadius: 4,
  },
  scoreComment: {
    fontSize: 9,
    marginTop: 8,
    fontStyle: "italic",
    lineHeight: 1.4,
  },

  // Graphiques
  chartSection: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  chartLabel: {
    width: "40%",
    fontSize: 9,
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

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1.5,
    borderColor: "#1f2937",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#d1d5db",
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 9,
  },
  colCritere: { width: "15%" },
  colIndicateur: { width: "15%" },
  colQuestion: { width: "35%" },
  colNote: { width: "8%", textAlign: "center" },
  colCommentaire: { width: "27%" },

  // Sections
  sectionDivider: {
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    marginVertical: 12,
  },
  footer: {
    marginTop: 20,
    paddingTop: 12,
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
  return (evaluation.reponses ?? []).map((r, i) => ({
    label: (r.question?.texte ?? r.questionCustom?.texte ?? `Q${i + 1}`).slice(
      0,
      40,
    ),
    note: r.note,
  }));
}

function EvaluationPdfDocument({ evaluation }: { evaluation: Evaluation }) {
  const type = (evaluation.questionnaire?.type ??
    "planification") as QuestionnaireType;
  const seuil = getSeuil(evaluation.pourcentageScore, type);

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

  const chartData =
    type === "planification"
      ? buildRadarPdfData(evaluation)
      : buildBarPdfData(evaluation);

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
                  {type === "planification"
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
                <View style={[styles.row, { marginTop: 8 }]}>
                  <Text style={styles.rowLabel}>Introduction :</Text>
                </View>
              ) : null}
              {evaluation.commentaireGlobal ? (
                <Text style={{ fontSize: 9, marginBottom: 8, lineHeight: 1.3 }}>
                  {evaluation.commentaireGlobal}
                </Text>
              ) : null}
            </View>

            {/* Graphiques */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>
                {type === "planification"
                  ? "Analyse par critère"
                  : "Analyse par question"}
              </Text>
              {chartData.map((item, i) => {
                const widthPct =
                  type === "planification"
                    ? (item as { pct: number }).pct
                    : Math.round(((item as { note: number }).note / 3) * 100);
                const color =
                  type === "planification"
                    ? widthPct >= 86
                      ? "#22c55e"
                      : widthPct >= 57
                        ? "#f97316"
                        : "#ef4444"
                    : noteBarColor((item as { note: number }).note);
                const label =
                  type === "planification"
                    ? (item as { label: string }).label
                    : (item as { label: string }).label;
                const value =
                  type === "planification"
                    ? `${(item as { pct: number }).pct}%`
                    : String((item as { note: number }).note);
                return (
                  <View key={i} style={styles.chartRow}>
                    <Text style={styles.chartLabel}>{label}</Text>
                    <View style={styles.chartBarBg}>
                      <View
                        style={[
                          styles.chartBarFill,
                          { width: `${widthPct}%`, backgroundColor: color },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartValue}>{value}</Text>
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
          {evaluation.reponses?.map((r, i) => {
            const q = r.question;
            const cq = r.questionCustom;
            const isCustom = Boolean(cq);
            return (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colCritere}>
                  {(q?.critere ?? cq?.critere ?? "") + (isCustom ? " *" : "")}
                </Text>
                <Text style={styles.colIndicateur}>
                  {q?.indicateur ?? cq?.indicateur ?? ""}
                </Text>
                <Text style={styles.colQuestion}>
                  {q?.texte ?? cq?.texte ?? ""}
                </Text>
                <Text style={styles.colNote}>{String(r.note)}</Text>
                <Text style={styles.colCommentaire}>
                  {r.commentaireEvaluateur ?? ""}
                </Text>
              </View>
            );
          })}
          {(evaluation.questions_custom ?? []).length > 0 ? (
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

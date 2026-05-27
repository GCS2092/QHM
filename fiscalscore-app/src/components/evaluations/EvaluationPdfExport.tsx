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
  page: { fontFamily: "Helvetica", fontSize: 10, padding: 32, color: "#222" },
  title: { fontSize: 16, marginBottom: 4, fontWeight: "bold" },
  subtitle: { fontSize: 10, color: "#555", marginBottom: 16 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 6 },
  row: { marginBottom: 3 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
    paddingBottom: 4,
  },
  col1: { width: "18%" },
  col2: { width: "18%" },
  col3: { width: "28%" },
  col4: { width: "8%" },
  col5: { width: "28%" },
  seuilBox: { padding: 8, marginVertical: 8, borderRadius: 4 },
  gaugeOuter: {
    height: 14,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 8,
  },
  gaugeInner: { height: 14, borderRadius: 4 },
  chartRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  chartLabel: { width: "35%", fontSize: 8 },
  chartBarBg: { width: "55%", height: 8, backgroundColor: "#f3f4f6" },
  chartBarFill: { height: 8 },
  chartValue: { width: "10%", fontSize: 8, textAlign: "right" },
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
      28,
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
        ? "#ffedd5"
        : "#fee2e2";
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
        <Text style={styles.title}>
          Auditude — Rapport d&apos;évaluation comportementale
        </Text>
        <Text style={styles.subtitle}>
          Généré le {new Date().toLocaleDateString("fr-FR")}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <Text style={styles.row}>
            Entreprise : {evaluation.client?.nomEntreprise}
          </Text>
          <Text style={styles.row}>
            Responsable : {evaluation.client?.nomResponsable}
          </Text>
          <Text style={styles.row}>
            Téléphone : {evaluation.client?.telephone ?? "—"}
          </Text>
          <Text style={styles.row}>
            Email : {evaluation.client?.email ?? "—"}
          </Text>
          <Text style={styles.row}>
            Secteur : {evaluation.client?.secteur ?? "—"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Évaluation</Text>
          <Text style={styles.row}>Date : {evaluation.dateEvaluation}</Text>
          <Text style={styles.row}>Évaluateur : {evaluation.evaluateur}</Text>
          <Text style={styles.row}>
            Type :{" "}
            {type === "planification"
              ? "Phase de planification"
              : "Pendant la mission"}
          </Text>
          <Text style={styles.row}>
            Questionnaire : {evaluation.questionnaire?.titre}
          </Text>
          {evaluation.commentaireGlobal ? (
            <Text style={styles.row}>
              Introduction : {evaluation.commentaireGlobal}
            </Text>
          ) : null}
        </View>

        <View style={[styles.seuilBox, { backgroundColor: seuilBg }]}>
          <Text>
            Score brut : {evaluation.scoreFinal} / {evaluation.scoreMaxReel}
          </Text>
          <Text>
            Pourcentage : {evaluation.pourcentageScore}% — {seuil.label}
          </Text>
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
          <Text>{seuil.commentaire}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {type === "planification"
              ? "Scores par critère (radar)"
              : "Scores par question (barres)"}
          </Text>
          {chartData.map((item, i) => {
            const widthPct =
              type === "planification"
                ? (item as { pct: number }).pct
                : ((item as { note: number }).note / 3) * 100;
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail des réponses</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Critère</Text>
            <Text style={styles.col2}>Indicateur</Text>
            <Text style={styles.col3}>Question</Text>
            <Text style={styles.col4}>Note</Text>
            <Text style={styles.col5}>Commentaire</Text>
          </View>
          {evaluation.reponses?.map((r, i) => {
            const q = r.question;
            const cq = r.questionCustom;
            const isCustom = Boolean(cq);
            return (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>
                  {(q?.critere ?? cq?.critere ?? "") + (isCustom ? " *" : "")}
                </Text>
                <Text style={styles.col2}>
                  {q?.indicateur ?? cq?.indicateur ?? ""}
                </Text>
                <Text style={styles.col3}>{q?.texte ?? cq?.texte ?? ""}</Text>
                <Text style={styles.col4}>{String(r.note)}</Text>
                <Text style={styles.col5}>{r.commentaireEvaluateur ?? ""}</Text>
              </View>
            );
          })}
          <Text style={{ fontSize: 8, color: "#666", marginTop: 4 }}>
            * Question personnalisée
          </Text>
        </View>

        {evaluation.commentaireConclusion ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conclusion</Text>
            <Text>{evaluation.commentaireConclusion}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export default function EvaluationPdfExport({
  evaluation,
  className = "inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 transition",
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

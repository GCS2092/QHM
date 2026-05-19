"use client";

import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Questionnaire } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 12,
    padding: 24,
    color: "#222222",
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#555555",
    marginBottom: 14,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "bold",
  },
  row: {
    marginBottom: 4,
  },
  question: {
    marginBottom: 2,
  },
});

function QuestionnairePdfDocument({ questionnaire }: { questionnaire: Questionnaire }) {
  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{questionnaire.titre ?? "Questionnaire"}</Text>
          <Text style={styles.subtitle}>{questionnaire.description ?? "Aucune description"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails</Text>
          <Text style={styles.row}>Statut : {questionnaire.actif ? "Actif" : "Inactif"}</Text>
          <Text style={styles.row}>Questions : {questionnaire.questions?.length ?? 0}</Text>
          <Text style={styles.row}>Evaluations : {questionnaire.evaluations?.length ?? 0}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions</Text>
          {questionnaire.questions?.length ? (
            questionnaire.questions.map((question, index) => (
              <Text key={`question-${index}`} style={styles.question}>- {question.texte ?? question?.texte ?? "Question sans texte"}</Text>
            ))
          ) : (
            <Text style={styles.row}>Aucune question disponible.</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}

export default function QuestionnairePdfExport({ questionnaire }: { questionnaire: Questionnaire }) {
  return (
    <PDFDownloadLink
      document={<QuestionnairePdfDocument questionnaire={questionnaire} />}
      fileName={`${questionnaire.titre?.replace(/\s+/g, "_") ?? "questionnaire"}.pdf`}
      className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 transition"
    >
      {({ loading }) => (loading ? "Préparation PDF..." : "Exporter PDF")}
    </PDFDownloadLink>
  );
}

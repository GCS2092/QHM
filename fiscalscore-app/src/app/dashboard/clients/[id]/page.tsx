import ClientDetail from "@/components/clients/ClientDetail";

type ClientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const { id } = await params;
  return <ClientDetail clientId={id} />;
}

"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Erreur</h1>
      <p className="text-gray-600 mb-2 text-center max-w-md">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg mt-4 hover:bg-blue-700 transition"
      >
        Réessayer
      </button>
    </div>
  );
}

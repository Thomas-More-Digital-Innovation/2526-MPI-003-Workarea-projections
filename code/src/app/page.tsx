import Navbar from "@/components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar bovenaan */}
      <Navbar />

      {/* Content van de pagina */}
      <main className="p-6">
        <h1 className="text-2xl font-bold">Welkom bij MPI Projectie Tool</h1>
        <p className="mt-4">Hier komt de rest van je content...</p>
      </main>
    </div>
  );
}

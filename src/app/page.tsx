export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-parchment px-6 py-24 text-ink">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-navy">
        Abdullayev School
      </h1>
      <p className="max-w-md text-center font-body text-base text-ink/80">
        Student, Parent va Teacher/Admin platformasi — Phase 1 quriladi.
      </p>
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 rounded-full bg-navy" />
        <span className="h-10 w-10 rounded-full bg-gold" />
        <span className="h-10 w-10 rounded-full border border-ink/20 bg-parchment" />
        <span className="h-10 w-10 rounded-full bg-ink" />
      </div>
    </main>
  );
}

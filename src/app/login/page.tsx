import { signIn } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Email yoki parol noto'g'ri.",
  no_profile: "Bu hisob uchun profil topilmadi. Administrator bilan bog'laning.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-parchment px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center font-display text-4xl font-semibold text-navy">
          Abdullayev School
        </h1>
        <form action={signIn} className="flex flex-col gap-4">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            className="rounded-md border border-ink/20 bg-white px-4 py-2 text-ink placeholder:text-ink/70"
          />
          <label htmlFor="password" className="sr-only">
            Parol
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Parol"
            className="rounded-md border border-ink/20 bg-white px-4 py-2 text-ink placeholder:text-ink/70"
          />
          {error && (
            <p className="text-sm text-error">
              {ERROR_MESSAGES[error] ?? "Kirishda xatolik yuz berdi."}
            </p>
          )}
          <button
            type="submit"
            className="rounded-md bg-navy px-4 py-2 font-body font-medium text-parchment"
          >
            Kirish
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/70">
          Hisobingiz yo&apos;qmi? Maktab administratori sizga hisob yaratadi.
        </p>
      </div>
    </main>
  );
}

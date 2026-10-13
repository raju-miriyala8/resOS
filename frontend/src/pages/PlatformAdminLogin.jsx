import { Link } from "react-router-dom";

function PlatformAdminLogin() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">
          resOS · Platform admin
        </p>
        <h1 className="mt-3 text-3xl font-bold">Admin portal</h1>
        <p className="mt-3 leading-6 text-slate-600">
          This frontend screen is kept for the planned platform-admin feature,
          but the current backend does not provide platform-admin sign-in or
          restaurant-management endpoints yet.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800"
        >
          Return to restaurant sign in
        </Link>
      </section>
    </main>
  );
}

export default PlatformAdminLogin;

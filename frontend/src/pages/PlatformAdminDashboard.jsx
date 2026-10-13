import { Link } from "react-router-dom";

function PlatformAdminDashboard() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
          resOS · Platform admin
        </p>
        <h1 className="mt-3 text-3xl font-bold">Restaurant management</h1>
        <p className="mt-3 leading-6 text-slate-600">
          This page is a frontend placeholder. The current backend does not
          provide an API for platform admins to list, suspend, or reactivate
          restaurants.
        </p>
        <Link
          to="/platform-admin"
          className="mt-6 inline-block rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50"
        >
          Back
        </Link>
      </section>
    </main>
  );
}

export default PlatformAdminDashboard;

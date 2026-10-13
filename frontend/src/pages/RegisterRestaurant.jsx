import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api.js";

function RegisterRestaurant() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", form);
      setRegistered(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to create the restaurant account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
          resOS
        </p>
        {registered ? (
          <>
            <h1 className="mt-3 text-3xl font-bold">Restaurant created</h1>
            <p className="mt-3 leading-6 text-slate-600">
              Sign in with this restaurant account, choose Owner, then set up the
              first owner password.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-lg bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800"
            >
              Continue to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-3xl font-bold">Create restaurant account</h1>
            <p className="mt-2 text-slate-500">
              This account is used to identify your restaurant.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium" htmlFor="restaurant-name">
                  Restaurant name
                </label>
                <input
                  id="restaurant-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="organization"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" htmlFor="register-email">
                  Email
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" htmlFor="register-password">
                  Restaurant account password
                </label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create restaurant"}
              </button>
            </form>
            <p className="mt-5 text-sm text-slate-500">
              Already registered?{" "}
              <Link to="/" className="font-semibold text-sky-700 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

export default RegisterRestaurant;

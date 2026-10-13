
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const roles = [
  { id: "OWNER", title: "Owner", description: "Restaurant overview and staff access" },
  { id: "MANAGER", title: "Manager", description: "Tables, menu, and daily operations" },
  { id: "KITCHEN", title: "Kitchen", description: "Prepare and update incoming orders" },
];

function RoleSelection() {
  const [role, setRole] = useState("");
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const handleContinue = () => {
    navigate("/verify-role", {
      state: { role },
    });
  };

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">resOS · Sign in</p>
        <h1 className="mt-3 text-3xl font-bold">Choose your workspace</h1>
        <p className="mt-2 text-slate-500">Select a role, then enter the password your restaurant owner created for it.</p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {roles.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={role === option.id}
              onClick={() => setRole(option.id)}
              className={`rounded-xl border p-4 text-left transition ${
                role === option.id
                  ? "border-sky-600 bg-sky-50 ring-2 ring-sky-100"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <span className="block font-semibold">{option.title}</span>
              <span className="mt-2 block text-sm leading-5 text-slate-500">{option.description}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!role}
          className="mt-6 w-full rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-40"
        >
          Continue
        </button>
      </section>
    </main>
  );
}

export default RoleSelection;

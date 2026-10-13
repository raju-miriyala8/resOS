import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../features/auth/authSlice.js";
import api from "../api/api.js";

function VerifyRole() {
  const [password, setPassword] = useState("");
  const [settingUpOwner, setSettingUpOwner] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const role = location.state?.role;

  const verifyPassword = async (rolePassword) => {
    const response = await api.post(
      "/auth/verify-role",
      { role, password: rolePassword },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("restaurantToken")}`,
        },
      }
    );

    localStorage.setItem("resosToken", response.data.token);
    localStorage.setItem("restaurantId", response.data.restaurantId);
    localStorage.setItem("role", response.data.role);

    dispatch(
      setCredentials({
        token: response.data.token,
        restaurantId: response.data.restaurantId,
        role: response.data.role,
      })
    );

    navigate(
      role === "OWNER"
        ? "/owner"
        : role === "MANAGER"
          ? "/manager"
          : "/kitchen"
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (settingUpOwner) {
        await api.post(
          "/auth/create-owner-pass",
          {
            restaurent_id: localStorage.getItem("restaurantId"),
            owner_password: password,
          }
        );
      }

      await verifyPassword(password);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          (settingUpOwner
            ? "Unable to set up the owner password."
            : "Role verification failed.")
      );
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return <Navigate to="/select-role" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
          resOS · {role}
        </p>
        <h1 className="mt-3 text-3xl font-bold">
          {settingUpOwner ? "Set up owner access" : "Verify your role"}
        </h1>
        <p className="mt-2 text-slate-500">
          {settingUpOwner
            ? "Create the first owner password for this restaurant. You must be signed in with the restaurant account."
            : `Enter the ${role.toLowerCase()} password provided by your restaurant owner.`}
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="role-password"
            >
              {settingUpOwner ? "New owner password" : `${role} password`}
            </label>
            <input
              id="role-password"
              type="password"
              autoComplete="current-password"
              placeholder={
                settingUpOwner
                  ? "Create a password (at least 6 characters)"
                  : `Enter ${role.toLowerCase()} password`
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={settingUpOwner ? 6 : undefined}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              required
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white transition hover:bg-sky-800 disabled:cursor-wait disabled:opacity-60"
          >
            {loading
              ? settingUpOwner
                ? "Setting up owner..."
                : "Checking password..."
              : settingUpOwner
                ? "Create password and continue"
                : "Open workspace"}
          </button>
        </form>

        {role === "OWNER" && !settingUpOwner && (
          <button
            type="button"
            onClick={() => {
              setPassword("");
              setError("");
              setSettingUpOwner(true);
            }}
            className="mt-4 text-sm font-medium text-sky-700 hover:underline"
          >
            First time here? Set up the owner password
          </button>
        )}
      </section>
    </main>
  );
}

export default VerifyRole;

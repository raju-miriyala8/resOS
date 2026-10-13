import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api.js";
import { setCredentials } from "../features/auth/authSlice.js";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email,
                password,
            });
            const restaurantId =
                response.data.restaurantId || response.data.restaurentId;

            localStorage.setItem("restaurantToken", response.data.token);
            localStorage.setItem("restaurantId", restaurantId);
            localStorage.removeItem("resosToken");
            localStorage.removeItem("role");
            dispatch(
                setCredentials({
                    token: response.data.token,
                    restaurantId,
                    role: null,
                })
            );

            navigate("/select-role");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-8">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">resOS</p>
                    <h1 className="mt-3 text-3xl font-bold">Welcome back</h1>
                    <p className="mt-2 text-slate-500">Sign in with your restaurant account to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium" htmlFor="email">Restaurant email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@restaurant.com"
                        autoComplete="username"
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                        required
                    />
                    </div>
                    <div>
                    <label className="mb-2 block text-sm font-medium" htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
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
                        className="w-full rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white transition hover:bg-sky-800 disabled:cursor-wait disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Continue"}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-slate-500">
                    New to resOS?{" "}
                    <Link to="/register" className="font-semibold text-sky-700 hover:underline">
                        Create a restaurant account
                    </Link>
                </p>
                <p className="mt-3 text-center text-xs text-slate-400">
                    <Link to="/platform-admin" className="hover:text-sky-700 hover:underline">
                        Platform admin
                    </Link>
                </p>
            </section>
        </main>
    );
}

export default Login;
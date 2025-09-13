import { useState } from "react";
import { loginUser } from "../services/auth";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await loginUser(form.email, form.password);
      toast.success("Bienvenido, " + user.fullname);
      if (user.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    } catch (err) {
      setError("Error al iniciar sesión: " + (err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 space-y-6 transition-all"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">
          Iniciar sesión
        </h2>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Correo electrónico"
            className="pl-10 pr-4 py-2 w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Contraseña"
            className="pl-10 pr-4 py-2 w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-red-500 text-center">{error}</div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        >
          Entrar
        </button>

        {/* Link to register */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          ¿No tienes una cuenta?{" "}
          <Link
            to="/register"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Regístrate aquí
          </Link>
        </div>
      </form>
    </div>
  );
}
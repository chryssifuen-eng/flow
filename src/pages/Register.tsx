import { useState } from "react";
import { registerUser } from "../services/auth";
import { validatePassword } from "../utils/validatePassword";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  KeyRound,
  Hash,
  Wrench,
  MapPin,
} from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    employeenumber: "",
    workshop: "",
    zone: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formWithTrimmedEmail = { ...form, email: form.email.trim() };

    if (!validatePassword(formWithTrimmedEmail.password)) {
      setError(
        "Contraseña insegura: mínimo 8, máximo 20, mayúscula, minúscula, número y caracter especial."
      );
      return;
    }

    try {
      await registerUser(formWithTrimmedEmail);
      toast.success("Registro exitoso. Ahora puedes iniciar sesión.");
      navigate("/login");
    } catch (err) {
      setError("Error al registrar: " + (err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 space-y-6 animate-fade-in"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">
          Registro documentos-flow
        </h2>

        <InputField
          icon={<User size={20} />}
          name="fullname"
          value={form.fullname}
          onChange={handleChange}
          placeholder="Nombre completo"
          required
        />
        <InputField
          icon={<Mail size={20} />}
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Correo electrónico"
          required
        />
        <InputField
          icon={<Hash size={20} />}
          name="employeenumber"
          value={form.employeenumber}
          onChange={handleChange}
          placeholder="Número de empleado"
          required
        />
        <InputField
          icon={<Wrench size={20} />}
          name="workshop"
          value={form.workshop}
          onChange={handleChange}
          placeholder="Taller"
          required
        />
        <InputField
          icon={<MapPin size={20} />}
          name="zone"
          value={form.zone}
          onChange={handleChange}
          placeholder="Zona"
          required
        />
        <InputField
          icon={<Phone size={20} />}
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Teléfono"
          required
        />
        <InputField
          icon={<KeyRound size={20} />}
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Contraseña"
          required
        />

        {error && (
          <div className="text-sm text-red-500 text-center">{error}</div>
        )}

        <button
          type="submit"
          className="w-full py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        >
          Registrarse
        </button>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          ¿Ya tienes una cuenta?{" "}
          <Link
            to="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Inicia sesión aquí
          </Link>
        </div>
      </form>
    </div>
  );
}

// Componente reutilizable para inputs
function InputField({
  icon,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}: {
  icon: React.ReactNode;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-3 text-gray-400">{icon}</div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="pl-10 pr-4 py-2 w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
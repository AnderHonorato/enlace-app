"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Loader2 } from "lucide-react";
import { Logo } from "./Logo";
import { api } from "@/nucleo/cliente";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isReg = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api(isReg ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        body: JSON.stringify(isReg ? { name, email, password } : { email, password }),
      });
      window.location.assign("/app");
    } catch (err: any) {
      setError(err.message || "Não foi possível continuar.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="mb-7 flex justify-center">
          <Logo size={32} />
        </Link>

        <div className="text-center">
          <p className="kicker">{isReg ? "Novo diário" : "De volta ao diário"}</p>
          <h1 className="display mt-2 text-[30px] text-text">
            {isReg ? "Criar seu diário" : "Bem-vindo de volta"}
          </h1>
          <p className="mt-2 text-[13.5px] text-muted">
            {isReg ? "Comece a escrever a história de vocês." : "Que bom te ver de novo por aqui."}
          </p>
        </div>

        <div className="rule my-7" />

        <form onSubmit={submit} className="space-y-4">
          {isReg && (
            <Field
              label="Seu nome"
              value={name}
              onChange={setName}
              placeholder="Como te chamam?"
              autoFocus
            />
          )}
          <Field
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="voce@email.com"
            autoFocus={!isReg}
          />
          <Field
            label="Senha"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          {error && <p className="text-[12.5px] text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="sheen mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-text px-[18px] text-[13px] font-semibold text-bg transition hover:bg-accent disabled:opacity-70"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Heart size={14} />}
            {isReg ? "Criar diário" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-muted">
          {isReg ? "Já tem conta? " : "Ainda não tem conta? "}
          <Link href={isReg ? "/entrar" : "/cadastrar"} className="font-semibold text-accentInk hover:underline">
            {isReg ? "Entrar" : "Criar agora"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="kicker mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-[42px] w-full rounded-lg border border-border2 bg-surface px-3.5 text-[14px] text-text placeholder:text-faint focus:outline-none"
      />
    </label>
  );
}

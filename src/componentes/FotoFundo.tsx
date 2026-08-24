"use client";
import { useEffect, useState } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "./Avisos";

const LS_KEY = "enlace-bg-image";

export function BackgroundPhoto() {
  const [src, setSrc] = useState<string | null>(null);

  // Aplica ao body
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        setSrc(saved);
        document.body.style.backgroundImage = `url(${saved})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundAttachment = "fixed";
        document.body.classList.add("has-bg-photo");
      }
    } catch {}
    return () => {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundAttachment = "";
      document.body.classList.remove("has-bg-photo");
    };
  }, []);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) { toast("Imagem muito grande (máx 5MB)", "error"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      localStorage.setItem(LS_KEY, dataUrl);
      setSrc(dataUrl);
      document.body.style.backgroundImage = `url(${dataUrl})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.classList.add("has-bg-photo");
      toast("Papel de parede atualizado! 🖼️", "success");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function clear() {
    localStorage.removeItem(LS_KEY);
    setSrc(null);
    document.body.style.backgroundImage = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundPosition = "";
    document.body.style.backgroundAttachment = "";
    document.body.classList.remove("has-bg-photo");
    toast("Papel de parede removido", "info");
  }

  return null; // invisible, only side effects + controls rendered in Settings
}

export function BackgroundPicker() {
  const [hasBg, setHasBg] = useState(false);

  useEffect(() => {
    setHasBg(!!localStorage.getItem(LS_KEY));
  }, []);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) { toast("Imagem muito grande (máx 5MB)", "error"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      localStorage.setItem(LS_KEY, dataUrl);
      setHasBg(true);
      document.body.style.backgroundImage = `url(${dataUrl})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.classList.add("has-bg-photo");
      toast("Papel de parede atualizado! 🖼️", "success");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function clear() {
    localStorage.removeItem(LS_KEY);
    setHasBg(false);
    document.body.style.backgroundImage = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundPosition = "";
    document.body.style.backgroundAttachment = "";
    document.body.classList.remove("has-bg-photo");
    toast("Papel de parede removido", "info");
  }

  return (
    <div className="scrap-frame scrap-frame-tape rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon size={16} className="text-accent" />
        <span className="text-sm font-semibold text-text">Papel de parede do casal</span>
      </div>
      <p className="text-xs text-muted mb-3">
        Escolha uma foto de vocês como fundo do diário.
      </p>
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent transition hover:bg-accent/20 cursor-pointer">
          <Upload size={15} />
          {hasBg ? "Trocar foto" : "Escolher foto"}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
        {hasBg && (
          <button onClick={clear} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm text-muted transition hover:text-danger">
            <Trash2 size={15} /> Remover
          </button>
        )}
      </div>
    </div>
  );
}

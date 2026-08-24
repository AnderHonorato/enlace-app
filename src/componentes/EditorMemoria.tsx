"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Check, Wand2, RefreshCw } from "lucide-react";
import { api } from "@/nucleo/cliente";
import { toast } from "./Avisos";
import { confirmDialog } from "./DialogoConfirmacao";
import { compressImage } from "@/nucleo/imagem";
import { uploadMedia, isSecureBrowserContext } from "@/nucleo/midia-cliente";
import { RichEditor } from "./EditorRico";
import { toPlain } from "@/nucleo/sanitizacao";
import type { EntryDTO } from "@/nucleo/memorias";
import type { Me } from "@/nucleo/usuario-atual";
import { GaleriaAnexos } from "./editor-memoria/GaleriaAnexos";
import { DetalhesMemoria } from "./editor-memoria/DetalhesMemoria";
import { BarraMidia } from "./editor-memoria/BarraMidia";
import type { AnexoRascunho, RascunhoMemoria } from "./editor-memoria/tipos";
const DRAFT_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function toDateInput(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function EditorMemoria({
  me,
  initial,
  challengeTitle,
  promptTag = "desafio",
}: {
  me: Me;
  initial?: EntryDTO;
  challengeTitle?: string;
  promptTag?: string;
}) {
  const router = useRouter();
  const editing = !!initial;
  const coupled = !!me.couple;

  const [title, setTitle] = useState(initial?.title ?? challengeTitle ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [mood, setMood] = useState<string | null>(initial?.mood ?? null);
  const [date, setDate] = useState(toDateInput(initial?.entryDate));
  const [visibility, setVisibility] = useState<"shared" | "private">(
    initial?.visibility === "private" ? "private" : coupled ? "shared" : "private"
  );
  const [atts, setAtts] = useState<AnexoRascunho[]>(
    initial?.attachments.map((a) => ({ url: a.url, type: a.type, caption: a.caption ?? null, duration: a.duration ?? null })) ?? []
  );
  const [tags, setTags] = useState<string[]>(initial?.tags ?? (challengeTitle ? [promptTag] : []));
  const [tagInput, setTagInput] = useState("");
  const [place, setPlace] = useState(initial?.place ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial?.lat != null && initial?.lng != null ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [draftReady, setDraftReady] = useState(editing);
  const [draftStatus, setDraftStatus] = useState<"restored" | "saving" | "saved" | null>(null);
  const draftSnapshotRef = useRef<RascunhoMemoria | null>(null);
  const draftDiscardedRef = useRef(false);

  const draftKey = useMemo(() => {
    const scope = challengeTitle ? `${promptTag}:${challengeTitle}` : "livre";
    return `enlace-entry-draft:v1:${me.id}:${scope}`;
  }, [challengeTitle, me.id, promptTag]);

  const images = atts.filter((a) => a.type === "image");
  const audios = atts.filter((a) => a.type === "audio");
  const videos = atts.filter((a) => a.type === "video");
  const draftHasContent = !!(title.trim() || toPlain(content).trim() || tags.length || place.trim() || atts.length);
  draftSnapshotRef.current = draftHasContent
    ? {
        version: 1,
        updatedAt: Date.now(),
        title,
        content,
        mood,
        date,
        visibility,
        tags,
        place,
        coords,
        remoteAttachments: atts.filter((attachment) => !attachment.url.startsWith("data:") && !attachment.url.startsWith("blob:")),
      }
    : null;

  // Recupera texto e mídia já enviada. Imagens locais comprimidas ficam na
  // tela atual, mas não vão para localStorage para não travar o celular.
  useEffect(() => {
    if (editing) return;
    try {
      const raw = localStorage.getItem(draftKey);
      const draft = raw ? (JSON.parse(raw) as RascunhoMemoria) : null;
      if (
        draft?.version === 1 &&
        typeof draft.updatedAt === "number" &&
        typeof draft.title === "string" &&
        typeof draft.content === "string" &&
        typeof draft.date === "string" &&
        Array.isArray(draft.tags) &&
        Date.now() - draft.updatedAt <= DRAFT_MAX_AGE
      ) {
        setTitle(draft.title);
        setContent(draft.content);
        setMood(draft.mood);
        setDate(draft.date);
        setVisibility(draft.visibility);
        setTags(draft.tags);
        setPlace(draft.place);
        setCoords(draft.coords);
        setAtts(draft.remoteAttachments ?? []);
        setDraftStatus("restored");
      } else if (draft) {
        localStorage.removeItem(draftKey);
      }
    } catch {
      localStorage.removeItem(draftKey);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey, editing]);

  useEffect(() => {
    if (editing || !draftReady) return;
    if (!draftHasContent) {
      localStorage.removeItem(draftKey);
      setDraftStatus(null);
      return;
    }

    setDraftStatus("saving");
    const timer = window.setTimeout(() => {
      const draft = draftSnapshotRef.current;
      if (!draft) return;
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
        setDraftStatus("saved");
      } catch {
        setDraftStatus(null);
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [atts, content, coords, date, draftHasContent, draftKey, draftReady, editing, mood, place, tags, title, visibility]);

  // Se a rota mudar antes dos 650 ms do debounce, ainda salva a versão mais
  // recente de forma síncrona. Depois de publicar, a flag impede restaurar o
  // texto que acabou de ser enviado.
  useEffect(() => {
    return () => {
      if (editing || !draftReady || draftDiscardedRef.current) return;
      const draft = draftSnapshotRef.current;
      try {
        if (draft) localStorage.setItem(draftKey, JSON.stringify(draft));
        else localStorage.removeItem(draftKey);
      } catch {}
    };
  }, [draftKey, draftReady, editing]);

  async function onVideoFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = Math.min(2, 16 - atts.length);
    if (room <= 0) {
      toast("O limite é de 16 arquivos por memória.", "error");
      return;
    }
    setUploadingVideo(true);
    for (const f of Array.from(files).slice(0, room)) {
      if (!f.type.startsWith("video/")) continue;
      if (f.size > 30 * 1024 * 1024) {
        toast("Vídeo muito grande (máx. 30 MB).", "error");
        continue;
      }
      try {
        const up = await uploadMedia(f);
        setAtts((a) => [...a, { url: up.url, type: "video", caption: null, duration: null }]);
      } catch (err: any) {
        toast(err.message || "Falha ao enviar o vídeo.", "error");
      }
    }
    setUploadingVideo(false);
  }

  function setCaption(url: string, caption: string) {
    setAtts((a) => a.map((x) => (x.url === url ? { ...x, caption } : x)));
  }
  function removeAtt(url: string) {
    setAtts((a) => a.filter((x) => x.url !== url));
    const pendingId = url.match(/^\/api\/uploads\/([^/?#]+)$/)?.[1];
    const existedBeforeEditing = initial?.attachments.some((attachment) => attachment.url === url);
    if (pendingId && !existedBeforeEditing) {
      api(`/api/uploads/${encodeURIComponent(pendingId)}`, { method: "DELETE" }).catch(() => {});
    }
  }

  async function askForIdeas() {
    setLoadingPrompts(true);
    try {
      const res = await api<{ prompts: string[] }>("/api/ai/prompt");
      setPrompts(res.prompts);
    } catch {
      toast("Não consegui buscar ideias agora.", "error");
    } finally {
      setLoadingPrompts(false);
    }
  }

  function addTag(raw: string) {
    const t = raw.trim().toLowerCase().replace(/^#/, "").replace(/[,.]+$/, "").slice(0, 40);
    if (!t || tags.includes(t) || tags.length >= 20) return;
    setTags((arr) => [...arr, t]);
  }

  function handleTagInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (v.includes(",")) {
      const parts = v.split(",");
      parts.forEach((p) => addTag(p));
      setTagInput("");
      return;
    }
    setTagInput(v);
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  }

  function handleTagBlur() {
    if (tagInput.trim()) {
      addTag(tagInput);
      setTagInput("");
    }
  }

  function useMyLocation() {
    if (!isSecureBrowserContext()) {
      toast("A localização precisa de HTTPS. Abra o site pelo endereço que começa com https://.", "error");
      return;
    }
    if (!("geolocation" in navigator)) {
      toast("Seu navegador não permite localização.", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            const a = data?.address ?? {};
            const street = [a.road, a.house_number].filter(Boolean).join(", ");
            const city = a.city || a.town || a.village || a.municipality;
            const label = [street, a.neighbourhood || a.suburb, city, a.state].filter(Boolean).join(" · ");
            if (label) setPlace(label);
          })
          .catch(() => {});
        setLocating(false);
        toast("Localização capturada", "success");
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          toast("Permissão de localização negada. Verifique as configurações do navegador.", "error");
        } else if (err.code === 2) {
          toast("Sinal de GPS indisponível. Ative o GPS e tente novamente.", "error");
        } else if (err.code === 3) {
          toast("Tempo esgotado. Verifique a conexão e tente novamente.", "error");
        } else {
          toast("Não foi possível obter sua localização.", "error");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = 16 - atts.length;
    const chosen = Array.from(files).slice(0, room);
    setUploadingImages(true);
    try {
      for (const f of chosen) {
        if (!f.type.startsWith("image/")) continue;
        try {
          const img = await compressImage(f);
          // Em casal, envia a versão já comprimida antes de publicar. Assim a
          // URL sobrevive à troca de aparelho e também pode voltar no rascunho.
          const url = coupled
            ? (await uploadMedia(await fetch(img.url).then((response) => response.blob()), f.name.replace(/\.[^.]+$/, ".jpg"))).url
            : img.url;
          setAtts((a) => [...a, { url, type: "image", caption: null, duration: null }]);
        } catch (err: any) {
          toast(err.message || "Não consegui enviar uma imagem.", "error");
        }
      }
    } finally {
      setUploadingImages(false);
    }
  }

  async function save() {
    if (busy) return;
    if (uploadingImages || uploadingVideo || audioBusy) {
      toast("Aguarde o envio da mídia terminar.", "info");
      return;
    }
    if (!toPlain(content).trim() && !title.trim() && atts.length === 0) {
      toast("Escreva algo ou adicione uma foto.", "error");
      return;
    }
    const [year, month, day] = date.split("-").map(Number);
    if (!year || !month || !day) {
      toast("Escolha uma data válida para a memória.", "error");
      return;
    }
    const now = new Date();
    const entryDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
    if (Number.isNaN(entryDate.getTime())) {
      toast("Escolha uma data válida para a memória.", "error");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: title.trim() || undefined,
        content,
        mood,
        visibility,
        entryDate: entryDate.toISOString(),
        attachments: atts,
        tags,
        place: place.trim() || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      };
      if (editing) {
        await api(`/api/entries/${initial!.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast("Memória atualizada.", "success");
      } else {
        const res = await api<{
          pointsAwarded: number;
          insight: string | null;
          streak?: {
            streak: number;
            penalty: number;
            missed: number;
            bonus: number;
            alreadyToday: boolean;
            shieldUsed?: boolean;
            shields?: number;
          };
          plans?: { title: string; kind: string }[];
        }>("/api/memorias", { method: "POST", body: JSON.stringify(payload) });
        toast(`Memória guardada · +${res.pointsAwarded} pts`, "success");
        const s = res.streak;
        if (s) {
          if (s.shieldUsed)
            setTimeout(() => toast(`Escudo usado! Sua sequência de ${s.streak} dias foi salva.`, "success"), 1500);
          else if (s.penalty > 0)
            setTimeout(() => toast(`−${s.penalty} pts por ${s.missed} dia(s) sem registrar. Recomeça agora!`, "error"), 1500);
          else if (s.bonus > 0)
            setTimeout(() => toast(`${s.streak} dias seguidos! +${s.bonus} de bônus`, "success"), 1500);
          else if (!s.alreadyToday && s.streak > 1)
            setTimeout(() => toast(`${s.streak} dias de sequência!`, "success"), 1500);
        }

        // A IA achou um plano no texto? Oferece guardar nos Planos de vocês.
        for (const plan of (res.plans ?? []).slice(0, 2)) {
          const ok = await confirmDialog({
            title: "Vi um plano de vocês 👀",
            message: `“${plan.title}” — quero guardar isso na lista de desejos de vocês?`,
            confirmLabel: "Guardar",
            cancelLabel: "Agora não",
          });
          if (!ok) continue;
          try {
            await api("/api/wishes", {
              method: "POST",
              body: JSON.stringify({ title: plan.title, kind: plan.kind }),
            });
            toast("Guardado nos Planos ✨", "success");
          } catch (err: any) {
            toast(err.message, "error");
          }
        }
      }
      if (!editing) {
        draftDiscardedRef.current = true;
        localStorage.removeItem(draftKey);
        setDraftReady(false);
        setDraftStatus(null);
      }
      router.push("/app");
      router.refresh();
    } catch (err: any) {
      toast(err.message, "error");
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/app" aria-label="Voltar para a linha do tempo" className="rounded-lg p-2 text-muted transition hover:bg-surface2 hover:text-text">
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl text-text">{editing ? "Editar memória" : "Nova memória"}</h1>
          {!editing && draftStatus && (
            <p className="mt-0.5 text-xs text-faint" aria-live="polite">
              {draftStatus === "restored"
                ? "Rascunho recuperado neste aparelho"
                : draftStatus === "saving"
                  ? "Salvando rascunho…"
                  : "Rascunho salvo neste aparelho"}
            </p>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card scrap-frame-tape p-4 sm:p-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (opcional)"
          aria-label="Título da memória"
          className="w-full bg-transparent font-display text-2xl text-text placeholder:text-faint focus:outline-none"
        />
        <div className="mt-3">
          <RichEditor
            value={content}
            onChange={setContent}
            placeholder="Conte como foi… o que aconteceu, o que você sentiu."
          />
        </div>

        {/* Sugestão de escrita — a IA puxa assunto */}
        <div className="mt-3">
          {prompts.length === 0 ? (
            <button
              type="button"
              onClick={askForIdeas}
              disabled={loadingPrompts}
              className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3.5 py-2 text-sm text-muted transition hover:border-accent hover:text-accent disabled:opacity-60"
            >
              {loadingPrompts ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
              Sem inspiração? Ver sugestões
            </button>
          ) : (
            <div className="rounded-2xl border border-accent/25 bg-accent/6 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <Wand2 size={13} /> Escolha uma pergunta pra começar
                </span>
                <button type="button" onClick={askForIdeas} disabled={loadingPrompts} className="text-faint transition hover:text-accent">
                  {loadingPrompts ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                </button>
              </div>
              <div className="space-y-1.5">
                {prompts.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (!title.trim()) setTitle(p.replace(/\?$/, ""));
                      setPrompts([]);
                    }}
                    className="block w-full rounded-xl bg-surface px-3 py-2 text-left text-sm text-text transition hover:bg-surface2"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <GaleriaAnexos
          imagens={images}
          videos={videos}
          audios={audios}
          aoRemover={removeAtt}
          aoAlterarLegenda={setCaption}
        />

        <DetalhesMemoria
          humor={mood}
          etiquetas={tags}
          entradaEtiqueta={tagInput}
          lugar={place}
          coordenadas={coords}
          localizando={locating}
          aoAlterarHumor={setMood}
          aoAlterarEtiquetas={setTags}
          aoAdicionarEtiqueta={addTag}
          aoAlterarEntradaEtiqueta={handleTagInputChange}
          aoTeclarEntradaEtiqueta={handleTagKeyDown}
          aoSairEntradaEtiqueta={handleTagBlur}
          aoAlterarLugar={setPlace}
          aoUsarLocalizacao={useMyLocation}
          aoRemoverLocalizacao={() => setCoords(null)}
        />
      </motion.div>

      <BarraMidia
        data={date}
        casalConectado={coupled}
        visibilidade={visibility}
        enviandoImagens={uploadingImages}
        enviandoVideo={uploadingVideo}
        limiteAtingido={atts.length >= 16}
        aoAlterarData={setDate}
        aoAlternarVisibilidade={() => setVisibility((atual) => atual === "shared" ? "private" : "shared")}
        aoSelecionarImagens={onFiles}
        aoSelecionarVideo={onVideoFiles}
        aoAlterarGravacao={setAudioBusy}
        aoGravarAudio={(audio) => setAtts((atuais) => atuais.length >= 16 ? atuais : [...atuais, { url: audio.url, type: "audio", caption: null, duration: audio.duration }])}
      />

      {/* Save */}
      <div className="sticky bottom-24 z-10 mt-6 lg:bottom-6">
        <button
          onClick={save}
          disabled={busy || uploadingImages || uploadingVideo || audioBusy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl accent-gradient py-3.5 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          {busy ? "Guardando…" : editing ? "Salvar alterações" : "Guardar memória"}
        </button>
      </div>
    </div>
  );
}

from pathlib import Path
import re

RAIZ_API = Path("src/app/api")
RAIZ_APP = Path("src/app/app")

# O Next 15 passou a tipar `params` de rotas/páginas dinâmicas como Promise.
# Este script é propositalmente conservador: só transforma tipos inline simples
# e usos diretos `params.campo`. Pode ser executado várias vezes sem duplicar.
TIPO_PARAMS_SINCRONO = re.compile(r"params:\s*\{([^{}]+)\}")
USO_PARAMS = re.compile(r"(?<!await )\bparams\.([A-Za-z_$][A-Za-z0-9_$]*)")


def tornar_params_promise(texto: str) -> tuple[str, bool]:
    alterou = False

    def substituir_tipo(match: re.Match[str]) -> str:
        nonlocal alterou
        corpo = match.group(1)
        # Só mexe em um objeto simples de parâmetros (id/slug/etc.).
        if ":" not in corpo or not re.search(r"\b(string|number)\b", corpo):
            return match.group(0)
        alterou = True
        return f"params: Promise<{{{corpo}}}>"

    texto = TIPO_PARAMS_SINCRONO.sub(substituir_tipo, texto)

    # Corrige uma compatibilidade temporária criada durante a migração manual.
    uniao = "Promise<{ id: string }> | { id: string }"
    if uniao in texto:
        texto = texto.replace(uniao, "Promise<{ id: string }>")
        alterou = True
    if "await Promise.resolve(contexto.params)" in texto:
        texto = texto.replace("await Promise.resolve(contexto.params)", "await contexto.params")
        alterou = True

    if "params: Promise<" in texto:
        novo = USO_PARAMS.sub(r"(await params).\1", texto)
        if novo != texto:
            texto = novo
            alterou = True

    return texto, alterou


def processar_rota(arquivo: Path) -> bool:
    texto = arquivo.read_text(encoding="utf-8")
    novo, alterou = tornar_params_promise(texto)
    if alterou and novo != texto:
        arquivo.write_text(novo, encoding="utf-8")
        print(f"adaptado: {arquivo}")
        return True
    return False


def processar_pagina_assincrona(arquivo: Path) -> bool:
    texto = arquivo.read_text(encoding="utf-8")
    # Componentes client não podem simplesmente virar async. Deixamos esses
    # casos para correção explícita em vez de fazer transformação arriscada.
    if '"use client"' in texto[:300] or "'use client'" in texto[:300]:
        return False
    if "async function" not in texto and "async (" not in texto:
        return False
    novo, alterou = tornar_params_promise(texto)
    if alterou and novo != texto:
        arquivo.write_text(novo, encoding="utf-8")
        print(f"adaptado: {arquivo}")
        return True
    return False


def parametros_sincronos_restantes() -> list[Path]:
    restantes: list[Path] = []
    for arquivo in RAIZ_API.rglob("route.ts"):
        texto = arquivo.read_text(encoding="utf-8")
        if TIPO_PARAMS_SINCRONO.search(texto):
            restantes.append(arquivo)
    return restantes


def main() -> None:
    alterados = 0
    if RAIZ_API.exists():
        for arquivo in sorted(RAIZ_API.rglob("route.ts")):
            alterados += int(processar_rota(arquivo))

    if RAIZ_APP.exists():
        for padrao in ("page.tsx", "layout.tsx"):
            for arquivo in sorted(RAIZ_APP.rglob(padrao)):
                alterados += int(processar_pagina_assincrona(arquivo))

    restantes = parametros_sincronos_restantes()
    if restantes:
        nomes = "\n".join(f" - {arquivo}" for arquivo in restantes)
        raise SystemExit(
            "Ainda existem rotas dinâmicas com params síncrono; corrija manualmente:\n" + nomes
        )

    print(f"Migração Next 15 concluída. Arquivos alterados: {alterados}")


if __name__ == "__main__":
    main()

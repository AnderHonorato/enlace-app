from pathlib import Path
import re

RAIZ_API = Path("src/app/api")
RAIZ_APP = Path("src/app/app")

# O Next 15 passou a tipar `params` e `searchParams` de rotas/páginas como Promise.
# Este script é propositalmente conservador: transforma tipos inline simples e
# mantém cada alteração idempotente para poder rodar de novo sem duplicar código.
TIPO_PARAMS_SINCRONO = re.compile(r"params:\s*\{([^{}]+)\}")
TIPO_SEARCH_PARAMS_SINCRONO = re.compile(r"searchParams:\s*\{([^{}]+)\}")
USO_PARAMS = re.compile(r"(?<!await )\bparams\.([A-Za-z_$][A-Za-z0-9_$]*)")
USO_SEARCH_PARAMS = re.compile(r"\bsearchParams\.([A-Za-z_$][A-Za-z0-9_$]*)")


def tornar_promise(texto: str, tipo: re.Pattern[str], nome: str) -> tuple[str, bool]:
    alterou = False

    def substituir_tipo(match: re.Match[str]) -> str:
        nonlocal alterou
        corpo = match.group(1)
        if ":" not in corpo:
            return match.group(0)
        alterou = True
        return f"{nome}: Promise<{{{corpo}}}>"

    return tipo.sub(substituir_tipo, texto), alterou


def tornar_params_promise(texto: str) -> tuple[str, bool]:
    alterou = False

    texto, mudou_tipo = tornar_promise(texto, TIPO_PARAMS_SINCRONO, "params")
    alterou = alterou or mudou_tipo

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


def achar_fim_parenteses(texto: str, inicio: int) -> int | None:
    nivel = 0
    em_string: str | None = None
    escape = False

    for i in range(inicio, len(texto)):
        caractere = texto[i]
        if em_string:
            if escape:
                escape = False
            elif caractere == "\\":
                escape = True
            elif caractere == em_string:
                em_string = None
            continue

        if caractere in ('"', "'", "`"):
            em_string = caractere
            continue
        if caractere == "(":
            nivel += 1
        elif caractere == ")":
            nivel -= 1
            if nivel == 0:
                return i
    return None


def resolver_search_params_no_default(texto: str) -> tuple[str, bool]:
    """Resolve searchParams uma vez no componente de página.

    Isso evita expressões como `(await searchParams).ctx` repetidas. Além de ser
    mais legível, uma variável local preserva o narrowing do TypeScript para
    propriedades opcionais usadas em `typeof`, ternários e chamadas como slice().
    """
    if "searchParams: Promise<" not in texto or not USO_SEARCH_PARAMS.search(texto):
        return texto, False
    if "const searchParamsResolvidos = await searchParams;" in texto:
        return texto, False

    marcador = "export default async function"
    inicio_funcao = texto.find(marcador)
    if inicio_funcao < 0:
        return texto, False

    inicio_parenteses = texto.find("(", inicio_funcao + len(marcador))
    if inicio_parenteses < 0:
        return texto, False
    fim_parenteses = achar_fim_parenteses(texto, inicio_parenteses)
    if fim_parenteses is None:
        return texto, False

    assinatura = texto[inicio_parenteses : fim_parenteses + 1]
    if "searchParams" not in assinatura:
        return texto, False

    inicio_corpo = texto.find("{", fim_parenteses + 1)
    if inicio_corpo < 0:
        return texto, False

    cabecalho = texto[: inicio_corpo + 1]
    corpo = texto[inicio_corpo + 1 :]
    corpo_novo = USO_SEARCH_PARAMS.sub(r"searchParamsResolvidos.\1", corpo)
    if corpo_novo == corpo:
        return texto, False

    indentacao = "\n  const searchParamsResolvidos = await searchParams;"
    return cabecalho + indentacao + corpo_novo, True


def tornar_search_params_promise(texto: str) -> tuple[str, bool]:
    alterou = False
    texto, mudou_tipo = tornar_promise(texto, TIPO_SEARCH_PARAMS_SINCRONO, "searchParams")
    alterou = alterou or mudou_tipo

    novo, resolveu = resolver_search_params_no_default(texto)
    if resolveu:
        texto = novo
        alterou = True

    # Fallback conservador para funções server-side fora do componente default.
    # Em páginas normais o caminho acima é usado e resolve apenas uma vez.
    if "searchParams: Promise<" in texto and USO_SEARCH_PARAMS.search(texto):
        novo = USO_SEARCH_PARAMS.sub(r"(await searchParams).\1", texto)
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

    novo, alterou_params = tornar_params_promise(texto)
    novo, alterou_busca = tornar_search_params_promise(novo)
    alterou = alterou_params or alterou_busca

    if alterou and novo != texto:
        arquivo.write_text(novo, encoding="utf-8")
        print(f"adaptado: {arquivo}")
        return True
    return False


def incompatibilidades_restantes() -> list[Path]:
    restantes: list[Path] = []

    for arquivo in RAIZ_API.rglob("route.ts"):
        texto = arquivo.read_text(encoding="utf-8")
        if TIPO_PARAMS_SINCRONO.search(texto):
            restantes.append(arquivo)

    if RAIZ_APP.exists():
        for padrao in ("page.tsx", "layout.tsx"):
            for arquivo in RAIZ_APP.rglob(padrao):
                texto = arquivo.read_text(encoding="utf-8")
                if '"use client"' in texto[:300] or "'use client'" in texto[:300]:
                    continue
                if TIPO_PARAMS_SINCRONO.search(texto) or TIPO_SEARCH_PARAMS_SINCRONO.search(texto):
                    restantes.append(arquivo)

    return sorted(set(restantes))


def main() -> None:
    alterados = 0
    if RAIZ_API.exists():
        for arquivo in sorted(RAIZ_API.rglob("route.ts")):
            alterados += int(processar_rota(arquivo))

    if RAIZ_APP.exists():
        for padrao in ("page.tsx", "layout.tsx"):
            for arquivo in sorted(RAIZ_APP.rglob(padrao)):
                alterados += int(processar_pagina_assincrona(arquivo))

    restantes = incompatibilidades_restantes()
    if restantes:
        nomes = "\n".join(f" - {arquivo}" for arquivo in restantes)
        raise SystemExit(
            "Ainda existem páginas/rotas com parâmetros síncronos incompatíveis com Next 15:\n" + nomes
        )

    print(f"Migração Next 15 concluída. Arquivos alterados: {alterados}")


if __name__ == "__main__":
    main()

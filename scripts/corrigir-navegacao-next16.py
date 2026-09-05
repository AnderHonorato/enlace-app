from pathlib import Path


def substituir_unico(caminho: Path, antigo: str, novo: str, ja_aplicado: str | None = None) -> bool:
    conteudo = caminho.read_text(encoding="utf-8")
    if antigo in conteudo:
        if conteudo.count(antigo) != 1:
            raise RuntimeError(f"Esperava uma ocorrência em {caminho}, encontrei {conteudo.count(antigo)}")
        caminho.write_text(conteudo.replace(antigo, novo, 1), encoding="utf-8")
        return True
    if ja_aplicado and ja_aplicado in conteudo:
        return False
    raise RuntimeError(f"Padrão esperado não encontrado em {caminho}")


estrutura = Path("src/componentes/EstruturaAplicativo.tsx")
bloco_global = '''async function logout() {
  await api("/api/auth/logout", { method: "POST" }).catch(() => {});
  window.location.assign("/entrar");
}

'''
substituir_unico(
    estrutura,
    bloco_global,
    "",
    'router.replace("/entrar");',
)

ancora_router = "  const router = useRouter();\n"
logout_local = '''  const router = useRouter();
  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/entrar");
  };
'''
substituir_unico(
    estrutura,
    ancora_router,
    logout_local,
    '  const logout = async () => {\n    await api("/api/auth/logout", { method: "POST" }).catch(() => {});\n    router.replace("/entrar");',
)

experiencia = Path("src/componentes/ExperienciaJogos.tsx")
conteudo_experiencia = experiencia.read_text(encoding="utf-8")
comentario = "    // eslint-disable-next-line react-hooks/exhaustive-deps\n"
if comentario in conteudo_experiencia:
    experiencia.write_text(conteudo_experiencia.replace(comentario, "", 1), encoding="utf-8")

print("Navegação interna e comentário obsoleto ajustados com segurança.")

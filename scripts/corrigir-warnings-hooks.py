from pathlib import Path


def substituir_exato(caminho: str, antigo: str, novo: str) -> None:
    arquivo = Path(caminho)
    texto = arquivo.read_text(encoding="utf-8")

    if novo in texto:
        print(f"ok: {caminho} já estava corrigido")
        return

    ocorrencias = texto.count(antigo)
    if ocorrencias != 1:
        raise SystemExit(
            f"Esperava exatamente 1 ocorrência em {caminho}, encontrei {ocorrencias}. "
            "A correção foi interrompida para não alterar código inesperado."
        )

    arquivo.write_text(texto.replace(antigo, novo, 1), encoding="utf-8")
    print(f"corrigido: {caminho}")


def main() -> None:
    substituir_exato(
        "src/componentes/AdivinheMusica.tsx",
        """  useEffect(() => {\n    return () => {\n      audioRef.current?.pause();\n    };\n  }, [currentIndex]);""",
        """  useEffect(() => {\n    const audio = audioRef.current;\n    return () => {\n      audio?.pause();\n    };\n  }, [currentIndex]);""",
    )

    substituir_exato(
        "src/componentes/MapaCasalAoVivo.tsx",
        "  }, [myPos, partner, mapRef.current]);",
        "  }, [myPos, partner]);",
    )

    # O rádio foi corrigido diretamente, mas este check impede regressão do
    # mesmo padrão caso o arquivo seja alterado enquanto este lote estiver ativo.
    radio = Path("src/componentes/RadioAoVivo.tsx").read_text(encoding="utf-8")
    if "audioRef.current?.pause();\n    };\n  }, []);" in radio:
        raise SystemExit("RadioAoVivo ainda usa audioRef.current no cleanup do efeito.")

    print("Correções seguras de hooks concluídas.")


if __name__ == "__main__":
    main()

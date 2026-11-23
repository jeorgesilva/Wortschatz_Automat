# Wortschatz-Automat

Mini-jogo de treino de vocabulário para a redação (Schreiben) do Goethe-Zertifikat C1 — tema "Leitungsposition". Visual pixel-art estilo SNES, com uma "slot machine" de 4 rolos. Cada rolo sorteia um item de uma lista diferente (substantivo, preposição/regência, conector, verbo); o objetivo é escrever uma frase curta conectando as 4 palavras sorteadas.

## Como usar

Abra `index.html` direto no navegador — não precisa de servidor nem de build. Se preferir, rode um servidor local simples:

```bash
python3 -m http.server 8000
# depois abra http://localhost:8000
```

## Estrutura

```
index.html      estrutura da página
css/style.css   visual (cabinet, luzes, rolos, editor)
js/script.js    lógica (sorteio, animação dos rolos, editor de listas, localStorage)
```

## Ideias para expandir

- Histórico das últimas combinações sorteadas (e das frases escritas).
- Marcar uma combinação como "difícil" e repeti-la com mais frequência.
- Exportar/importar as listas como JSON (hoje elas só ficam salvas no localStorage do navegador).
- Adicionar um 5º rolo (ex.: um dos Fehler-Targets a praticar nessa rodada).
- Corrigir a frase automaticamente ligando a um modelo (ex.: o `german-corrector-llm`).

## Origem

Esse código nasceu como um artifact interativo gerado numa conversa com o Claude, a partir do pedido de ter algo visual para praticar vocabulário de forma lúdica. As 4 listas padrão (substantivos, preposições/regência, conectores, verbos) foram montadas com base nos erros recorrentes identificados nos textos de prática para a prova C1.

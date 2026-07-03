# Copa 2026 — Painel Premium v6.5

Aplicativo PWA em HTML, CSS e JavaScript, com motor opcional em C++/WebAssembly, para acompanhar resultados, grupos, mata-mata, autores dos gols e artilharia da Copa do Mundo 2026.

## Atualizações da v6.5

- Base estável retomada a partir da v6.3.
- Artilharia ordenada por:
  1. maior número de gols;
  2. nome do jogador em ordem alfabética nos empates.
- Tabela principal limitada aos 10 primeiros.
- Galeria principal com 10 jogadores em destaque, priorizando mais gols e, nos empates, seleções ainda ativas.
- Segundo carrossel menor para outros jogadores com 3 gols que continuam no mata-mata.
- Novas fotos de Cristiano Ronaldo, Folarin Balogun, Ismael Saibari, Jonathan David e Matheus Cunha.
- Fotos padronizadas em 900 × 1200 px com enquadramento uniforme.
- Resultados e eventos cadastrados até Suíça 2 × 0 Argélia, em 03/07/2026.
- Tooltips exibem autor, minuto e indicação de pênalti durante a partida.
- Decisões por pênaltis após prorrogação aparecem separadamente do placar normal.
- Botão **Atualizar dados** consulta primeiro o JSON da ESPN e usa uma fonte alternativa quando necessário.
- Se as fontes externas estiverem indisponíveis, o sistema preserva os dados confiáveis já salvos e mantém a artilharia verificada.

## Publicação no GitHub + Netlify

Envie **todo o conteúdo desta pasta** à raiz do repositório. Confirme que estes itens aparecem diretamente na página inicial do GitHub:

```text
assets/
cpp/
data/
netlify/functions/update-copa.js
app.js
index.html
manifest.json
netlify.toml
service-worker.js
styles.css
```

O Netlify usa automaticamente:

```toml
[build]
  publish = "."
  functions = "netlify/functions"
```

## Atualização automática

O botão chama:

```text
/.netlify/functions/update-copa
```

A função tenta atualizar placares e eventos por uma fonte JSON da ESPN e usa a API comunitária como alternativa. A artilharia confiável é enviada junto com a resposta para impedir que nomes incompletos ou listas agregadas corrompam o ranking.

## Cache do PWA

Depois de publicar uma nova versão:

1. aguarde o deploy do Netlify ficar `Published`;
2. feche a aba antiga;
3. reabra o site;
4. pressione `Command + Shift + R` no Mac ou limpe o cache do navegador no celular.

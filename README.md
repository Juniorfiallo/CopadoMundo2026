# Copa 2026 — Painel Premium v6

Aplicativo web instalável em **HTML, CSS, JavaScript e C++/WebAssembly**, preparado para computador, celular e tablet.

## Novidades da versão 6

- mata-mata com desenho fixo e sem deformação;
- zoom entre **40% e 250%**;
- **100% continua enquadrando toda a chave**;
- centralização automática ao alterar o zoom;
- barra de rolagem horizontal permanente acima da chave e rolagem nativa na parte inferior;
- exportação do mata-mata para impressão/PDF:
  - pôster **A4 horizontal**;
  - pôster **A3 horizontal**;
  - cores, bandeiras, logo, bola, frase **We Are 26**, placares e campeão;
- botão **Atualizar dados** para buscar resultados, autores dos gols e atualizar a artilharia;
- função do Netlify para evitar limitações de CORS e proteger futuras chaves de API.

## Como atualizar com um clique

A versão vem configurada com uma API comunitária de Copa 2026 como fonte automática. O fluxo é:

1. clicar em **Atualizar dados**;
2. o app consulta `/.netlify/functions/update-copa`;
3. a função busca partidas e seleções;
4. os placares, pênaltis, autores dos gols, classificação, chave, agenda e artilharia são recalculados;
5. os dados ficam salvos no navegador.

Ao abrir somente o arquivo `index.html`, o app tenta consultar a fonte diretamente. Para maior estabilidade, publique no Netlify.

### Trocar a fonte automática no Netlify

No painel do Netlify, abra **Site configuration → Environment variables** e configure:

- `WORLD_CUP_GAMES_URL` — endpoint JSON das partidas;
- `WORLD_CUP_TEAMS_URL` — endpoint JSON das seleções;
- `WORLD_CUP_PROVIDER_NAME` — nome mostrado no app;
- `WORLD_CUP_API_TOKEN` — opcional, quando o provedor exigir token Bearer.

A função espera uma fonte com número da partida, seleções, placar, status e, quando disponíveis, autores/minutos dos gols. O arquivo `netlify/functions/update-copa.js` contém o adaptador e pode ser ajustado para qualquer fornecedor.

> O link da FIFA permanece no rodapé para conferência oficial. A página pública de classificação não deve ser tratada como uma API estável do aplicativo.

## Exportar PDF ou imprimir

Na aba **Mata-mata**:

1. clique em **PDF A4** ou **PDF A3**;
2. na janela do navegador, escolha **Salvar como PDF** ou uma impressora;
3. ative **gráficos de plano de fundo** para preservar todas as cores.

## Publicação no Netlify

1. Descompacte este ZIP.
2. Acesse o Netlify Drop.
3. Arraste a pasta `copa-2026-tracker` completa.
4. O arquivo `netlify.toml` já configura a pasta estática e as funções.
5. Depois do primeiro carregamento, o app poderá funcionar offline e ser instalado em dispositivos compatíveis.

## Arquivos principais

- `index.html` — interface;
- `styles.css` — visual, responsividade e impressão;
- `app.js` — placares, chave, artilharia, zoom, PDF e atualização;
- `data/data.js` — base inicial;
- `netlify/functions/update-copa.js` — atualização automática;
- `service-worker.js` — funcionamento offline.

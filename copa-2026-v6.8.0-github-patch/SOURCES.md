# Fontes e critérios de dados

## Referências principais

- FIFA World Cup 2026 — calendário, confrontos e páginas de partidas.
- ESPN Brasil — tabela de artilheiros da Copa do Mundo 2026.
- ESPN JSON Scoreboard — consulta automática de resultados pelo Netlify.

## Critério da artilharia no aplicativo

1. Maior número de gols.
2. Em caso de igualdade, nome do jogador em ordem alfabética.
3. A tabela exibe somente os dez primeiros.
4. O carrossel principal replica exatamente as posições 1–10 e o carrossel secundário replica as posições 11–15.

## Resultados conferidos manualmente nesta versão

- Portugal 2 × 1 Croácia — Cristiano Ronaldo, de pênalti aos 68 minutos; Gonçalo Ramos aos 90+4; Ivan Perišić aos 53.
- Espanha 3 × 0 Áustria — Mikel Oyarzabal aos 36 e 89; Pedro Porro aos 66.
- Suíça 2 × 0 Argélia — Breel Embolo aos 10; Dan Ndoye aos 46.

## Fontes adicionadas na v6.8.0

- Ranking de artilheiros: ge.globo, matéria “Artilharia da Copa do Mundo 2026: veja lista de goleadores”, atualizada em 05/07/2026.
- Resultados e eventos: FIFA, ESPN Scoreboard/Summary e fonte comunitária como contingência.
- Brian Brobbey: retrato oficial disponibilizado pelo OnsOranje/KNVB.
- Cody Gakpo: retrato de perfil exibido pelo oGol; carregamento remoto para manter o top 10 completo.
- Imagem “Brasil, Rumo ao Hexa”: fotografia da Seleção Brasileira usada no rodapé do pôster, com crédito preservado na página-fonte.

## Regra de sincronização

1. O ranking completo recebido da fonte de artilharia substitui o snapshot-base.
2. Gols novos identificados no mata-mata são comparados ao snapshot e somados automaticamente sem duplicação.
3. A lista, o carrossel 1–10 e o carrossel 11–15 são renderizados novamente após cada atualização.
4. Pênaltis durante a partida contam como gol; cobranças de disputa após empate não entram na artilharia.

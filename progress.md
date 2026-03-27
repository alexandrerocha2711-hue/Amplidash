Original prompt: Integrar `src/melhores/` ao Notion oficial do "The Best", sincronizando pontuações manualmente editadas no Notion com o dashboard/jogo e adicionando um botão de zerar pontuação para reset trimestral.

- Decisão: a tabela de classificação do Notion vira o placar oficial para leitura/escrita.
- Decisão: as metas semanais continuam sendo lidas das tabelas manuais de categorias no próprio Notion.
- Decisão: a integração usa uma camada server-side (`/api/melhores/*`) para não expor `NOTION_API_KEY` no frontend.
- Em dev, o Vite responde esses endpoints via middleware local; em produção, os handlers em `api/melhores/*.js` podem ser usados como serverless.
- O botão "Zerar pontuação" zera a classificação atual e o ranking resumido; ele não apaga histórico antigo por padrão.
- Pendências para próxima rodada: validar a integração com um token real do Notion e decidir se vale sincronizar também as linhas históricas semanais por categoria.

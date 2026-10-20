# GEMINI.md

As instruções deste projeto estão em **`AGENTS.md`** (raiz). Leia-o inteiro antes de alterar código.

Complementos:

- `.agent/rules/` — regras por assunto (`core.md` sempre ativa; `testing.md` para `*.spec.ts`; `styles.md` para templates e estilos).
- `.agent/workflows/` — passo a passo: `/new-feature` (nova tela CRUD) e `/check` (Prettier + build + testes).

Resumo do que não pode ser esquecido:

1. Componentes standalone, `inject()`, signals e control flow `@if`/`@for`.
2. Serviços usam URLs relativas `/api/v1/...`; os interceptors resolvem central × tenant, token e erros.
3. Respostas da API não vêm envolvidas em `data`, exceto listas paginadas.
4. Erros chegam como `ApiErrorResponse`: mostre com `ToastService` e jogue `errors` (422) nos campos.
5. Use as páginas de `features/central/tenants/` como referência e rode `/check` antes de concluir.

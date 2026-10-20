---
description: Cria uma nova tela CRUD (model, serviço, páginas de lista/criação/detalhe, rotas e testes) consumindo um recurso da API
---

# Nova tela CRUD

Antes de começar, pergunte ao usuário (se não estiver claro): contexto **Central ou Tenant**, qual recurso da API, quais telas (lista, criação, edição/detalhe) e quem pode acessar.

Leia como referência antes de escrever código:
- `src/app/features/central/tenants/` (serviço, spec e as três páginas);
- `src/app/app.routes.ts`;
- no backend (`../headless`): o FormRequest e o Resource do recurso (`app/Http/Requests/<Ctx>/<Recurso>/`, `app/Http/Resources/<Ctx>/<Recurso>/`) e as rotas (`routes/api.php` ou `routes/tenant.php`).

Abaixo, `{ctx}` = `central` ou `tenant`, `{modulo}` = recurso no plural em kebab-case (ex.: `banners`), `{item}` = singular (ex.: `banner`).

1. **Model** `src/app/core/models/{item}.model.ts` com `XxxDto`, `CreateXxxDto`, `UpdateXxxDto` espelhando o Resource e o FormRequest (snake_case). Reexporte em `core/models/index.ts` (se já existir, confira se está igual ao backend).
2. **Serviço** `src/app/features/{ctx}/{modulo}/services/{modulo}.service.ts` com `get/create/update/delete`, URLs relativas `/api/v1/...`, sem wrapper `data` (exceto paginação).
3. **Spec do serviço** `{modulo}.service.spec.ts` com `HttpTestingController` cobrindo método, URL e corpo de cada chamada.
4. **Página de lista** `pages/{item}-list/`: `mat-table`, `mat-progress-bar`, linha `*matNoDataRow` com estado vazio, `mat-paginator` se paginado, exclusão com `ConfirmDialogComponent` + toast.
5. **Página de criação** `pages/{item}-create/`: Reactive Form com validadores iguais ao FormRequest, `validationErrors` para 422, spinner no botão, redireciona para a lista ao salvar.
6. **Página de detalhe/edição** `pages/{item}-detail/` (se aplicável): carrega por `uuid` da rota, PATCH só com campos alterados.
7. **Rotas** em `app.routes.ts` com `loadComponent`, dentro do layout/guard do contexto. Ordem: `{modulo}`, `{modulo}/new`, `{modulo}/:uuid`.
8. **Navegação**: adicione o link no layout do contexto (ex.: `central-layout.component.html`).
9. Execute o workflow `/check` e corrija tudo até passar.
10. Mostre ao usuário um resumo dos arquivos criados e das rotas novas.

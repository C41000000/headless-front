# AGENTS.md — Guia para agentes de IA

SPA em **Angular 22** (standalone, signals, Angular Material) que consome a API headless multi-tenant do repositório irmão `../headless` (Laravel). O mesmo build atende dois contextos: o **painel central** da plataforma e o **site/painel de cada tenant**.

Leia este arquivo inteiro antes de alterar código. Regras detalhadas por assunto ficam em `.agent/rules/`, e passo a passo de tarefas comuns em `.agent/workflows/`.

---

## Stack

| Item | Uso |
| :--- | :--- |
| Angular 22 (`@angular/build:application`) | Componentes standalone, control flow `@if`/`@for`, signals |
| Angular Material + CDK 22 | Todos os componentes de UI (tema `azure-blue`) |
| RxJS 7.8 | Chamadas HTTP (`HttpClient`) |
| Vitest 5 + jsdom (`@angular/build:unit-test`) | Testes unitários (`*.spec.ts`) |
| Prettier 3 | Formatação (`printWidth: 100`, aspas simples, parser `angular` para HTML) |
| TypeScript 6 | Aliases `@core/*`, `@shared/*`, `@features/*`, `@env/*` |

## Comandos

```bash
npm start                                   # ng serve em http://localhost:4200 (proxy /api -> http://localhost:8001)
npm run build                               # build de produção (respeita os budgets do angular.json)
npx ng test --watch=false                   # testes uma vez (Vitest)
npx prettier --check "src/**/*.{ts,html,scss}"
npx prettier --write <arquivos alterados>
```

A API precisa estar de pé (`docker compose up -d` em `../headless`) para testar no navegador.

Antes de dar uma tarefa por concluída: **Prettier, build e testes precisam passar.**

---

## Estrutura

```
src/app/
  app.config.ts / app.routes.ts      # providers globais, interceptors, rotas (lazy com loadComponent)
  core/                              # singletons, sem UI
    auth/token.service.ts            # tokens JWT central/tenant (signals + localStorage)
    tenant/tenant-context.service.ts # descobre se estamos no central ou em um tenant
    tenant/visual-identity.service.ts# carrega e aplica a identidade visual do tenant (APP_INITIALIZER)
    http/                            # interceptors: base URL, auth, erros
    models/                          # interfaces dos payloads da API (*Dto), reexportadas em index.ts
    toast/                           # ToastService (MatSnackBar)
  shared/components/                 # componentes reutilizáveis (ex.: ConfirmDialogComponent)
  features/
    central/<modulo>/                # painel central (rotas /admin/...)
      pages/<pagina>/                # componentes roteáveis: .ts + .html + .scss
      services/                      # serviço HTTP do módulo (+ .spec.ts)
      guards/                        # CanActivateFn
    tenant/<modulo>/                 # mesmo padrão para o contexto tenant
```

Cada pasta de `core/` e `shared/components/<x>/` tem um `index.ts` (barrel). Importe por alias: `@core/models`, `@core/toast`, `@shared/components/confirm-dialog`.

---

## Central × Tenant

O contexto é decidido pelo `TenantContextService`, na inicialização:

1. Query string `?tenant=empresa.localhost` (override de dev, salvo no `localStorage`);
2. Override salvo no `localStorage` (`headless_dev_tenant_override`);
3. Hostname: se estiver em `environment.centralDomains` → **central**; senão o hostname inteiro é o domínio do tenant.

Consequências:
- **Use sempre URLs relativas** (`/api/v1/...`) nos serviços. O `apiBaseUrlInterceptor` monta a URL absoluta: central → `environment.centralApiUrl`; tenant → mesmo host/porta com o hostname trocado pelo domínio do tenant (o backend identifica o tenant pelo domínio).
- O `authInterceptor` escolhe o token certo (`centralToken` ou `tenantToken`) e adiciona `Accept: application/json` + `Authorization: Bearer`.
- O `apiErrorInterceptor` converte qualquer erro em `ApiErrorResponse` (`status`, `message`, `errors`, `retryAfter`) e, em 401, limpa o token e redireciona (`/admin/login` no central, `/auth/login` no tenant).
- Rotas do central ficam sob `/admin` com `centralAuthGuard`/`centralGuestGuard`.
- Rotas do tenant: `/auth/login` (`tenantGuestGuard`) e `/painel` (`tenantAuthGuard` + `TenantLayoutComponent`); novas páginas do tenant entram como filhas de `painel`.
- Para testar um tenant no `localhost`, abra `http://localhost:4200/?tenant=empresa.localhost` (o override fica salvo; `setDevTenantOverride(null)` volta ao central).

### Endpoints da API (backend `../headless`)

| Contexto | Base | Exemplos |
| :--- | :--- | :--- |
| Central | `/api/v1` | `auth/login`, `users`, `tenants`, `tenants/{uuid}/domains` |
| Tenant público | `/api/v1` | `visual-identity`, `banners?placement=home` |
| Tenant autenticado | `/api/v1` | `users`, `admin/visual-identity`, `admin/banners` |

Formato das respostas:
- O backend usa `JsonResource::withoutWrapping()`: **objetos e coleções simples vêm sem a chave `data`**.
- **Listas paginadas** vêm como `PaginatedResponse<T>` (`data`, `links`, `meta`).
- `DELETE` e `PATCH` (update) retornam 204 sem corpo: tipe como `Observable<void>` e use os valores enviados para atualizar a tela. `POST` de criação retorna 201 com o recurso.
- Erros de validação: 422 com `errors: Record<campo, string[]>` (mensagens já em pt-BR). Campos de arrays chegam como `domains.0`.
- Recursos são identificados por `uuid` (nunca `id`). Datas são strings ISO 8601.
- PATCH é parcial: envie só os campos alterados.

Na dúvida sobre um campo ou regra de validação, consulte `../headless/app/Http/Requests/` e `../headless/app/Http/Resources/`, ou a doc em `http://localhost:8001/docs/api`.

---

## Convenções de código

### Componentes
- Standalone (`standalone: true`), `imports` explícitos só com o que o template usa (módulos do Material individualmente: `MatButtonModule`, `MatIconModule`...).
- Template e estilo em arquivos separados: `templateUrl` + `styleUrl` (`.scss`). Template inline só em componentes pequenos de `shared/`.
- Seletor com prefixo `app-` e nome de arquivo `kebab-case.component.ts`; classe `PascalCaseComponent`.
- Injeção com `inject()` em campos `private readonly`, nunca no construtor.
- Estado local em `signal()` (`isLoading`, `validationErrors`, listas, `deletingUuid`...). Use `computed()` para derivados.
- Modificadores explícitos: `public`/`private`/`protected` + `readonly` sempre que possível.
- Templates com control flow novo (`@if`, `@for (...; track item.uuid)`, `@empty`), nunca `*ngIf`/`*ngFor`.

### Formulários
- Reactive Forms com `FormBuilder` (`inject(FormBuilder)`), validadores espelhando as regras do FormRequest do backend.
- No submit: se `form.invalid`, `markAllAsTouched()` e retorna; evite submit duplo checando `isLoading()`.
- Erros 422 do backend vão para `validationErrors` (signal) e são exibidos em `<mat-error>` do campo correspondente, além do toast.

### Serviços HTTP
- Um serviço por módulo em `features/<ctx>/<modulo>/services/`, `@Injectable({ providedIn: 'root' })`, `private readonly http = inject(HttpClient)`.
- Métodos públicos retornam `Observable<T>` tipado com as interfaces de `@core/models`. Paginação com `HttpParams`.
- Não trate erro dentro do serviço: o componente faz `subscribe({ next, error: (error: ApiErrorResponse) => ... })` e mostra `toastService.error(error.message || 'mensagem padrão')`.

### Models
- Interfaces em `src/app/core/models/<recurso>.model.ts`, reexportadas em `index.ts`.
- Nomes: `XxxDto` (resposta), `CreateXxxDto`, `UpdateXxxDto` (campos opcionais). Propriedades em `snake_case`, idênticas às da API.
- Campos anuláveis da API: `string | null`; datas: `string`.

### UI / UX
- Angular Material para tudo: `mat-card appearance="outlined"`, `mat-table`, `mat-paginator`, `mat-form-field appearance="outline"`, `mat-flat-button`/`mat-stroked-button`, `mat-icon`.
- Feedback: `ToastService` (`success`, `error`, `info`, `warning`). Confirmação de ações destrutivas: `MatDialog` + `ConfirmDialogComponent` com `color: 'warn'`.
- Loading: `mat-progress-bar` em listas, `mat-spinner diameter="20"` dentro de botões.
- Layout de página: `.page-container` > `.page-header` (`.page-title` + `.page-subtitle`) > conteúdo. Copie as classes das páginas de `features/central/tenants/pages/`.
- Cores do tenant via variáveis CSS (`--tenant-primary`, `--tenant-secondary`, `--tenant-accent`, `--tenant-font`), definidas pela identidade visual. Não fixe cores de marca em componentes do contexto tenant.
- Respeite o budget de estilo por componente (aviso em 6 kB, erro em 10 kB).

### Geral
- Textos de interface, mensagens e comentários em **português (pt-BR)**; identificadores em inglês.
- Comentários explicam o *porquê*; mantenha a densidade do código ao redor.
- Acesso a `window`/`localStorage` sempre protegido (`typeof window !== 'undefined'`), como em `TokenService`.
- Rotas novas com `loadComponent` (lazy) em `app.routes.ts`.
- Commits: Conventional Commits em pt-BR com escopo (`feat(central): ...`, `fix(tenant): ...`).

---

## Armadilhas conhecidas

- TypeScript e templates estão em modo estrito (`strict` + `strictTemplates`). Não desligue nem use `any` para contornar erros.
- Não crie wrappers do tipo `ApiResponse<T>`/`unwrap()`: o backend não envolve objetos simples em `data`.
- Os guards checam o contexto: rotas `/admin` em domínio de tenant redirecionam para `/painel`, e rotas do tenant (`/auth/login`, `/painel`) no central redirecionam para `/admin`. A raiz `''` e `**` redirecionam conforme o contexto (`contextHome` em `app.routes.ts`).
- Não altere `environment.ts` com URLs/domínios pessoais sem pedir; não edite `dist/`, `.angular/` ou `node_modules/`.

## Testes

- Vitest via `ng test`, arquivos `*.spec.ts` ao lado do código. Detalhes em `.agent/rules/testing.md`.

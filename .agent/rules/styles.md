---
trigger: glob
globs: src/**/*.{html,scss}
---

# Templates e estilos

- Control flow nativo: `@if (...) { } @else { }`, `@for (item of items(); track item.uuid) { } @empty { }`. Use `track $index` só em `FormArray`.
- Signals no template são chamados como função: `isLoading()`, `tenants()`.
- Componentes Material: `mat-card appearance="outlined"`, `mat-form-field appearance="outline"` com `mat-label`, `mat-icon matPrefix` e `mat-error`; botões `mat-flat-button color="primary"` (ação principal), `mat-stroked-button` (secundária), `mat-button` (cancelar/voltar), `mat-icon-button color="warn"` + `matTooltip` (excluir).
- Ícones são ligaduras do Material Icons (`<mat-icon>delete_outline</mat-icon>`).
- Estrutura de página: `.page-container` > `.breadcrumb` (opcional) > `.page-header` (`.page-title`, `.page-subtitle`) > `mat-card`. Reaproveite os estilos das páginas de `features/central/tenants/pages/`.
- SCSS por componente, aninhado sob a classe do bloco. Sem `::ng-deep`; para customizar o Material use as variáveis CSS do tema (como em `src/styles.scss`).
- No contexto tenant, cores e fonte de marca vêm de `var(--tenant-primary)`, `var(--tenant-secondary)`, `var(--tenant-accent)` e `var(--tenant-font)`.
- Estilos de um componente: até 6 kB (aviso) / 10 kB (erro no build). Estilos realmente globais vão em `src/styles.scss`.
- Acessibilidade: `aria-label` em paginadores e botões só com ícone; `type="button"` em botões que não submetem o form.
- Textos visíveis em pt-BR.

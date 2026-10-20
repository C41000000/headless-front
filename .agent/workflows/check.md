---
description: Roda Prettier, build e testes e corrige o que falhar
---

# Verificação de qualidade

1. Formate os arquivos alterados:
   `npx prettier --write <arquivos alterados>`
   e confira: `npx prettier --check "src/**/*.{ts,html,scss}"`
2. Build (pega erros de tipo, de template e de budget):
   `npm run build`
   Corrija os erros no código. Não aumente os budgets do `angular.json` sem perguntar ao usuário.
3. Testes:
   `npx ng test --watch=false`
   Se algo falhar, leia a saída, corrija a causa (não o teste, a menos que o teste esteja errado) e rode de novo.
4. Relate o resultado real de cada etapa ao usuário, incluindo falhas que não puderam ser resolvidas.

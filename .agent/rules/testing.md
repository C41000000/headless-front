---
trigger: glob
globs: src/**/*.spec.ts
---

# Testes (Vitest via `ng test`)

- Arquivos `*.spec.ts` ao lado do código testado. Rodar uma vez: `npx ng test --watch=false`.
- API do Vitest com globals (`describe`, `it`, `expect`, `beforeEach`, `afterEach`), sem importar de `vitest` a menos que precise de `vi`.
- Descrições em inglês: `it('should create tenant', ...)`.

## Serviços HTTP

```ts
describe('XxxService', () => {
  let service: XxxService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(XxxService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create xxx', () => {
    const payload = { /* ... */ };

    service.createXxx(payload).subscribe((res) => {
      expect(res.uuid).toBe('xxx-1');
    });

    const req = httpMock.expectOne('/api/v1/xxx');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ uuid: 'xxx-1' /* ... */ });
  });
});
```

- Os interceptors não são registrados nesses testes, então as URLs esperadas são as relativas.
- Mocks de resposta devem ter o mesmo formato da API real (sem wrapper `data`, exceto paginação).
- Cubra pelo menos: listagem (com paginação, se houver), criação, atualização e exclusão — método HTTP, URL e corpo.

## Componentes

- `TestBed.configureTestingModule({ imports: [XxxComponent], providers: [...] })`.
- Para serviços, prefira mocks simples (`{ provide: XxxService, useValue: { getXxx: vi.fn(() => of(...)) } }`).
- Componentes com Material/animations podem precisar de `provideNoopAnimations()`.
- Signals: leia com `component.isLoading()` e chame `fixture.detectChanges()` antes de checar o DOM.

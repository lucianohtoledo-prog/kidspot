# KidSpot (Expo / React Native)

KidSpot é um **mapa otimizado para famílias**, que ajuda a encontrar os melhores lugares e eventos *kids‑friendly* com segurança, praticidade e curadoria comunitária.

## Rodando em 2 minutos (modo DEMO)

1. **Pré‑requisitos**: Node 18+ e `npm` ou `pnpm`.
2. Baixe o .zip e extraia. No terminal, dentro da pasta do projeto:
   ```bash
   npm install
   npm run start
   ```
3. Escaneie o QR code com o app **Expo Go** (Android/iOS) ou aperte `a`/`i` para abrir no emulador.
4. O app inicia em **modo DEMO** (sem chaves). Você verá:
   - Mapa centralizado em São Paulo (usa GPS se permitido).
   - Lista sincronizada de locais (dados demo).
   - Aba **Eventos** com calendário simplificado (lista demo).
   - Tela de **Detalhe** do local com chips de facilidades.
   - **Parceiro** e **Admin** com telas funcionais de demonstração (sem persistência).

> Para sair do demo e ativar as integrações reais, siga as seções abaixo.

---

## Integrações Reais

### 1) Google Maps & Places
- Crie uma API Key no Google Cloud com:
  - Places API
  - Maps SDK for Android
  - Maps SDK for iOS
  - (Opcional) Geocoding API
- Copie `.env.example` para `.env` e preencha:
  ```env
  EXPO_PUBLIC_DEMO_MODE=false
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=SEU_TOKEN_AQUI
  ```
- Reinicie o Expo: `npm run start`.
- O app fará **Nearby Search** e **Details** usando os serviços do Google e exibirá no mapa/lista.

### 2) Firebase (Auth + Firestore + Storage)
- Crie um projeto Firebase e copie as credenciais Web para o `.env`:
  ```env
  EXPO_PUBLIC_FIREBASE_API_KEY=...
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
  EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
  EXPO_PUBLIC_FIREBASE_APP_ID=...
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
  ```
- Com isso você pode implementar:
  - Login/registro reais.
  - Persistência de Locais, Eventos, Reviews, Favoritos.
  - Fluxos de moderação (status: draft, pending, approved, rejected).
  - Impulsionamento: setar `boostedUntil` (timestamp) para ranquear no topo.

### 3) IA de Curadoria
- O arquivo `services/curation.ts` contém uma heurística que pode ser trocada
  por uma chamada a um provedor de LLM. A função **`scorePlace`** pondera
  *googleRating*, facilidades e impulsionamento.

---

## Estrutura de Pastas (principal)
```
app/
  (tabs)/
    index.tsx         # Home: mapa + lista + filtros
    events.tsx        # Calendário/Lista de eventos
    favorites.tsx     # Favoritos (placeholder)
  local/[id].tsx      # Detalhe do local
  partner/index.tsx   # Dashboard do Parceiro (demo)
  admin/index.tsx     # Admin (moderação/impulsão - demo)
  auth/login.tsx      # Login (demo)
  auth/register.tsx   # Registro (demo)
  _layout.tsx         # Layout raiz (Tabs)
components/           # Cards, chips, filtros, mapa
context/              # Auth, Filtros, Places
services/             # Firebase, Places, Curation, Location
data/demo/            # Dados demo para rodar sem chaves
types/models.ts       # Tipos/Interfaces do domínio
```

---

## Roadmap (sugestão)
- [ ] Persistir tudo no Firestore (Locais, Eventos, Reviews, Favoritos).
- [ ] Métricas no Dashboard do Parceiro (views/favorites por período).
- [ ] Moderação (Admin) com Cloud Functions para segurança.
- [ ] Upload de fotos (Storage) e galeria no Detalhe.
- [ ] Filtros avançados (aberto agora, faixa etária, tipo de comida) cruzando dados Places+KidSpot.
- [ ] Google OAuth.
- [ ] Deep links e compartilhamento.
- [ ] Testes E2E com Maestro/Detox.

---

## Observações importantes
- Este projeto foi entregue **sem `node_modules`**. Após extrair, execute `npm install`.
- **SDK e versões**: `expo@^51`, `react-native@0.74.x`, `react@18`. Se já tiver outro ambiente, ajuste as versões conforme necessário.
- No iOS/Android nativos, chaves do Maps já são lidas de `app.config.js`.

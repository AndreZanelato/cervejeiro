# Cervejeiro

App para salvar receitas cervejeiras e acompanhar brassagens (MVP).

## Stack proposta
- Next.js (frontend + API routes)
- Firebase Auth (email/password) + Firestore (dados)
- Firebase Emulator Suite para dev local
- SMTP (Gmail) para envio de notificações por e-mail
- PWA básico (manifest + service worker)
- Tailwind CSS (UI)

---

## Setup local (resumido)
1. Crie um projeto no Firebase Console.
2. Habilite **Authentication -> Email/Password** e **Firestore**.
3. Faça download do Service Account JSON (se precisar do Admin SDK) e salve em `serviceAccountKey.json` (ou aponte via `GOOGLE_APPLICATION_CREDENTIALS`).
4. Copie `.env.local.example` para `.env.local` e preencha as variáveis.
5. Instale dependências:

   npm install

6. Inicie emuladores do Firebase (opcional, recomendado para dev):

   npm run emulators

7. Em outro terminal, rode o Next.js em modo dev:

   npm run dev

8. Crie um usuário admin manualmente no Firebase Console e adicione a claim `role: "admin"` (ou use o script de seed/admin).

---

### Testando a proteção de admin
- Os endpoints administrativos (`/api/admin/*`) verificam o ID token do usuário e exigem a claim `role: 'admin'`.
- Para testar via cliente web, faça login com o usuário admin e, ao criar recursos administrativos no dashboard, o cliente enviará o token automaticamente ao chamar os endpoints protegidos (veja `lib/adminApi.js`).
- Exemplo: `POST /api/admin/create-recipe` espera `Authorization: Bearer <ID_TOKEN>` e criará a receita com `authorId` igual ao UID do admin.

---

---

## Firestore Rules (exemplo)
Veja `firestore.rules` para as regras iniciais: leitura pública de `recipes`, escrita restrita a admins, brewSessions acessíveis pelo dono e admins.

---

## Notificações
- In-app: coleção `notifications` + `onSnapshot` no cliente. Usuários podem marcar notificações como lidas com endpoints: `POST /api/notifications/:id/mark-read` e `POST /api/notifications/mark-all-read`.
- Push (FCM): suporte a Web Push via FCM (PWA). Adicione `NEXT_PUBLIC_FCM_VAPID_KEY` no `.env.local`. Usuários podem ativar push no painel de notificações; tokens são registrados em `fcmTokens` e o servidor envia push via Admin SDK. Tokens inválidos são automaticamente removidos quando o envio falha e o servidor loga resultados em `brewSessions.{id}.notificationsSent`.
- E-mail: rota de backend `/api/send-email` usa SMTP/Gmail (via `nodemailer`); envios por etapas também são logados em `brewSessions.{id}.notificationsSent`.

---

## Próximos passos
- Implementar páginas admin (CRUD de receitas) e fluxo de BrewSession.
- Adicionar PWA offline caching para receitas visitadas.

### Brew Sessions (modelo e testes)
- Coleção: `brewSessions/{sessionId}`
  - Campos: `userId`, `recipeId`, `status`, `startAt`, `steps`, `logs`, `createdAt`, `updatedAt`, `notificationsSent`
  - `steps` é um array com objetos `{ id, title, type, order, tempTarget, durationMin, ramp }`
  - `logs` é um array de `{ stepId, temp, ts }` usado para histórico simples (podemos mover para subcoleção para alta taxa de escrita)
- Regras: criação feita pelo dono (userId == request.resource.data.userId) ou admin; leitura/atualização apenas para dono ou admin (veja `firestore.rules`).
- Endpoints API já adicionados: `POST /api/sessions` (cria sessão), `GET /api/sessions` (lista minhas sessões), `POST /api/sessions/:id/logs` (adiciona log de temperatura). O cliente usa `lib/sessionApi.js`.
- Endpoints de etapa: `POST /api/sessions/:id/step/:stepId` aceita { action: 'start' | 'complete' } e cria notificações in-app e envia e-mail (SMTP) ao completar etapas.

### Como testar (quick)
1. Rode `npm run emulators` e `npm run dev`.
2. Crie admin (seed) ou via Firebase Console; use admin para criar receita `sample-ipa` via seed.
3. Logue como usuário (admin ou outro), vá em `/sessions`, crie e acompanhe sessão em `/sessions/:id`.

### Testes automatizados
- Rodar testes unitários com vitest:

  npm run test

- Os testes atuais cobrem o endpoint de etapa (`/api/sessions/:id/step/:stepId`) e mockam Gmail/FCM/Firebase Admin para validação de comportamento (envios, remoção de tokens inválidos e logging).
### Como testar CRUD (admin)
- Crie um usuário admin no Firebase Console e adicione `role: 'admin'` como custom claim.
- Faça login em `/admin/login`, acesse `/admin/recipes` e use os botões para criar/editar/excluir.
- As rotas administrativas (`/api/admin/recipes`) esperam `Authorization: Bearer <ID_TOKEN>`; o frontend automaticamente envia o token nas requests.

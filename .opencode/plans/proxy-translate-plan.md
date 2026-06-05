# Proxy HTTP para /api/translate

## Motivação
O endpoint `/api/translate` usa o Google Translate público (sem API key).
Se atingir rate-limit (429 Too Many Requests), redirecionar por um proxy resolve.

## Passos

### 1. Instalar dependência
```bash
npm install https-proxy-agent
```

### 2. Modificar `src/app/api/translate/route.ts`
Trocar:
```ts
const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0' },
  signal: AbortSignal.timeout(5000),
});
```
Por:
```ts
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyUrl = process.env.TRANSLATE_PROXY_URL?.trim();
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

const res = await fetch(url, {
  agent,
  headers: { 'User-Agent': 'Mozilla/5.0' },
  signal: AbortSignal.timeout(5000),
});
```

### 3. Adicionar ao `.env.example`
```
# Opcional. Proxy para contornar rate-limit do Google Translate.
# Ativar quando começar a receber 429 Too Many Requests.
# Buscar proxies públicos em free-proxy-list.net (Google: yes, Anonymous).
TRANSLATE_PROXY_URL=
```

### 4. Verificar
```bash
npm run typecheck
```

## Quando usar

1. Perceber 429 nos logs da Vercel
2. Ir em `free-proxy-list.net`
3. Filtrar por `Google: yes` + `Anonymity: anonymous`
4. Copiar um `IP:PORT` (ex: `http://103.152.112.162:80`)
5. Setar `TRANSLATE_PROXY_URL` no ambiente da Vercel (ou no `.env` local)
6. Se o proxy parar, repetir passo 2–4 com outro IP

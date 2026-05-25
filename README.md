# 🥗 BioTrack — Registro de Calorias e Jejum Intermitente

Aplicação web full-stack para acompanhamento de consumo calórico e jejum intermitente. Permite registrar refeições, definir metas diárias, acompanhar ciclos de jejum e visualizar progresso semanal.

> ⚠️ **Aviso:** Esta aplicação é um exercício acadêmico e **não substitui orientação médica ou nutricional.**

---

## 🔗 Deploy

**URL em produção:** `https://SEU-PROJETO.vercel.app` ← substitua após o deploy

---

## 🖼️ Screenshots

> Adicione screenshots das telas principais aqui após o deploy.

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript |
| Autenticação | Firebase Authentication |
| Banco de dados | Firestore (Firebase) |
| Estilização | Tailwind CSS v4 |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Deploy | Vercel |

---

## ✅ Funcionalidades

- **Autenticação:** cadastro, login, logout e recuperação de senha
- **Rotas protegidas:** redirecionamento automático para login se não autenticado
- **Refeições (CRUD completo):** criar, listar com filtro por data, editar e excluir com confirmação
- **Meta calórica:** definir e editar a qualquer momento, barra de progresso com cor dinâmica
- **Jejum intermitente:** iniciar/encerrar com timer em tempo real, protocolos 14:10, 16:8, 18:6, 20:4, 24h e personalizado
- **Histórico de jejuns:** listagem dos jejuns concluídos
- **Resumo semanal:** gráfico de calorias e gráfico de horas de jejum dos últimos 7 dias
- **Indicadores agregados:** média diária de calorias, total de jejuns e tempo médio de jejum na semana
- **Responsivo:** funciona em mobile e desktop

---

## 📦 Setup local

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no [Firebase](https://firebase.google.com)

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais do Firebase:

```bash
cp .env.example .env.local
```

Edite o `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

> Encontre esses valores em: [Firebase Console](https://console.firebase.google.com) → seu projeto → ⚙️ Configurações → Seus apps

### 4. Configure o Firebase

No Firebase Console, ative:
- **Authentication** → método de login por **E-mail/senha**
- **Firestore Database** → crie um banco no modo de produção

### 5. Rode o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 🌍 Variáveis de ambiente necessárias

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Chave de API do Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID do projeto |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de storage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ID do sender |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ID do app |

---

## 🚀 Deploy na Vercel

1. Faça push do repositório para o GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. Em **Environment Variables**, adicione todas as variáveis do `.env.example` com seus valores reais
4. Clique em **Deploy**

---

## 👤 Autor

Desenvolvido como trabalho final da disciplina — TSI Senac
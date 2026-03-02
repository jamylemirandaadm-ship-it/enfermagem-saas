# 🩺 Enfermagem Pro

**SaaS educacional para estudantes e profissionais de enfermagem**, focado em cálculos do dia a dia, consulta rápida e organização pessoal.

➡️ **Aplicação online:** enfermagem-saas.vercel.app/login

---

## 🇧🇷 Português (PT-BR)

### ✨ Visão Geral
O **Enfermagem Pro** é um aplicativo web criado para apoiar estudantes e profissionais de enfermagem na rotina de estudos, estágios e prática clínica, oferecendo ferramentas rápidas, organizadas e confiáveis.

O projeto foi **validado por uma enfermeira real**, está em uso ativo e segue em constante evolução.

> ⚠️ **Aviso importante:**  
> Este projeto tem **finalidade exclusivamente educacional** e **não substitui** protocolos institucionais, prescrição médica, supervisão profissional ou julgamento clínico.

---

### ✅ Funcionalidades

#### 🔐 Autenticação
- Login e cadastro com Firebase Authentication
- Proteção de rotas (usuários não autenticados não acessam o sistema)
- Logout funcional

#### 🧮 Calculadora de Medicação
- Regra de três (mg → mL)
- Validação de dados de entrada
- Cálculo automático e confiável
- Salvamento dos cálculos no Firestore

#### 💧 Calculadora de Gotejamento
- Cálculo em mL/h
- Cálculo em gotas/min (20 gtt)
- Cálculo em microgotas/min (60 gtt)
- Salvamento automático no Firestore

#### 📜 Histórico
- Histórico individual por usuário
- Atualização em tempo real
- Exclusão de registros
- Organização clara dos cálculos realizados

#### 📘 Abreviações e Terminologia
- Página dedicada para consulta rápida
- Busca inteligente
- Filtro por categorias
- Copiar para área de transferência
- Sistema de favoritos (localStorage)
- Conteúdo validado por profissional de enfermagem

---

### 🧱 Tecnologias Utilizadas
- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase Authentication**
- **Firestore Database**
- **Vercel** (deploy automático)

---

### 🚀 Como Rodar o Projeto Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

Acesse a pasta do projeto:

cd enfermagem-pro

Instale as dependências:

npm install

Crie o arquivo .env.local na raiz do projeto e configure o Firebase:

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

Inicie o servidor de desenvolvimento:

npm run dev

Acesse no navegador:

http://localhost:3000
🗺️ Roadmap

🔒 Controle de acesso por tempo (teste e assinatura)

📝 Simulados de enfermagem (questões + resultado)

🧠 Patologias em formato de mini-cards

📄 Modelos de anotações e prescrições (educacional)

🎨 Melhoria visual e identidade da marca

💰 Sistema de monetização (Plano Pro)

📩 Contato

Email / WhatsApp: jamylemirandaadm@gmail.com - (13) 99717-1972

🇺🇸 English (EN)
✨ Overview

Enfermagem Pro is an educational SaaS designed for nursing students and professionals, focused on daily calculations, quick reference, and personal organization.

The project has been validated by a real nurse, is already in use, and continues to evolve.

⚠️ Disclaimer:
This project is for educational purposes only and does not replace institutional protocols, medical prescriptions, professional supervision, or clinical judgment.

✅ Features
🔐 Authentication

Firebase Authentication (sign up, login, logout)

Route protection for authenticated users

🧮 Medication Calculator

Rule of three (mg → mL)

Input validation

Automatic and accurate calculations

Results saved to Firestore

💧 IV Drip Calculator

mL/h calculation

Drops/min (20 gtt)

Microdrops/min (60 gtt)

Automatic saving to Firestore

📜 History

Per-user calculation history

Real-time updates

Ability to delete records

📘 Abbreviations & Terminology

Dedicated quick-reference page

Smart search

Category filters

Copy to clipboard

Favorites system (localStorage)

Content validated by a nursing professional

🧱 Tech Stack

Next.js (App Router)

TypeScript

Tailwind CSS

Firebase Authentication

Firestore Database

Vercel (automatic deployment)

🚀 Getting Started (Local Setup)

Clone the repository:

git clone https://github.com/YOUR-USER/YOUR-REPOSITORY.git

Install dependencies:

npm install

Create a .env.local file and configure Firebase:

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

Run the development server:

npm run dev

Open in your browser:

http://localhost:3000
🗺️ Roadmap

🔒 Time-based access control (trial/subscription)

📝 Nursing quizzes

🧠 Pathology mini-cards

📄 Nursing note templates (educational)

🎨 Visual branding improvements

💰 Monetization (Pro plan)

📩 Contact

Email / WhatsApp: jamylemirandaadm@gmail.com - (13) 99717-1972
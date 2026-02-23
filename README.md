# 🖨️ Loja Visual Art – API Backend

API backend do e-commerce público da **Loja Visual Art**, especializada em produtos personalizados de comunicação visual (banners, adesivos, placas, fachadas e materiais sob medida).

---

## 🚀 Tecnologias Utilizadas

- Node.js (ESM)
- Express
- PostgreSQL
- Prisma ORM
- JWT (Autenticação)
- Bcrypt (Hash de senha)
- Zod (Validação)
- ESLint
- Prettier

---

## 🧠 Arquitetura

Estrutura baseada em separação por camadas:

```
src/
 ├── app.js
 ├── server.js
 ├── config/
 ├── db/
 ├── middlewares/
 ├── routes/
 └── modules/
      ├── auth/
      ├── customers/
      ├── products/
      ├── categories/
      └── orders/
```

Padrão aplicado:

```
routes → controller → service → repository → prisma
```

---

## 📦 Conceito do Sistema

O sistema suporta:

- Produtos altamente customizáveis (dimensão, material, acabamento)
- Cálculo automático de preço (por unidade, m² ou metro linear)
- Cadastro completo de clientes (PF e PJ)
- Endereços de entrega e cobrança
- Controle de estoque
- Sistema de pedidos
- Controle de acesso (ADMIN / CUSTOMER)

---

## 🗄 Banco de Dados

Banco: **PostgreSQL**

ORM: **Prisma**

Principais modelos:

- User
- CustomerProfile
- Address
- Category
- Product
- ProductOptionGroup
- ProductOption
- Stock
- Order
- OrderItem

---

## ⚙️ Como Rodar o Projeto

### 1️⃣ Instalar dependências

```bash
yarn install
```

ou

```bash
npm install
```

---

### 2️⃣ Criar arquivo `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bdLojaVisualArt"
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
JWT_SECRET="uma-chave-super-segura"
JWT_EXPIRES_IN="1h"
```

---

### 3️⃣ Rodar Migrações

```bash
yarn db:migrate
```

---

### 4️⃣ Rodar Seed (Admin + Produtos exemplo)

```bash
yarn seed
```

Admin padrão criado:

```
email: admin@visualart.com
senha: Admin@123
```

⚠️ Alterar senha em produção.

---

### 5️⃣ Iniciar Servidor

```bash
yarn dev
```

Servidor disponível em:

```
http://localhost:3000
```

---

## 🔐 Autenticação

Autenticação via JWT.

Enviar no header:

```
Authorization: Bearer SEU_TOKEN
```

---

## 📡 Rotas Principais

### 🔑 Auth

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me
```

---

### 👤 Cadastro Completo de Cliente

```
POST   /api/v1/customers/register
```

Cria:

- User
- CustomerProfile
- Endereço(s)
- Retorna token JWT

---

### 🛍 Catálogo (Público)

```
GET    /api/v1/categories
GET    /api/v1/products
GET    /api/v1/products/:slug
```

---

### 🔒 Rotas Admin

(Requer role ADMIN)

```
POST   /api/v1/admin/products
PATCH  /api/v1/admin/products/:id
POST   /api/v1/admin/categories
```

---

## 💰 Sistema de Preço

Suporta:

- UNIT (preço fixo)
- AREA_M2 (por metro quadrado)
- LINEAR_M (por metro linear)
- QUOTE (sob orçamento)

Opções podem alterar preço por:

- Valor fixo
- Valor por m²
- Percentual

---

## 🛠 Scripts Disponíveis

```
yarn dev            # desenvolvimento
yarn start          # produção
yarn db:migrate     # criar migration
yarn db:studio      # abrir Prisma Studio
yarn seed           # rodar seed
yarn lint
yarn format
```

---

## 🛡 Segurança

- Senhas com bcrypt
- JWT com expiração
- Validação com Zod
- Controle de roles
- Estrutura preparada para LGPD (marketingOptIn, termsAcceptedAt)

---

## 📌 Roadmap

- Upload real de imagens (S3 ou Cloudinary)
- Gateway de pagamento (Mercado Pago / Stripe)
- Cálculo de frete
- Sistema de orçamento
- Painel administrativo completo

---

## 📜 Licença

Projeto privado – Loja Visual Art.

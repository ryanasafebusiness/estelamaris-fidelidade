# Estelamaris — Programa de Fidelidade 🌟

Este é o aplicativo de **Programa de Pontos e Fidelidade** desenvolvido para a **Farmácia Estelamaris**. Através desta plataforma, os clientes da farmácia podem enviar suas notas fiscais, acumular pontos com base no valor de suas compras e trocar esses pontos por descontos e recompensas exclusivas.

## 🚀 Como funciona?

O sistema foi arquitetado para ser simples para o cliente e automatizado para a farmácia:

1. **Envio da Nota**: O cliente tira uma foto da nota fiscal ou envia o arquivo direto pelo app.
2. **Leitura via Inteligência Artificial**: Uma automação (via **n8n** conectada a um Webhook do banco) captura a imagem e utiliza a **Groq (Visão/IA)** para ler automaticamente o valor (R$) da compra.
3. **Crédito de Pontos**: Os pontos são calculados através de uma tabela de parâmetros dinâmicos (ex: R$ 1 = 1 ponto) multiplicados pelo nível de fidelidade do cliente (Bronze, Prata, Ouro).
4. **Resgate**: O cliente escolhe uma recompensa no catálogo, o que gera um código único e QR Code.
5. **Frente de Caixa (Admin)**: O cliente mostra o código para o atendente. O atendente, logado no painel administrativo restrito, dá baixa no código e aplica o desconto na compra em tempo real.

## 🛠️ Tecnologias Utilizadas

Este projeto utiliza uma stack moderna com as melhores ferramentas disponíveis:

- **[Next.js 15 (App Router)](https://nextjs.org/)**: Framework React SSR para melhor performance e SEO.
- **[Tailwind CSS v4](https://tailwindcss.com/)**: Estilização altamente customizada.
- **[Supabase](https://supabase.com/)**: Backend as a Service.
  - **PostgreSQL**: Banco de dados relacional (com funções SQL, Triggers e RLS).
  - **Supabase Auth**: Autenticação de usuários.
  - **Supabase Storage**: Armazenamento seguro de fotos de cupons fiscais em Buckets privados.
- **[n8n](https://n8n.io/)**: Ferramenta de automação de fluxo de trabalho para plugar a IA no banco de dados.

## 🛡️ Segurança e Permissões

Toda a lógica sensível do sistema está duplamente protegida (Database + Servidor):
- **Row Level Security (RLS)**: Usuários comuns só conseguem ler e escrever na tabela de "pontos", "notas" e "resgates" onde o `user_id` é o deles. O usuário administrador (`ryan@gmail.com`) possui uma política que ignora o RLS e lhe garante acesso global ao sistema.
- **Server Actions Seguras**: Todo o painel administrativo (`/admin`) utiliza um client elevado (Service Role) e a camada de middleware do Next.js impede a entrada não autorizada.

## 💻 Rodando Localmente

Para rodar este ambiente de desenvolvimento na sua máquina:

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure suas variáveis de ambiente copiando o template (`.env.example` -> `.env.local`) e inserindo suas chaves do Supabase.

3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador e você verá o app rodando!

---

> Desenvolvido com carinho para alavancar e modernizar as vendas da Farmácia Estelamaris.

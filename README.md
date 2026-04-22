# GymPE

**GymPE** é um tracker pessoal completo em português que une **hábitos, fé e finanças** num só lugar — com gamificação de verdade: metas diárias/semanais/mensais, XP, patentes, conquistas e score de disciplina.

## O que torna o GymPE único

- **Sistema de Metas (daily/weekly/monthly)** com progresso visual e recompensas em XP.
- **Patentes / Níveis**: Iniciante → Lenda, cada um com cor e XP mínimo.
- **Conquistas desbloqueáveis** (streaks, metas, equilíbrio financeiro etc.).
- **Score de Disciplina (0–100)** que combina hábitos, metas e saúde financeira.
- **Streak físico** e **Streak espiritual** (oração + gratidão).
- **Insights automáticos** personalizados todo dia.
- **Ritual diário** com hábitos essenciais (treino, dieta, oração, gratidão, pureza).
- **Banco pessoal** com extrato, gráficos por categoria e resumo mensal.
- **Parcelamentos** com cálculo automático de dívida restante e próximas cobranças.
- **Design premium** com tema escuro, gradientes, glassmorphism e animações.

## Stack

- **Frontend**: React + Vite + TailwindCSS v4 + React Router + Axios + Recharts + lucide-react + framer-motion
- **Backend**: Node.js + Express + MongoDB + Mongoose + JWT + bcryptjs

## Estrutura

```
GymPe/
├── client/            # React + Vite
│   └── src/
│       ├── components/    (Sidebar, Topbar, Layout, GoalCard, ProgressRing...)
│       ├── context/       (AuthContext, ThemeContext)
│       ├── pages/         (Dashboard, Habits, Goals, Achievements, Finance, Installments, Settings, Login, Register)
│       └── services/api.js
└── server/            # Node + Express
    └── src/
        ├── models/        (User, Habit, Transaction, Installment, Goal, Achievement)
        ├── controllers/   (auth, habit, transaction, installment, goal, dashboard, gamification)
        ├── routes/
        ├── middleware/
        ├── utils/gamification.js  (ranks, XP, conquistas)
        ├── config/db.js
        ├── app.js
        └── server.js
```

## Como rodar

1. Copie os exemplos:
   - `server/.env.example` → `server/.env`
   - `client/.env.example` → `client/.env`
2. Configure no backend:
   - `MONGO_URI` (MongoDB Atlas)
   - `JWT_SECRET`
3. Instale dependências:
   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```
4. Rode frontend + backend juntos:
   ```bash
   npm run dev
   ```

O backend sobe em `http://localhost:5000` e o frontend em `http://localhost:5173`.

## Endpoints da API

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/auth/register` | Cria conta |
| POST | `/api/auth/login` | Login com JWT |
| GET | `/api/auth/me` | Usuário autenticado |
| GET/PUT | `/api/habits/today` | Lê/atualiza hábitos do dia |
| GET | `/api/habits/history` | Histórico por mês |
| GET | `/api/habits/streak` | Streak atual |
| GET/POST | `/api/transactions` | Lista/cria transação |
| GET | `/api/transactions/summary` | Resumo mensal |
| GET/POST | `/api/installments` | Parcelas |
| GET | `/api/installments/upcoming` | Próximos vencimentos (30 dias) |
| GET | `/api/goals` / `/all` | Metas ativas / todas |
| POST | `/api/goals` | Cria meta diária/semanal/mensal |
| PATCH | `/api/goals/:id/progress` | Incrementa progresso |
| DELETE | `/api/goals/:id` | Remove meta |
| GET | `/api/gamification/progress` | XP, rank, streak, score, conquistas |
| GET | `/api/gamification/achievements` | Catálogo completo |
| GET | `/api/dashboard/summary` | Dashboard unificado |

## Patentes

| Nível | Título | XP mínimo |
| --- | --- | --- |
| 1 | Iniciante | 0 |
| 2 | Aprendiz | 200 |
| 3 | Disciplinado | 600 |
| 4 | Guerreiro | 1.200 |
| 5 | Atleta | 2.200 |
| 6 | Mentor | 3.800 |
| 7 | Mestre | 6.000 |
| 8 | Lenda | 9.000 |

## Conquistas iniciais

- Primeiros passos · Constância em formação · Semana perfeita · Disciplina de ferro
- Objetivo alcançado · Colecionador de vitórias
- Equilíbrio financeiro
- Guerreiro · Lenda do GymPE · Semana de luz

## Modo social competitivo

- Adicionar amigos por e-mail e aceitar solicitações
- Criar grupos com hábitos compartilhados (mesmos objetivos para todos)
- Convidar apenas amigos aceitos para o grupo
- Check-in diário por participante dentro do grupo
- Ranking diário e semanal por pontuação e consistência

### Rotas sociais

- `POST /api/friends/request`
- `GET /api/friends/requests`
- `PATCH /api/friends/requests/:id/respond`
- `GET /api/friends`
- `POST /api/groups`
- `GET /api/groups`
- `GET /api/groups/:id`
- `PATCH /api/groups/:id/members`
- `PUT /api/groups/:id/habits`
- `PUT /api/groups/:id/checkin-today`
- `GET /api/groups/:id/ranking?range=daily|weekly`

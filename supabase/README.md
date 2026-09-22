# Banco de dados

## Como aplicar

Ainda não temos o projeto Supabase criado (isso é o próximo passo). Quando
existir:

1. Abra o **SQL Editor** do seu projeto em supabase.com
2. Rode `migrations/0001_init.sql` (cria as tabelas, sem RLS ainda)
3. Rode `migrations/0002_rls.sql` (habilita RLS + políticas por dono, cria o
   gatilho que gera a linha em `profiles` automaticamente no cadastro)
4. Rode `migrations/0003_grants.sql` (dá permissão de tabela ao role
   `authenticated` — sem isso, todo acesso volta 403 mesmo com RLS certo)
5. Rode `seed.sql` (popula `exercises` com o catálogo de ~38 exercícios já
   usado no protótipo)

**Se você já rodou `0001` e `0002` antes de hoje**, só falta rodar o `0003`
agora — os outros dois não precisam ser rodados de novo.

Se preferir a CLI do Supabase mais pra frente (`supabase db push`), os
arquivos já seguem a convenção de pastas que ela espera.

## O que ainda falta (próximos passos do roteiro)

- [x] Criar o projeto no Supabase e preencher `.env`
- [x] Autenticação (e-mail/senha, contas criadas manualmente pelo admin)
- [x] RLS — cada tabela de usuário restrita ao dono; `exercises` é a exceção
      (leitura pública, sem escrita pelo cliente)
- [ ] Trocar os dados mockados pelo resto (`WorkoutsContext`, `DietContext`)
      por queries reais — Perfil e Peso já foram convertidos como prova do
      padrão; falta Treinos, Dieta e Sessões

## Por que a modelagem é assim

- **`workouts` vs `sessions`** — treino é o *plano* (reutilizável, editável);
  sessão é o *histórico* (imutável depois de criada). Isso evita que editar
  um treino amanhã reescreva o que você já treinou ontem.
- **Snapshot em `session_exercises`** — nome, grupo muscular e equipamento
  são copiados no momento da sessão, não referenciados ao vivo. Necessário
  pra comparar progressão de carga ao longo do tempo sem que uma edição
  futura do treino "reescreva" o passado.
- **`exercise_id` em `workout_exercises`/`session_exercises`** — referência
  opcional e estável ao catálogo, usada só pra agrupar "todas as vezes que
  fiz Supino reto" de forma confiável mesmo que o texto do nome mude.
- **Dieta não tem snapshot** — decisão consciente de simplicidade (YAGNI):
  ninguém pediu comparação histórica de dieta ainda. Se pedir, replicar o
  mesmo padrão de `sessions`.

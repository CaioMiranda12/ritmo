-- ritmo — per-food calories
--
-- Replaces the manually-typed "estimated kcal" per option with a computed
-- sum of each food's own (optional) calorie count. Single source of truth
-- instead of two numbers that can drift apart.

alter table diet_meal_option_foods add column calories_kcal integer;

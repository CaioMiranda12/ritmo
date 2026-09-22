import { supabase } from '../lib/supabase'

export interface CatalogExercise {
  id: string
  name: string
  muscleGroup: string
  equipment: string
}

export async function fetchExerciseCatalog(): Promise<CatalogExercise[]> {
  const { data, error } = await supabase.from('exercises').select('id, name, muscle_group, equipment').order('name')
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
  }))
}

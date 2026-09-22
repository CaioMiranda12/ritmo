import { supabase } from '../lib/supabase'

export interface Profile {
  name: string
  weightUnit: 'kg' | 'lb'
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('name, weight_unit').eq('id', userId).single()
  if (error) throw error
  return { name: data.name, weightUnit: data.weight_unit as 'kg' | 'lb' }
}

export async function updateProfile(userId: string, input: Profile) {
  const { error } = await supabase
    .from('profiles')
    .update({ name: input.name, weight_unit: input.weightUnit })
    .eq('id', userId)
  if (error) throw error
}

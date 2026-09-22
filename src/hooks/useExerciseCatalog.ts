import { useQuery } from '@tanstack/react-query'
import { fetchExerciseCatalog } from '../api/exercise-catalog'

export function useExerciseCatalog() {
  return useQuery({
    queryKey: ['exercise-catalog'],
    queryFn: fetchExerciseCatalog,
    staleTime: Infinity, // the catalog is seeded once and doesn't change from the client
  })
}

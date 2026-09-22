import { Home, Dumbbell, UtensilsCrossed, LineChart } from 'lucide-react'

export const navItems = [
  { to: '/', label: 'Hoje', icon: Home, end: true },
  { to: '/treinos', label: 'Treinos', icon: Dumbbell },
  { to: '/dieta', label: 'Dieta', icon: UtensilsCrossed },
  { to: '/progresso', label: 'Progresso', icon: LineChart },
]

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import { AuthProvider } from './context/AuthContext'
import { WorkoutsProvider } from './context/WorkoutsContext'
import { DietProvider } from './context/DietContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { Today } from './pages/Today'
import { Workouts } from './pages/Workouts'
import { WorkoutDetail } from './pages/WorkoutDetail'
import { WorkoutSession } from './pages/WorkoutSession'
import { Login } from './pages/Login'
import { ResetPassword } from './pages/ResetPassword'
import { Diet } from './pages/Diet'
import { Progress } from './pages/Progress'
import { Profile } from './pages/Profile'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkoutsProvider>
          <DietProvider>
            <BrowserRouter>
              <Routes>
                {/* Pre-auth routes and the execution flow all skip the sidebar/bottom nav on purpose. */}
                <Route path="/login" element={<Login />} />
                <Route path="/redefinir-senha" element={<ResetPassword />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/execucao/:id" element={<WorkoutSession />} />

                  <Route element={<AppShell />}>
                    <Route path="/" element={<Today />} />
                    <Route path="/treinos" element={<Workouts />} />
                    <Route path="/treinos/:id" element={<WorkoutDetail />} />
                    <Route path="/dieta" element={<Diet />} />
                    <Route path="/progresso" element={<Progress />} />
                    <Route path="/perfil" element={<Profile />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </DietProvider>
        </WorkoutsProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App

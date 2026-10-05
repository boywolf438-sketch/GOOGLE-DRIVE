import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Compass, MessageSquare } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { ToastProvider } from './components/Toast'
import { AppLayout } from './components/Layout'
import { Button, Card, EmptyState, Spinner } from './components/ui'
import { SignInPage, SignUpPage } from './pages/AuthPages'
import DashboardPage from './pages/Dashboard'
import ChatPage from './pages/ChatPage'
import AcademicsPage from './pages/AcademicsPage'
import ResultsEntryPage from './pages/ResultsEntryPage'
import ResultsPage from './pages/ResultsPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import PeoplePage from './pages/PeoplePage'
import SettingsPage from './pages/SettingsPage'
import { Link } from 'react-router-dom'

type Role = 'admin' | 'teacher' | 'parent'

function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/signin" replace />
  if (!roles.includes(user.role)) {
    return (
      <Card>
        <EmptyState
          icon={<Compass className="h-6 w-6" />}
          title="This section is not available for your role"
          message={`You are signed in as a ${user.role}. Ask an administrator if you believe you should have access.`}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/">
                <Button>Back to dashboard</Button>
              </Link>
              <Link to="/chat">
                <Button variant="outline" icon={<MessageSquare className="h-4 w-4" />}>
                  Open chats
                </Button>
              </Link>
            </div>
          }
        />
      </Card>
    )
  }
  return <>{children}</>
}

function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={<Compass className="h-6 w-6" />}
        title="Page not found"
        message="The page you are looking for has moved or never existed."
        action={
          <Link to="/">
            <Button>Back to dashboard</Button>
          </Link>
        }
      />
    </Card>
  )
}

function RootRedirect() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }
  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname }} />
  return <AppLayout />
}

export default function App() {
  return (
    <DataProvider>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/" element={<RootRedirect />}>
              <Route index element={<DashboardPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="chat/:conversationId" element={<ChatPage />} />
              <Route
                path="academics"
                element={
                  <RequireRole roles={['admin', 'teacher']}>
                    <AcademicsPage />
                  </RequireRole>
                }
              />
              <Route
                path="assessments"
                element={
                  <RequireRole roles={['admin', 'teacher']}>
                    <ResultsEntryPage />
                  </RequireRole>
                }
              />
              <Route
                path="results"
                element={
                  <RequireRole roles={['admin', 'teacher', 'parent']}>
                    <ResultsPage />
                  </RequireRole>
                }
              />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route
                path="people"
                element={
                  <RequireRole roles={['admin', 'teacher']}>
                    <PeoplePage />
                  </RequireRole>
                }
              />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </DataProvider>
  )
}

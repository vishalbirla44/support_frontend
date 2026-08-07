import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages — Auth
import EmployeeLogin from './pages/employee/EmployeeLogin';

// Pages — Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import WhatsAppNumbers from './pages/admin/WhatsAppNumbers';
import AllChats from './pages/admin/AllChats';
import AutoReplyRules from './pages/admin/AutoReplyRules';
import CallLogs from './pages/admin/CallLogs';

// Pages — Employee
import Inbox from './pages/employee/Inbox';
import MyStats from './pages/employee/MyStats';

// Pages — Call (public)
import CallRoom from './pages/call/CallRoom';


console.log("API URL:", import.meta.env.VITE_API_URL);
// ── Guards ──────────────────────────────────────────────────────────────────

function RequireAuth({ children }) {
  const { user, token, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp mx-auto" />
          <p className="mt-3 text-gray-600">Preparing your workspace...</p>
        </div>
      </div>
    );
  }
  if (!token || !user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, token, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp mx-auto" />
          <p className="mt-3 text-gray-600">Preparing your workspace...</p>
        </div>
      </div>
    );
  }
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/inbox" replace />;
  return children;
}

function RootRedirect() {
  const { user, token, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp mx-auto" />
          <p className="mt-3 text-gray-600">Preparing your workspace...</p>
        </div>
      </div>
    );
  }
  if (!token || !user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/inbox'} replace />;
}

// ── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route path="/login" element={<EmployeeLogin />} />
      <Route path="/call/:roomId" element={<CallRoom />} />

      {/* Employee (employee + admin both allowed) */}
      <Route
        path="/inbox"
        element={
          <RequireAuth>
            <Inbox />
          </RequireAuth>
        }
      />
      <Route
        path="/inbox/:chatId"
        element={
          <RequireAuth>
            <Inbox />
          </RequireAuth>
        }
      />
      <Route
        path="/my-stats"
        element={
          <RequireAuth>
            <MyStats />
          </RequireAuth>
        }
      />

      {/* Admin only */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <RequireAdmin>
            <EmployeeManagement />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/numbers"
        element={
          <RequireAdmin>
            <WhatsAppNumbers />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/chats"
        element={
          <RequireAdmin>
            <AllChats />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/autoreplies"
        element={
          <RequireAdmin>
            <AutoReplyRules />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/call-logs"
        element={
          <RequireAdmin>
            <CallLogs />
          </RequireAdmin>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
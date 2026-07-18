import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth
import LoginPage from './pages/LoginPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import CompanyRegisterPage from './pages/CompanyRegisterPage';
import SupervisorRegisterPage from './pages/SupervisorRegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import StudentJobSearch from './pages/student/StudentJobSearch';
import StudentApplications from './pages/student/StudentApplications';
import StudentMessages from './pages/student/StudentMessages';
import StudentProfile from './pages/student/StudentProfile';

// Company
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyManageJobs from './pages/company/CompanyManageJobs';
import CompanyATS from './pages/company/CompanyATS';
import CompanyMessages from './pages/company/CompanyMessages';
import CompanyProfile from './pages/company/CompanyProfile';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminStudentTracker from './pages/admin/AdminStudentTracker';
import AdminUserManagement from './pages/admin/AdminUserManagement';

// Supervisor
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import SupervisorStudentDetail from './pages/supervisor/SupervisorStudentDetail';
import SupervisorProfile from './pages/supervisor/SupervisorProfile';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#18181B', color: '#FAFAFA', border: '1px solid #27272A', borderRadius: '0', fontSize: '13px' },
              success: { iconTheme: { primary: '#C41E3A', secondary: '#fff' } },
              error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/student" element={<StudentRegisterPage />} />
            <Route path="/register/company" element={<CompanyRegisterPage />} />
            <Route path="/register/supervisor" element={<SupervisorRegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Student */}
            <Route path="/student/dashboard" element={<ProtectedRoute role="STUDENT"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/jobs" element={<ProtectedRoute role="STUDENT"><StudentJobSearch /></ProtectedRoute>} />
            <Route path="/student/applications" element={<ProtectedRoute role="STUDENT"><StudentApplications /></ProtectedRoute>} />
            <Route path="/student/messages" element={<ProtectedRoute role="STUDENT"><StudentMessages /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute role="STUDENT"><StudentProfile /></ProtectedRoute>} />

            {/* Company */}
            <Route path="/company/dashboard" element={<ProtectedRoute role="COMPANY"><CompanyDashboard /></ProtectedRoute>} />
            <Route path="/company/jobs" element={<ProtectedRoute role="COMPANY"><CompanyManageJobs /></ProtectedRoute>} />
            <Route path="/company/applications" element={<ProtectedRoute role="COMPANY"><CompanyATS /></ProtectedRoute>} />
            <Route path="/company/messages" element={<ProtectedRoute role="COMPANY"><CompanyMessages /></ProtectedRoute>} />
            <Route path="/company/profile" element={<ProtectedRoute role="COMPANY"><CompanyProfile /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute role="ADMIN"><AdminApprovals /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute role="ADMIN"><AdminStudentTracker /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute role="ADMIN"><AdminUserManagement /></ProtectedRoute>} />

            {/* Supervisor */}
            <Route path="/supervisor/dashboard" element={<ProtectedRoute role="SUPERVISOR"><SupervisorDashboard /></ProtectedRoute>} />
            <Route path="/supervisor/students/:studentId" element={<ProtectedRoute role="SUPERVISOR"><SupervisorStudentDetail /></ProtectedRoute>} />
            <Route path="/supervisor/profile" element={<ProtectedRoute role="SUPERVISOR"><SupervisorProfile /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

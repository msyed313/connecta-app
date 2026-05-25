import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage       from './pages/RegisterPage';
import LoginPage          from './pages/LoginPage';
import ChatPage           from './pages/ChatPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProtectedRoute     from './components/shared/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/chat"            element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
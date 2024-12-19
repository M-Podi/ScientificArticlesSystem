// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StartPage from './pages/StartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InterestsPage from './pages/InterestsPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ArticlePage from "./pages/ArticlePage.tsx";
import StoreArticles from './pages/StoreArticles';


const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/interests"
          element={
            <ProtectedRoute>
              <InterestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/articles/:id"
          element={
            <ProtectedRoute>
              <ArticlePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store-articles"
          element={
            <ProtectedRoute>
              <StoreArticles />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;

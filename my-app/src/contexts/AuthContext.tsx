import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Define the AuthContext type
interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  login: () => {},
  logout: () => {},
  refreshAccessToken: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const navigate = useNavigate();

  // Function to log the user in
  const login = (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  };

  // Function to log the user out
  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login'); // Redirect to login page after logout
    toast.info('Logged out successfully.');
  };

  // Function to refresh the access token
  const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshToken) {
      logout(); // If no refresh token, force logout
      return null;
    }

    try {
      const response = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        login(data.access, refreshToken); // Update access token
        return data.access;
      } else {
        logout(); // Force logout if refresh fails
        toast.error('Session expired. Please log in again.');
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return null;
    }
  };

  // Automatically refresh the access token if needed
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (accessToken) {
        refreshAccessToken();
      }
    }, 4 * 60 * 1000); // Refresh every 4 minutes

    return () => clearInterval(refreshInterval); // Cleanup on unmount
  }, [accessToken]);

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        refreshToken,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access the AuthContext
export const useAuth = () => useContext(AuthContext);

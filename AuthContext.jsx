import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const MOCK_USER = {
  id: 'admin-123',
  name: 'Administrador',
  email: 'admin@venda.com',
  role: 'admin', // Adicionando um campo de role para o gerenciamento de usuários
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false); // Simplificado
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Simplificado
  const navigate = useNavigate();

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    // Simulação de verificação de estado de autenticação local
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    
    // Simulação de carregamento de configurações públicas
    setAppPublicSettings({ id: appParams.appId, public_settings: {} });
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
  };

  const login = async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);

    // Simulação de login: aceita qualquer coisa, mas vamos usar um mock para admin
    if (email === 'admin@venda.com' && password === '123456') {
      localStorage.setItem('mockUser', JSON.stringify(MOCK_USER));
      setUser(MOCK_USER);
      setIsAuthenticated(true);
      navigate('/'); // Redireciona para a página principal após o login
    } else {
      setAuthError({
        type: 'login_failed',
        message: 'Credenciais inválidas. Tente admin@venda.com / 123456'
      });
      setIsAuthenticated(false);
    }

    setIsLoadingAuth(false);
  };

  const logout = () => {
    localStorage.removeItem('mockUser');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login'); // Redireciona para a nova página de login
  };

  // A função navigateToLogin não é mais necessária, mas vamos mantê-la para evitar erros em App.jsx
  const navigateToLogin = () => {
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login, // Adicionado a função de login
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

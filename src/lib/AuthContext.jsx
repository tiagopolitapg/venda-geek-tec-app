import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

// Usuários padrão do sistema
const DEFAULT_USERS = [
  {
    id: 'user-1',
    name: 'Administrador',
    email: 'admin@venda.com',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString()
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Inicializar usuários e verificar autenticação
  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    // Carregar usuários do localStorage
    const storedUsers = localStorage.getItem('appUsers');
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch (e) {
        console.error('Erro ao carregar usuários:', e);
        localStorage.setItem('appUsers', JSON.stringify(DEFAULT_USERS));
        setUsers(DEFAULT_USERS);
      }
    } else {
      localStorage.setItem('appUsers', JSON.stringify(DEFAULT_USERS));
      setUsers(DEFAULT_USERS);
    }

    // Verificar se há usuário autenticado
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Erro ao carregar usuário autenticado:', e);
        localStorage.removeItem('currentUser');
      }
    }

    setIsLoadingAuth(false);
  };

  const login = async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const foundUser = users.find(u => u.email === email);

      if (!foundUser) {
        setAuthError({
          type: 'user_not_found',
          message: 'Usuário não encontrado.'
        });
        setIsLoadingAuth(false);
        return;
      }

      if (foundUser.password !== password) {
        setAuthError({
          type: 'invalid_password',
          message: 'Senha incorreta.'
        });
        setIsLoadingAuth(false);
        return;
      }

      const userData = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      navigate('/');
    } catch (error) {
      setAuthError({
        type: 'login_error',
        message: 'Erro ao fazer login. Tente novamente.'
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const createUser = (userData) => {
    const newUser = {
      id: `user-${Date.now()}`,
      ...userData,
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    return newUser;
  };

  const updateUser = (userId, userData) => {
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, ...userData } : u
    );
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const deleteUser = (userId) => {
    const admins = users.filter(u => u.role === 'admin');
    if (admins.length === 1 && users.find(u => u.id === userId)?.role === 'admin') {
      throw new Error('Não é possível deletar o último administrador.');
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const getAllUsers = () => users;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      users,
      login,
      logout,
      createUser,
      updateUser,
      deleteUser,
      getAllUsers,
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

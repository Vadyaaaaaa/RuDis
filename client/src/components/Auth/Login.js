import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

function Login() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Добро пожаловать в RuDis!</h1>
        <p className="auth-subtitle">Мы рады видеть вас снова</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Введите ваш ник"
              autoFocus
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="auth-link">
          Нужен аккаунт? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

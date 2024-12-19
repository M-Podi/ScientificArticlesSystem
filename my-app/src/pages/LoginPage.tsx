import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../styles/LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        login(data.access);
        toast.success('Logged in successfully!');
        navigate('/home');
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Login failed.');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('An error occurred during login.');
    }
  };

  return (
    <div className="container">
      <div className="title-container">
        <h1>Get back to</h1>
        <h2>your learning quest</h2>
      </div>
      <div className="card">
        <form className="form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Email"
            value={formData.username}
            onChange={handleChange}
            className="input"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="input"
            required
          />
          <button type="submit" className="button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
  
};

export default LoginPage;

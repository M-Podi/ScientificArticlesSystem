import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/StartPage.css'; // Import a CSS file for styles

const StartPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="start-page-container">
      <div className="start-page-card">
        <h1 className="app-title">LitPath</h1>
        <p className="sub-text">
          The world already contains all the information you need
          <br />
          <strong>We are just helping you find it</strong>
        </p>
        <div className="stats">
          <p>999,999 Users interested in diverse domains</p>
          <p>Over 60,000 articles</p>
        </div>
        <div className="button-container">
          <button className="start-button" onClick={() => navigate('/login')}>
            Login
          </button>
          <button className="start-button" onClick={() => navigate('/register')}>
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
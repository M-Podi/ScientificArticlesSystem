import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface Article {
  id: number;
  scientific_domain: string;
  title: string;
  content: string;
  number_of_pages: number;
  points: number;
  minimum_points?: number;
}

const HomePage: React.FC = () => {
  const { accessToken, logout } = useAuth();
  const navigate = useNavigate();

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/profile/', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          await response.json();
        } else if (response.status === 401) {
          logout();
        } else {
          toast.error('Failed to fetch user profile.');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('An error occurred while fetching user profile.');
      }
    };

    const fetchArticles = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/articles/', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data: Article[] = await response.json();
          setArticles(data);
        } else if (response.status === 401) {
          logout();
        } else {
          toast.error('Failed to fetch articles.');
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
        toast.error('An error occurred while fetching articles.');
      } finally {
        setIsLoading(false);
      }
    };

    if (accessToken) {
      fetchProfile();
      fetchArticles();
    } else {
      setIsLoading(false);
    }
  }, [accessToken, logout]);

  const handleButtonClick = (articleId: number) => {
  navigate(`/articles/${articleId}`);
};

  return (
    <div style={styles.container}>
      <h1>Welcome to the Home Page!</h1>
      <button onClick={logout} style={styles.button}>
        Logout
      </button>

      <h2>Articles you might be interested in:</h2>

      {isLoading ? (
        <p>Loading articles...</p>
      ) : articles.length === 0 ? (
        <p>No articles found for your interested domains.</p>
      ) : (
        <ul style={styles.list}>
          {articles.map((article) => (
            <li key={article.id} style={styles.listItem}>
              <h3>{article.title}</h3>
              <p>
                <strong>Domain:</strong> {article.scientific_domain}
              </p>
              <p>
                <strong>Pages:</strong> {article.number_of_pages}
              </p>
              <p>
                <strong>Points:</strong> {article.points}
              </p>
              {article.minimum_points !== undefined && (
                <p>
                  <strong>Min Points Required:</strong> {article.minimum_points}
                </p>
              )}
              <p>
                <strong>Content:</strong> {article.content}
              </p>
              <button onClick={() => handleButtonClick(article.id)} style={styles.button}>
                Go to Article
              </button>
            </li>
          ))}
        </ul>
      )}

      <button onClick={() => navigate('/store-articles')} style={styles.storeButton}>
        Go to Store Articles
      </button>

      <button onClick={() => navigate('/profile')} style={styles.button}>
        Go to Profile
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '50px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    margin: '20px 0',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    width: '100%',
  },
  listItem: {
    borderBottom: '1px solid #ccc',
    padding: '20px 0',
  },
  storeButton: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    margin: '20px 0',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
  },
};

export default HomePage;
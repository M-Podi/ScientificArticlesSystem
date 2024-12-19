import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface Article {
  id: number;
  title: string;
  scientific_domain: string;
  points: number;
  minimum_points: number;
  file_path: string;
}

const StoreArticles: React.FC = () => {
  const { accessToken, logout } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/store-articles/', {
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error('An error occurred while fetching articles.');
      } finally {
        setIsLoading(false);
      }
    };

    if (accessToken) {
      fetchArticles();
    }
  }, [accessToken, logout]);

  const handleDownload = (filePath: string | null) => {
    if (filePath) {
      window.location.href = `http://localhost:8000${filePath}`;
    } else {
      toast.error('File path is not available.');
    }
  };

  return (
    <div style={styles.container}>
      <h1>Store Articles</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul style={styles.articleList}>
          {articles.map((article) => (
            <li key={article.id} style={styles.articleItem}>
              <h2>{article.title}</h2>
              <p>Domain: {article.scientific_domain}</p>
              <p>Points: {article.points}</p>
              <p>Minimum Points Required: {article.minimum_points}</p>
              <button onClick={() => handleDownload(article.file_path)} style={styles.downloadButton}>
                Buy & Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  articleList: {
    listStyle: 'none',
    padding: 0,
  },
  articleItem: {
    borderBottom: '1px solid #ddd',
    paddingBottom: '10px',
    marginBottom: '10px',
  },
  downloadButton: {
    padding: '8px 16px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
};

export default StoreArticles;
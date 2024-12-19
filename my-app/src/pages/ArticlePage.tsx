// src/pages/ArticlePage.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface Article {
  id: number;
  scientific_domain: string;
  title: string;
  content: string;
  number_of_pages: number;
  points: number;
  minimum_points?: number;
  file: string;
}

interface Review {
  id: number;
  user: string;
  score: number;
  created_at: string;
}

interface UserArticle {
  id: number;
  article: number;
  status: string;
  page_left_off: number;
}



const ArticlePage: React.FC = () => {
  const { accessToken, logout } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userArticle, setUserArticle] = useState<UserArticle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userReview, setUserReview] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const articleResponse = await fetch(`http://localhost:8000/api/articles/${id}/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (articleResponse.ok) {
          const data: Article = await articleResponse.json();
          setArticle(data);
        } else if (articleResponse.status === 401) {
          logout();
          return;
        } else {
          toast.error('Failed to fetch the article.');
          return;
        }

        const reviewsResponse = await fetch(`http://localhost:8000/api/reviews/?article_id=${id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (reviewsResponse.ok) {
          const data: Review[] = await reviewsResponse.json();
          setReviews(data);
        } else if (reviewsResponse.status === 401) {
          logout();
        } else {
          toast.error('Failed to fetch reviews.');
        }

        // Tell the server we started reading
        const readingResponse = await fetch(`http://localhost:8000/api/user-articles/`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ article: id }),
        });

        if (readingResponse.ok) {
          const data: UserArticle = await readingResponse.json();
          setUserArticle(data);
        } else if (readingResponse.status === 401) {
          logout();
        } else {
          toast.error('Failed to update reading status.');
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('An error occurred while fetching data.');
      } finally {
        setIsLoading(false);
      }
    };

    if (accessToken && id) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [accessToken, logout, id]);

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (userReview === null) {
      toast.error('Please provide a score.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/reviews/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          article: id,
          score: userReview,
        }),
      });

      if (response.ok || response.status === 201) {
        const newReview: Review = await response.json();
        setReviews([newReview, ...reviews.filter(review => review.user !== newReview.user)]);
        toast.success('Review submitted successfully.');
      } else if (response.status === 401) {
        logout();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to submit review: ${JSON.stringify(errorData)}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('An error occurred while submitting your review.');
    }
  };

  // src/pages/ArticlePage.tsx
const handleMarkAsRead = async () => {
  try {
    if (!userArticle) return;

    const response = await fetch(`http://localhost:8000/api/user-articles/${userArticle.id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status: 'read' }),
    });

    if (response.ok) {
      const data: UserArticle = await response.json();
      setUserArticle(data);
      toast.success('Marked as Read!');
    } else {
      const errorData = await response.json();
      toast.error(`Failed to update status: ${JSON.stringify(errorData)}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    toast.error('An error occurred while marking the article as read.');
  }
};

  return (
    <div style={styles.container}>
      {isLoading ? (
        <p>Loading...</p>
      ) : article ? (
        <div style={styles.contentContainer}>
          {/* Left Section */}
          <div style={styles.leftSection}>
            <h2>{article.title}</h2>
            <p>
              <strong>Domain:</strong> {article.scientific_domain}
            </p>
            <p>
              <strong>Pages:</strong> {article.number_of_pages}
            </p>
            <p>
              <strong>Points:</strong> {article.points}
            </p>
            <button onClick={handleMarkAsRead} disabled={userArticle?.status == "read"} style={{...styles.readButton, ...(userArticle?.status == "read" ? styles.disabledButton : {})}}>
              {userArticle?.status == "read" ? "Marked as Read" : "Mark as Read"}
            </button>
            <hr />
            <h3>Reviews</h3>
            <form onSubmit={handleReviewSubmit} style={styles.reviewForm}>
              <label>
                Your Score:
                <input
                  type="number"
                  value={userReview ?? ''}
                  onChange={(e) => setUserReview(Number(e.target.value))}
                  min="1"
                  max="10"
                  required
                />
              </label>
              <button type="submit" style={styles.submitButton}>
                Submit Review
              </button>
            </form>
            <ul style={styles.reviewsList}>
              {reviews.map((review) => (
                <li key={review.id} style={styles.reviewItem}>
                  <p>
                    <strong>{review.user}</strong> <em>({new Date(review.created_at).toLocaleString()})</em>
                  </p>
                  <p>Score: {review.score}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Section */}
          <div style={styles.iframeContainer}>
            {article.file && (
              <iframe
                src={`${article.file}`}
                title="PDF Viewer"
                style={styles.iframe}
              ></iframe>
            )}
          </div>
        </div>
      ) : (
        <p>Article not found.</p>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
  },
  contentContainer: {
    display: 'flex',
    width: '100%',
    height: '100%',
  },
  leftSection: {
    width: '250px',
    padding: '20px',
    borderRight: '1px solid #ddd',
    overflowY: 'auto',
  },
  iframeContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  iframe: {
    width: '70%',
    height: '90%',
    maxWidth: '800px',
    border: '1px solid #ccc',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
  },
  readButton: {
    marginTop: '10px',
    padding: '10px 15px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  reviewsList: {
    listStyle: 'none',
    padding: 0,
  },
  reviewItem: {
    borderBottom: '1px solid #ddd',
    marginBottom: '10px',
    paddingBottom: '10px',
  },
  reviewForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#28A745',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
};

export default ArticlePage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const InterestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken, refreshAccessToken } = useAuth();

  const [domains, setDomains] = useState<{ id: number; name: string }[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<number[]>([]);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        let token = accessToken;

        const response = await fetch('http://localhost:8000/api/scientific-domains/', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          token = await refreshAccessToken();
          if (token) {
            const retryResponse = await fetch('http://localhost:8000/api/scientific-domains/', {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });

            if (retryResponse.ok) {
              const data = await retryResponse.json();
              setDomains(data);
              return;
            }
          }
        }

        if (response.ok) {
          const data = await response.json();
          setDomains(data);
        } else {
          toast.error('Failed to fetch scientific domains.');
        }
      } catch (error) {
        console.error('Error fetching domains:', error);
        toast.error('An error occurred while fetching domains.');
      }
    };

    if (accessToken) fetchDomains();
  }, [accessToken, refreshAccessToken]);

  const handleCheckboxChange = (id: number) => {
    setSelectedDomains((prev) =>
      prev.includes(id) ? prev.filter((domainId) => domainId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updateResponse = await fetch('http://localhost:8000/api/profile/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          interests: domains
            .filter((domain) => selectedDomains.includes(domain.id))
            .map((domain) => domain.name),
        }),
      });

      if (updateResponse.ok) {
        toast.success('Interests updated successfully!');
        navigate('/home');
      } else {
        const errorData = await updateResponse.json();
        toast.error(Object.values(errorData).flat().join(' '));
      }
    } catch (error) {
      console.error('Error updating interests:', error);
      toast.error('An error occurred while updating interests.');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Select Your Interests</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {domains.map((domain) => (
          <label key={domain.id} style={styles.label}>
            <input
              type="checkbox"
              value={domain.id}
              checked={selectedDomains.includes(domain.id)}
              onChange={() => handleCheckboxChange(domain.id)}
            />
            {domain.name}
          </label>
        ))}
        <button type="submit" style={styles.button}>
          Submit Interests
        </button>
      </form>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '50px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '300px',
  },
  label: {
    fontSize: '16px',
  },
  button: {
    padding: '10px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '20px',
  },
};

export default InterestsPage;

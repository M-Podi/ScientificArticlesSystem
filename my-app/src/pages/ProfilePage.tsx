// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface UserFieldProgress {
  scientific_domain: {
    id: number;
    name: string;
  };
  current_points: number;
  active: boolean;
}

interface UserProfile {
  interests: { id: number; name: string }[];
  field_progress: UserFieldProgress[];
}

interface ScientificDomain {
  id: number;
  name: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [domains, setDomains] = useState<ScientificDomain[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<number[]>([]);
  const [fieldProgress, setFieldProgress] = useState<UserFieldProgress[]>([]);

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
          const data: UserProfile = await response.json();
          const interestIds = data.interests.map((interest) => interest.id);
          setSelectedDomains(interestIds);
          setFieldProgress(data.field_progress);
        } else {
          toast.error('Failed to fetch user profile.');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('An error occurred while fetching user profile.');
      }
    };

    const fetchDomains = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/scientific-domains/', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data: ScientificDomain[] = await response.json();
          setDomains(data);
        } else {
          toast.error('Failed to fetch scientific domains.');
        }
      } catch (error) {
        console.error('Error fetching domains:', error);
        toast.error('An error occurred while fetching domains.');
      }
    };

    if (accessToken) {
      fetchProfile();
      fetchDomains();
    }
  }, [accessToken]);

  const handleCheckboxChange = (id: number) => {
    setSelectedDomains((prev) =>
      prev.includes(id) ? prev.filter((domainId) => domainId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedDomainNames = domains
      .filter((domain) => selectedDomains.includes(domain.id))
      .map((domain) => domain.name);

    try {
      const updateResponse = await fetch('http://localhost:8000/api/profile/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ interests: selectedDomainNames }),
      });

      if (updateResponse.ok) {
        toast.success('Interests updated successfully!');
        // Re-fetch profile and domains to update the page
        const fetchProfile = async () => {
          try {
            const response = await fetch('http://localhost:8000/api/profile/', {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (response.ok) {
              const data: UserProfile = await response.json();
              const interestIds = data.interests.map((interest) => interest.id);
              setSelectedDomains(interestIds);
              setFieldProgress(data.field_progress);
            }
          } catch (error) {
            console.error('Error fetching updated user profile:', error);
          }
        };
        fetchProfile();
      } else {
        const errorData = await updateResponse.json();
        toast.error(Object.values(errorData).flat().join(' '));
      }
    } catch (error) {
      console.error('Error updating interests:', error);
      toast.error('An error occurred while updating interests.');
    }
  };

  const goToHome = () => {
    navigate('/home');
  };

  return (
    <div style={styles.container}>
      <h2>Your Profile</h2>
      <h3>Current Field Progress</h3>
      {fieldProgress.length === 0 ? (
        <p>No field progress available.</p>
      ) : (
        <ul style={styles.list}>
          {fieldProgress.sort((a, b) => Number(b.active) - Number(a.active)).map((fp, index) => {
            const isActive = fp.active;
            return (
              <li
                key={index}
                style={isActive ? { ...styles.listItem, ...styles.activeListItem } : { ...styles.listItem, ...styles.pastListItem }}
              >
                <strong>{fp.scientific_domain.name}:</strong> {fp.current_points} points
              </li>
            );
          })}
        </ul>
      )}

      <h3>Reselect Your Interests</h3>
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

        <button type="submit" style={styles.button}>Update Interests</button>
      </form>

      <button onClick={goToHome} style={styles.button}>
        Go Back to Home
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
    maxWidth: '600px',
    margin: '0 auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '300px',
    marginBottom: '20px',
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
  list: {
    listStyle: 'none',
    padding: 0,
    marginBottom: '20px',
    width: '100%',
  },
  listItem: {
    borderBottom: '1px solid #ccc',
    padding: '10px 0',
  },
  activeListItem: {
    backgroundColor: '#e6ffe6', // Light green background for active interests
  },
  pastListItem: {
    backgroundColor: '#ffe6e6', // Light red background for past interests
  },
};

export default ProfilePage;

/**
 * Tournaments Section Component
 * Displays monthly tournaments and special events
 */
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './TournamentsSection.css';

const TournamentsSection = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const tournamentsRef = collection(db, 'tournaments');
      const now = new Date();
      const q = query(
        tournamentsRef,
        where('endDate', '>=', now.toISOString())
      );
      const snapshot = await getDocs(q);
      const tournamentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (tournamentsData.length === 0) {
        // Create default monthly tournament if none exists
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const defaultTournament = {
          name: 'טורניר חודשי',
          prize: 100000,
          entryFee: 1000,
          startDate: new Date().toISOString(),
          endDate: nextMonth.toISOString(),
          participants: 0,
          maxParticipants: 100,
          status: 'active'
        };
        await addDoc(collection(db, 'tournaments'), defaultTournament);
        setTournaments([defaultTournament]);
      } else {
        setTournaments(tournamentsData);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
      // Fallback to mock data
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setTournaments([{
        name: 'טורניר חודשי',
        prize: 100000,
        entryFee: 1000,
        startDate: new Date().toISOString(),
        endDate: nextMonth.toISOString(),
        participants: 45,
        maxParticipants: 100,
        status: 'active'
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="tournaments-loading">טוען טורנירים...</div>;
  }

  return (
    <div className="tournaments-section">
      <h3 className="tournaments-title">🎯 טורנירים</h3>
      <div className="tournaments-list">
        {tournaments.length === 0 ? (
          <p className="no-tournaments">אין טורנירים פעילים</p>
        ) : (
          tournaments.map((tournament) => (
            <div key={tournament.id} className="tournament-item">
              <div className="tournament-header">
                <h4>{tournament.name}</h4>
                <span className="tournament-status">{tournament.status === 'active' ? 'פעיל' : 'סיום'}</span>
              </div>
              <div className="tournament-info">
                <div className="tournament-prize">
                  <span className="prize-label">פרס ראשון:</span>
                  <span className="prize-amount">💰 {tournament.prize?.toLocaleString() || 0} צ'יפים</span>
                </div>
                <div className="tournament-details">
                  <span>דמי כניסה: {tournament.entryFee?.toLocaleString() || 0} צ'יפים</span>
                  <span>משתתפים: {tournament.participants || 0}/{tournament.maxParticipants || 100}</span>
                </div>
              </div>
              <button className="tournament-join-btn">הצטרף לטורניר</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TournamentsSection;






/**
 * Admin Panel Component
 * Allows admins to manage tables, players, and system settings
 */
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { showAlert, showConfirm, showPrompt } from '../../utils/dialogs';
import './Admin.css';

const Admin = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('tables');
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({
    name: '',
    maxPlayers: 6,
    minBet: 20,
    isPrivate: false,
    password: ''
  });
  const [houseProfits, setHouseProfits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTables();
      loadHouseProfits();
    }
  }, [isOpen]);

  const loadTables = async () => {
    try {
      const tablesRef = collection(db, 'tables');
      const snapshot = await getDocs(tablesRef);
      const tablesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTables(tablesData);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadHouseProfits = async () => {
    try {
      const profitsRef = collection(db, 'house_profits');
      const snapshot = await getDocs(profitsRef);
      const profitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHouseProfits(profitsData.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ));
    } catch (error) {
      console.error('Error loading house profits:', error);
    }
  };

  const createTable = async () => {
    if (!newTable.name) {
      await showAlert('אנא הזן שם לשולחן', 'warning', 'שדה חובה');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'tables'), {
        ...newTable,
        players: 0,
        pot: 0,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      });
      setNewTable({ name: '', maxPlayers: 6, minBet: 20, isPrivate: false, password: '' });
      await loadTables();
      await showAlert('שולחן נוצר בהצלחה!', 'success', 'הצלחה!');
    } catch (error) {
      console.error('Error creating table:', error);
      await showAlert('שגיאה ביצירת שולחן', 'error', 'שגיאה');
    } finally {
      setLoading(false);
    }
  };

  const deleteTable = async (tableId) => {
    const confirmed = await showConfirm('האם אתה בטוח שברצונך למחוק את השולחן?', 'מחיקת שולחן', 'מחק', 'ביטול');
    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'tables', tableId));
      await loadTables();
      await showAlert('שולחן נמחק בהצלחה!', 'success', 'הצלחה!');
    } catch (error) {
      console.error('Error deleting table:', error);
      await showAlert('שגיאה במחיקת שולחן', 'error', 'שגיאה');
    }
  };

  const updateTable = async (tableId, updates) => {
    try {
      await updateDoc(doc(db, 'tables', tableId), updates);
      await loadTables();
      await showAlert('שולחן עודכן בהצלחה!', 'success', 'הצלחה!');
    } catch (error) {
      console.error('Error updating table:', error);
      await showAlert('שגיאה בעדכון שולחן', 'error', 'שגיאה');
    }
  };

  if (!isOpen) return null;

  const totalProfit = houseProfits.reduce((sum, profit) => sum + (profit.amount || 0), 0);

  return (
    <div className="admin-overlay">
      <div className="admin-modal">
        <div className="admin-header">
          <h2>🎛️ לוח בקרה - ADMIN</h2>
          <button className="admin-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="admin-tabs">
          <button 
            className={activeTab === 'tables' ? 'active' : ''}
            onClick={() => setActiveTab('tables')}
          >
            שולחנות
          </button>
          <button 
            className={activeTab === 'profits' ? 'active' : ''}
            onClick={() => setActiveTab('profits')}
          >
            רווחים
          </button>
          <button 
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            הגדרות
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'tables' && (
            <div className="admin-tables">
              <div className="admin-create-table">
                <h3>יצירת שולחן חדש</h3>
                <div className="admin-form">
                  <input
                    type="text"
                    placeholder="שם השולחן"
                    value={newTable.name}
                    onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="מספר שחקנים מקסימלי"
                    value={newTable.maxPlayers}
                    onChange={(e) => setNewTable({ ...newTable, maxPlayers: parseInt(e.target.value) || 6 })}
                  />
                  <input
                    type="number"
                    placeholder="מינימום הימור"
                    value={newTable.minBet}
                    onChange={(e) => setNewTable({ ...newTable, minBet: parseInt(e.target.value) || 20 })}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={newTable.isPrivate}
                      onChange={(e) => setNewTable({ ...newTable, isPrivate: e.target.checked })}
                    />
                    שולחן פרטי
                  </label>
                  {newTable.isPrivate && (
                    <input
                      type="text"
                      placeholder="סיסמה (אופציונלי)"
                      value={newTable.password}
                      onChange={(e) => setNewTable({ ...newTable, password: e.target.value })}
                    />
                  )}
                  <button onClick={createTable} disabled={loading}>
                    {loading ? 'יוצר...' : 'צור שולחן'}
                  </button>
                </div>
              </div>

              <div className="admin-tables-list">
                <h3>שולחנות קיימים ({tables.length})</h3>
                {tables.map(table => (
                  <div key={table.id} className="admin-table-item">
                    <div className="admin-table-info">
                      <h4>{table.name}</h4>
                      <p>שחקנים: {table.players || 0}/{table.maxPlayers}</p>
                      <p>מינימום הימור: {table.minBet} צ'יפים</p>
                      <p>סטטוס: {table.status || 'waiting'}</p>
                    </div>
                    <div className="admin-table-actions">
                      <button onClick={() => deleteTable(table.id)}>מחק</button>
                      <button onClick={() => updateTable(table.id, { status: 'active' })}>
                        הפעל
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profits' && (
            <div className="admin-profits">
              <div className="admin-profit-summary">
                <h3>סיכום רווחים</h3>
                <div className="profit-total">
                  <span>סה"כ רווחים:</span>
                  <span className="profit-amount">💰 {totalProfit.toLocaleString()} צ'יפים</span>
                </div>
              </div>
              <div className="admin-profits-list">
                <h3>היסטוריית רווחים</h3>
                {houseProfits.length === 0 ? (
                  <p>אין רווחים עדיין</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>סוג</th>
                        <th>סכום</th>
                        <th>תיאור</th>
                        <th>תאריך</th>
                      </tr>
                    </thead>
                    <tbody>
                      {houseProfits.map(profit => (
                        <tr key={profit.id}>
                          <td>{profit.type === 'house_rake' ? 'עמלת בית' : 'טיפ דילר'}</td>
                          <td>💰 {profit.amount}</td>
                          <td>{profit.description || '-'}</td>
                          <td>{new Date(profit.timestamp).toLocaleString('he-IL')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="admin-settings">
              <h3>הגדרות מערכת</h3>
              <div className="admin-setting-item">
                <label>עמלת דילר (%)</label>
                <input type="number" defaultValue="5" min="0" max="10" />
              </div>
              <div className="admin-setting-item">
                <label>עמלת בית (%)</label>
                <input type="number" defaultValue="5" min="0" max="10" />
              </div>
              <div className="admin-setting-item">
                <label>צ'יפים התחלתיים</label>
                <input type="number" defaultValue="20000" min="1000" />
              </div>
              <button>שמור הגדרות</button>
              
              <div className="admin-users-section" style={{ marginTop: '30px', paddingTop: '30px', borderTop: '2px solid #333' }}>
                <h3>ניהול משתמשים</h3>
                <div className="admin-setting-item">
                  <label>הפוך משתמש לאדמין (לפי אימייל)</label>
                  <button 
                    onClick={async () => {
                      const email = await showPrompt('הזן אימייל של המשתמש להפוך לאדמין:', 'הפוך לאדמין', 'matanyou7@gmail.com', 'email');
                      if (!email) return;
                      
                      try {
                        setLoading(true);
                        // Find user by email
                        const usersRef = collection(db, 'users');
                        const q = query(usersRef, where('email', '==', email));
                        const snapshot = await getDocs(q);
                        
                        if (snapshot.empty) {
                          // Try to find by uid if email not found
                          const allUsers = await getDocs(usersRef);
                          const userDoc = Array.from(allUsers.docs).find(doc => {
                            const data = doc.data();
                            return data.email === email || doc.id === email;
                          });
                          
                          if (userDoc) {
                            await updateDoc(doc(db, 'users', userDoc.id), {
                              isAdmin: true,
                              email: email
                            });
                            await showAlert(`משתמש ${email} הופך לאדמין בהצלחה!`, 'success', 'הצלחה!');
                          } else {
                            await showAlert(`משתמש עם אימייל ${email} לא נמצא`, 'error', 'שגיאה');
                          }
                        } else {
                          // Update first matching user
                          const userDoc = snapshot.docs[0];
                          await updateDoc(doc(db, 'users', userDoc.id), {
                            isAdmin: true
                          });
                          await showAlert(`משתמש ${email} הופך לאדמין בהצלחה!`, 'success', 'הצלחה!');
                        }
                      } catch (error) {
                        console.error('Error making user admin:', error);
                        await showAlert(`שגיאה בהפיכת משתמש לאדמין: ${error.message}`, 'error', 'שגיאה');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    הפוך לאדמין
                  </button>
                </div>
                <div className="admin-setting-item" style={{ marginTop: '10px' }}>
                  <button 
                    onClick={async () => {
                      // Quick action: Make matanyou7@gmail.com admin
                      try {
                        setLoading(true);
                        const email = 'matanyou7@gmail.com';
                        const usersRef = collection(db, 'users');
                        const q = query(usersRef, where('email', '==', email));
                        const snapshot = await getDocs(q);
                        
                        if (snapshot.empty) {
                          // Try to find by searching all users
                          const allUsers = await getDocs(usersRef);
                          const userDoc = Array.from(allUsers.docs).find(doc => {
                            const data = doc.data();
                            return data.email === email;
                          });
                          
                          if (userDoc) {
                            await updateDoc(doc(db, 'users', userDoc.id), {
                              isAdmin: true,
                              email: email
                            });
                            await showAlert(`משתמש ${email} הופך לאדמין בהצלחה!`, 'success', 'הצלחה!');
                          } else {
                            await showAlert(`משתמש ${email} לא נמצא. ודא שהמשתמש נרשם קודם.`, 'warning', 'אזהרה');
                          }
                        } else {
                          const userDoc = snapshot.docs[0];
                          await updateDoc(doc(db, 'users', userDoc.id), {
                            isAdmin: true
                          });
                          await showAlert(`משתמש ${email} הופך לאדמין בהצלחה!`, 'success', 'הצלחה!');
                        }
                      } catch (error) {
                        console.error('Error making user admin:', error);
                        await showAlert(`שגיאה: ${error.message}`, 'error', 'שגיאה');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    style={{ backgroundColor: '#4CAF50', color: 'white' }}
                  >
                    הפוך את matanyou7@gmail.com לאדמין
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;


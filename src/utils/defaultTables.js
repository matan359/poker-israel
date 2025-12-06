/**
 * Default Public Tables Configuration
 * These tables are always available for all players
 */

export const DEFAULT_TABLES = [
  {
    name: 'שולחן למתחילים',
    minBet: 10,
    maxPlayers: 6,
    pot: 0,
    status: 'waiting',
    isPrivate: false,
    isDefault: true,
    level: 1,
    description: 'מתאים למתחילים - מינימום הימור נמוך'
  },
  {
    name: 'שולחן בסיסי',
    minBet: 25,
    maxPlayers: 6,
    pot: 0,
    status: 'waiting',
    isPrivate: false,
    isDefault: true,
    level: 2,
    description: 'שולחן בסיסי למשחק נוח'
  },
  {
    name: 'שולחן רגיל',
    minBet: 50,
    maxPlayers: 6,
    pot: 0,
    status: 'waiting',
    isPrivate: false,
    isDefault: true,
    level: 3,
    description: 'שולחן רגיל למשחקים יומיומיים'
  },
  {
    name: 'שולחן בינוני',
    minBet: 100,
    maxPlayers: 6,
    pot: 0,
    status: 'waiting',
    isPrivate: false,
    isDefault: true,
    level: 4,
    description: 'שולחן בינוני עם הימורים גבוהים יותר'
  },
  {
    name: 'שולחן גבוה',
    minBet: 250,
    maxPlayers: 6,
    pot: 0,
    status: 'waiting',
    isPrivate: false,
    isDefault: true,
    level: 5,
    description: 'שולחן גבוה למשחקים רציניים'
  },
  {
    name: 'שולחן גבוה מאוד',
    minBet: 500,
    maxPlayers: 6,
    pot: 0,
    status: 'waiting',
    isPrivate: false,
    isDefault: true,
    level: 6,
    description: 'שולחן גבוה מאוד - למשחקים מקצועיים'
  },
  {
    name: 'חדר VIP',
    minBet: 1000,
    maxPlayers: 6,
    pot: 0,
    status: 'waiting',
    isPrivate: false,
    isDefault: true,
    level: 7,
    description: 'חדר VIP - משחקים ברמה גבוהה'
  },
  {
    name: 'חדר VIP Premium',
    minBet: 2500,
    maxPlayers: 6,
    pot: 0,
    status: 'waiting',
    isPrivate: false,
    isDefault: true,
    level: 8,
    description: 'חדר VIP Premium - למשחקים יוקרתיים'
  },
  {
    name: 'חדר אליטה',
    minBet: 5000,
    maxPlayers: 6,
    pot: 0,
    status: 'waiting',
    isPrivate: false,
    isDefault: true,
    level: 9,
    description: 'חדר אליטה - המשחקים הגבוהים ביותר'
  },
  {
    name: 'חדר מאסטר',
    minBet: 10000,
    maxPlayers: 6,
    pot: 0,
    status: 'waiting',
    isPrivate: false,
    isDefault: true,
    level: 10,
    description: 'חדר מאסטר - המשחקים היוקרתיים ביותר'
  }
];

/**
 * Initialize default tables in Firestore
 * Creates default tables if they don't exist
 */
export const initializeDefaultTables = async (db) => {
  try {
    const { collection, getDocs, doc, setDoc, query, where } = await import('firebase/firestore');
    const tablesRef = collection(db, 'tables');
    
    console.log('Checking for existing default tables...');
    
    // Check if default tables already exist
    let existingDefaultTables = [];
    try {
      const q = query(tablesRef, where('isDefault', '==', true));
      const existingSnapshot = await getDocs(q);
      existingDefaultTables = existingSnapshot.docs.map(doc => {
        const data = doc.data();
        return data.level;
      });
      console.log(`Found ${existingDefaultTables.length} existing default tables`);
    } catch (queryError) {
      console.warn('Could not query existing tables, will try to create all:', queryError);
      // Continue - will try to create all tables
    }
    
    // Create missing default tables
    const promises = DEFAULT_TABLES.map(async (tableConfig, index) => {
      const level = index + 1;
      
      // Skip if this level already exists
      if (existingDefaultTables.includes(level)) {
        console.log(`Default table level ${level} already exists, skipping`);
        return;
      }
      
      // Create table document with fixed ID based on level
      const tableId = `default_table_level_${level}`;
      const tableRef = doc(db, 'tables', tableId);
      
      const tableData = {
        id: tableId,
        ...tableConfig,
        players: 0,
        connectedPlayers: [],
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        // Ensure all required fields are present
        password: null,
        isPrivate: false,
        status: 'waiting'
      };
      
      try {
        await setDoc(tableRef, tableData, { merge: true });
        console.log(`✅ Created default table: ${tableConfig.name} (Level ${level})`);
        return true;
      } catch (error) {
        console.error(`❌ Error creating default table level ${level}:`, error);
        console.error('Error details:', error.code, error.message);
        // Don't throw - continue with other tables
        return false;
      }
    });
    
    const results = await Promise.all(promises);
    const created = results.filter(r => r === true).length;
    console.log(`Default tables initialization complete: ${created}/${DEFAULT_TABLES.length} created`);
    
    return created;
  } catch (error) {
    console.error('Error initializing default tables:', error);
    throw error;
  }
};


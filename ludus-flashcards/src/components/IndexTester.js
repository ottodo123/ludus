import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDueCards, getLearningCards, getUserStats } from '../services/userDataService';

const IndexTester = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('');

  const testIndexes = async () => {
    if (!user) {
      setStatus('❌ Please sign in first to test indexes');
      return;
    }

    setStatus('🧪 Testing Firebase indexes...');
    
    try {
      console.log('🔍 Testing getDueCards query...');
      await getDueCards(user.uid);
      
      console.log('🔍 Testing getLearningCards query...');
      await getLearningCards(user.uid);
      
      console.log('🔍 Testing getUserStats query...');
      await getUserStats(user.uid);
      
      setStatus('✅ All queries completed! Check console for any index creation links.');
    } catch (error) {
      console.error('Query error:', error);
      setStatus('⚠️ Some queries failed - check console for index creation links!');
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', margin: '20px' }}>
        <h3>🔍 Firebase Index Tester</h3>
        <p>Sign in with Google to test Firebase queries and generate index creation links.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', margin: '20px' }}>
      <h3>🔍 Firebase Index Tester</h3>
      <p>Click the button below to run queries that require Firebase indexes.</p>
      <p><strong>Check your browser console</strong> for index creation links!</p>
      
      <button 
        onClick={testIndexes}
        style={{
          padding: '12px 24px',
          background: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '10px'
        }}
      >
        Test Firebase Indexes
      </button>
      
      {status && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: status.includes('❌') ? '#ffe6e6' : status.includes('✅') ? '#e6ffe6' : '#fff3cd',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}>
          {status}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>Expected Index Creation Links:</h4>
        <ol>
          <li><strong>Due Cards Query:</strong> needs index on: <code>nextReview (asc)</code></li>
          <li><strong>Learning Cards Query:</strong> needs index on: <code>repetitions (asc), lastReviewed (desc)</code></li>
          <li><strong>User Stats Query:</strong> needs index on: <code>totalReviews (desc), correctReviews (desc)</code></li>
        </ol>
        <p><em>These links will appear in your browser console when you click "Test Firebase Indexes"</em></p>
      </div>
    </div>
  );
};

export default IndexTester; 
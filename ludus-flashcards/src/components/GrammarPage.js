import React, { useState, useEffect } from 'react';
import '../styles/GrammarPage.css';

const GrammarPage = () => {
  const [grammarData, setGrammarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isChronological, setIsChronological] = useState(false);

  useEffect(() => {
    const loadGrammarData = async () => {
      try {
        const response = await fetch('./data/grammar_appendix.json');
        if (!response.ok) {
          throw new Error('Failed to load grammar data');
        }
        const data = await response.json();
        setGrammarData(data);
        setFilteredData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading grammar data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadGrammarData();
  }, []);

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(grammarData);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
    
    const filtered = grammarData.map(category => {
      const filteredPoints = category.points.filter(point => {
        // Create searchable text from all fields
        const searchableText = [
          point.title,
          point.description,
          point.number.toString(),
          ...point.examples,
          ...point.tags,
          category.title // Include category title in search
        ].join(' ').toLowerCase();

        // Check for each search word individually (allows partial matching)
        const wordMatches = searchWords.some(word => {
          // For terms like "conditional", also search for "condition"
          const baseWord = word.endsWith('al') ? word.slice(0, -2) : word;
          return searchableText.includes(word) || 
                 searchableText.includes(baseWord) ||
                 (word.length > 3 && searchableText.includes(word.substring(0, word.length - 1)));
        });

        // Also check for full term match
        const fullTermMatch = searchableText.includes(searchLower);
        
        // Special handling for "conditional" to match "condition", "contrary"
        let specialMatch = false;
        if (searchLower === 'conditional') {
          specialMatch = searchableText.includes('condition') || 
                        searchableText.includes('contrary') ||
                        searchableText.includes('vivid');
        }
        
        return wordMatches || fullTermMatch || specialMatch;
      });

      return {
        ...category,
        points: filteredPoints
      };
    }).filter(category => category.points.length > 0);

    setFilteredData(filtered);
  }, [searchTerm, grammarData]);

  // Chronological sorting logic
  const parseReference = (title) => {
    // Find ALL references and their positions, then take the FIRST one
    const refs = [];
    
    // Find all reference types with their positions
    const ludMatches = [...title.matchAll(/LUD (\d+(?:\.\d+)?)/g)];
    const bgMatches = [...title.matchAll(/BG ([IVX]+)\.(\d+)/g)];
    const catMatches = [...title.matchAll(/CAT ([IVX]+)\.(\d+)/g)];
    const cpMatches = [...title.matchAll(/C\+P (\d+)/g)];
    const verMatches = [...title.matchAll(/VER (\d+)/g)];
    
    // Add all found references with their positions
    ludMatches.forEach(match => {
      refs.push({
        type: 'LUD',
        value: parseFloat(match[1]),
        order: 1,
        position: match.index
      });
    });
    
    bgMatches.forEach(match => {
      const book = match[1] === 'I' ? 1 : match[1] === 'II' ? 2 : match[1] === 'III' ? 3 : 4;
      refs.push({
        type: 'BG',
        book,
        section: parseInt(match[2]),
        order: 2,
        position: match.index
      });
    });
    
    catMatches.forEach(match => {
      const oration = match[1] === 'I' ? 1 : 3;
      refs.push({
        type: 'CAT',
        oration,
        section: parseInt(match[2]),
        order: 3,
        position: match.index
      });
    });
    
    cpMatches.forEach(match => {
      refs.push({
        type: 'CP',
        value: parseInt(match[1]),
        order: 4,
        position: match.index
      });
    });
    
    verMatches.forEach(match => {
      refs.push({
        type: 'VER',
        value: parseInt(match[1]),
        order: 5,
        position: match.index
      });
    });
    
    // Sort by position to get first occurrence
    refs.sort((a, b) => a.position - b.position);
    
    // Return first reference found, or NONE if no references
    return refs.length > 0 ? refs[0] : { type: 'NONE', order: 6 };
  };

  const sortChronologically = (data) => {
    const allPoints = [];
    
    // Flatten all points with their references
    data.forEach(category => {
      category.points.forEach(point => {
        const ref = parseReference(point.title);
        allPoints.push({
          ...point,
          category: category.title,
          reference: ref
        });
      });
    });

    // Sort by curriculum order
    allPoints.sort((a, b) => {
      const aRef = a.reference;
      const bRef = b.reference;
      
      // First sort by type order (LUD, BG, CAT, CP, NONE)
      if (aRef.order !== bRef.order) {
        return aRef.order - bRef.order;
      }
      
      // Within same type, sort by specific values
      if (aRef.type === 'LUD') {
        return aRef.value - bRef.value;
      } else if (aRef.type === 'BG') {
        if (aRef.book !== bRef.book) return aRef.book - bRef.book;
        return aRef.section - bRef.section;
      } else if (aRef.type === 'CAT') {
        if (aRef.oration !== bRef.oration) return aRef.oration - bRef.oration;
        return aRef.section - bRef.section;
      } else if (aRef.type === 'CP') {
        return aRef.value - bRef.value;
      } else if (aRef.type === 'VER') {
        return aRef.value - bRef.value;
      }
      
      // Fallback to point number
      return parseInt(a.number) - parseInt(b.number);
    });

    return allPoints;
  };

  // Apply chronological sorting if enabled
  const displayData = isChronological ? 
    [{ title: "Chronological Order", points: sortChronologically(filteredData) }] : 
    filteredData;


  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="grammar-page">
        <div className="grammar-container">
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading grammar reference...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grammar-page">
        <div className="grammar-container">
          <div className="error-message">
            <p>Error loading grammar data: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grammar-page">
      <div className="grammar-container">
        {/* Header with Search */}
        <div className="grammar-header">
          <h1>Latin Grammar Reference</h1>
          <p className="grammar-subtitle">
            Comprehensive grammar points with examples and explanations
          </p>
          
          <div className="search-bar">
            <div className="search-input-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search grammar points, constructions, tags, or examples..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search" onClick={clearSearch}>
                  ✕
                </button>
              )}
            </div>
            <button 
              className={`filter-button ${isChronological ? 'active' : ''}`}
              onClick={() => setIsChronological(!isChronological)}
              title={isChronological ? "Switch to categorical view" : "Sort by curriculum order (LUD → BG → CAT)"}
            >
              {isChronological ? '📚 Chronological' : '📋 Categories'}
            </button>
          </div>
        </div>


        {/* Grammar Content - All Expanded */}
        <div className="grammar-content">
          {displayData.length > 0 ? (
            displayData.map((category, categoryIndex) => (
              <div key={categoryIndex} className="grammar-category" id={`category-${categoryIndex}`}>
                <div className="category-header">
                  <h2 className="category-title">{category.title}</h2>
                  <span className="point-count">{category.points.length} points</span>
                </div>

                <div className="category-content">
                  {category.points.map((point, pointIndex) => (
                    <div key={pointIndex} className="grammar-point" id={`point-${categoryIndex}-${pointIndex}`}>
                      <div className="point-header">
                        <div className="point-number">#{point.number}</div>
                        <h3 className="point-title">{point.title}</h3>
                        {isChronological && point.category && (
                          <span className="point-category">{point.category}</span>
                        )}
                      </div>

                      <div className="point-content">
                        {point.description && (
                          <div className="point-description">
                            <p>{point.description}</p>
                          </div>
                        )}
                        
                        {point.examples && point.examples.length > 0 && (
                          <div className="point-examples">
                            <div className="examples-container">
                              {point.examples.join('\n')}
                            </div>
                          </div>
                        )}

                        {point.tags && point.tags.length > 0 && (
                          <div className="point-tags">
                            {point.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No grammar points found for "{searchTerm}"</p>
              <button className="clear-search-button" onClick={clearSearch}>
                Clear search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrammarPage;
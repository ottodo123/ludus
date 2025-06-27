const fs = require('fs');
const path = require('path');

// Load Whitaker's dictionary data
function loadWhitakersData() {
    const whitakersPath = path.join(__dirname, 'ludus-flashcards/src/data/whitakersOptimized.json');
    const data = JSON.parse(fs.readFileSync(whitakersPath, 'utf8'));
    return data.entries;
}

// Remove macrons from Latin text for dictionary matching
function stripMacrons(text) {
    return text
        .replace(/ā/g, 'a').replace(/ē/g, 'e').replace(/ī/g, 'i').replace(/ō/g, 'o').replace(/ū/g, 'u').replace(/ȳ/g, 'y')
        .replace(/Ā/g, 'A').replace(/Ē/g, 'E').replace(/Ī/g, 'I').replace(/Ō/g, 'O').replace(/Ū/g, 'U').replace(/Ȳ/g, 'Y');
}

// Parse CSV content carefully handling quotes
function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const rows = lines.slice(1).map(line => {
        const row = {};
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && (i === 0 || line[i-1] === ',')) {
                inQuotes = true;
            } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
                inQuotes = false;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        return row;
    });
    return { headers, rows };
}

// Convert rows back to CSV with proper quoting
function rowsToCSV(headers, rows) {
    const headerLine = headers.join(',');
    const dataLines = rows.map(row => 
        headers.map(header => {
            const value = row[header] || '';
            return value.includes(',') ? `"${value}"` : value;
        }).join(',')
    );
    return [headerLine, ...dataLines].join('\n');
}

// Find dictionary entry by headword (with macron handling)
function findDictionaryEntry(headword, entries) {
    const cleanHeadword = stripMacrons(headword.toLowerCase().trim());
    
    // Try exact match first
    let match = entries.find(entry => {
        if (!entry.dictionaryForm) return false;
        const firstForm = stripMacrons(entry.dictionaryForm.split(',')[0].trim().toLowerCase());
        return firstForm === cleanHeadword;
    });
    
    if (match) return match;
    
    // Try partial match
    match = entries.find(entry => {
        if (!entry.dictionaryForm) return false;
        return stripMacrons(entry.dictionaryForm.toLowerCase()).includes(cleanHeadword);
    });
    
    if (match) return match;
    
    // Try matching any part of the dictionary form
    match = entries.find(entry => {
        if (!entry.dictionaryForm) return false;
        const forms = entry.dictionaryForm.split(',').map(f => stripMacrons(f.trim().toLowerCase()));
        return forms.some(form => form === cleanHeadword);
    });
    
    return match;
}

// Extract proper latin_endings following Ludus format
function extractLatinEndings(headword, dictionaryForm, partOfSpeech, gender, declension) {
    if (!dictionaryForm) return '';
    
    const forms = dictionaryForm.split(',').map(f => f.trim());
    const mainForm = forms[0];
    
    // For nouns - show genitive ending and gender
    if (partOfSpeech === 'N' && forms.length >= 2) {
        const genitive = forms[1];
        const nominative = forms[0];
        
        // Extract genitive ending
        let genitiveEnding = '';
        let stem = '';
        for (let i = 0; i < Math.min(nominative.length, genitive.length); i++) {
            if (nominative[i].toLowerCase() === genitive[i].toLowerCase()) {
                stem += nominative[i];
            } else {
                break;
            }
        }
        
        if (stem.length > 0) {
            genitiveEnding = genitive.substring(stem.length);
        } else {
            genitiveEnding = genitive;
        }
        
        // Add gender indicator
        let genderMark = '';
        if (gender) {
            if (gender.includes('M')) genderMark = ', m.';
            else if (gender.includes('F')) genderMark = ', f.';
            else if (gender.includes('N')) genderMark = ', n.';
        }
        
        return `-${genitiveEnding}${genderMark}`;
    }
    
    // For verbs - show infinitive, perfect (if available)
    if (partOfSpeech === 'V' && forms.length >= 2) {
        const infinitive = forms[1];
        let result = infinitive;
        
        // Add perfect if available
        if (forms.length >= 3 && forms[2]) {
            result += `, ${forms[2]}`;
        }
        
        // Add conjugation number in parentheses
        let conj = '';
        if (infinitive.endsWith('are')) conj = ' (1)';
        else if (infinitive.endsWith('ēre')) conj = ' (2)';
        else if (infinitive.endsWith('ere')) conj = ' (3)';
        else if (infinitive.endsWith('ire')) conj = ' (4)';
        
        return result + conj;
    }
    
    // For adjectives - show feminine and neuter forms
    if (partOfSpeech === 'ADJ' && forms.length >= 3) {
        return `${forms[1]}, ${forms[2]}`;
    } else if (partOfSpeech === 'ADJ' && forms.length >= 2) {
        return forms[1];
    }
    
    // For pronouns - show other forms
    if (partOfSpeech === 'PRON' && forms.length >= 2) {
        return forms.slice(1).join(', ');
    }
    
    // For other parts of speech with multiple forms
    if (forms.length >= 2) {
        return forms.slice(1).join(', ');
    }
    
    return '';
}

// Convert part of speech to Ludus format
function formatPartOfSpeech(partOfSpeech, partOfSpeechDisplay) {
    if (partOfSpeechDisplay) {
        return partOfSpeechDisplay.toLowerCase();
    }
    
    switch (partOfSpeech) {
        case 'N': return 'noun';
        case 'V': return 'verb';
        case 'ADJ': return 'adjective';
        case 'ADV': return 'adverb';
        case 'PRON': return 'pronoun';
        case 'PREP': return 'preposition';
        case 'CONJ': return 'conjunction';
        case 'INTERJ': return 'interjection';
        default: return partOfSpeech.toLowerCase();
    }
}

// Process Caesar CSV
function processCaesarCSV(entries) {
    console.log('Processing caesar_required.csv...');
    const content = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/caesar_required.csv', 'utf8');
    const { headers, rows } = parseCSV(content);
    
    let matchedCount = 0;
    let filledCount = 0;
    
    const processedRows = rows.map(row => {
        const headword = row['latin_headword'];
        
        if (!headword) return row;
        
        // Only fill empty fields
        const needsEndings = !row['latin_endings'];
        const needsPOS = !row['part_of_speech'];
        const needsEnglish = !row['english'];
        
        if (!needsEndings && !needsPOS && !needsEnglish) {
            return row;
        }
        
        const dictEntry = findDictionaryEntry(headword, entries);
        if (dictEntry) {
            matchedCount++;
            
            if (needsEndings) {
                const endings = extractLatinEndings(headword, dictEntry.dictionaryForm, dictEntry.partOfSpeech, dictEntry.gender, dictEntry.declension);
                if (endings) {
                    row['latin_endings'] = endings;
                    filledCount++;
                }
            }
            
            if (needsPOS) {
                row['part_of_speech'] = formatPartOfSpeech(dictEntry.partOfSpeech, dictEntry.partOfSpeechDisplay);
            }
            
            if (needsEnglish && dictEntry.meaning) {
                row['english'] = dictEntry.meaning;
            }
            
            console.log(`✓ Enhanced ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return row;
    });
    
    console.log(`Caesar: ${matchedCount} matches, ${filledCount} endings filled`);
    
    const output = rowsToCSV(headers, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/caesar_required_final.csv', output);
    return { matched: matchedCount, filled: filledCount };
}

// Process Cicero CSV
function processCiceroCSV(entries) {
    console.log('Processing Cicero_Required.csv...');
    const content = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/Cicero_Required.csv', 'utf8');
    const { headers, rows } = parseCSV(content);
    
    let matchedCount = 0;
    let filledCount = 0;
    
    const processedRows = rows.map(row => {
        const headword = row['latin_headword'];
        
        if (!headword) return row;
        
        // Only fill empty fields
        const needsEndings = !row['latin_endings'];
        const needsPOS = !row['part_of_speech'];
        const needsEnglish = !row['english'];
        
        if (!needsEndings && !needsPOS && !needsEnglish) {
            return row;
        }
        
        const dictEntry = findDictionaryEntry(headword, entries);
        if (dictEntry) {
            matchedCount++;
            
            if (needsEndings) {
                const endings = extractLatinEndings(headword, dictEntry.dictionaryForm, dictEntry.partOfSpeech, dictEntry.gender, dictEntry.declension);
                if (endings) {
                    row['latin_endings'] = endings;
                    filledCount++;
                }
            }
            
            if (needsPOS) {
                row['part_of_speech'] = formatPartOfSpeech(dictEntry.partOfSpeech, dictEntry.partOfSpeechDisplay);
            }
            
            if (needsEnglish && dictEntry.meaning) {
                row['english'] = dictEntry.meaning;
            }
            
            console.log(`✓ Enhanced ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return row;
    });
    
    console.log(`Cicero: ${matchedCount} matches, ${filledCount} endings filled`);
    
    const output = rowsToCSV(headers, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/Cicero_Required_final.csv', output);
    return { matched: matchedCount, filled: filledCount };
}

// Process Apuleius CSV
function processApuleiusCSV(entries) {
    console.log('Processing Apuleius_Required.csv...');
    const content = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/Apuleius_Required.csv', 'utf8');
    const { headers, rows } = parseCSV(content);
    
    let matchedCount = 0;
    let filledCount = 0;
    
    const processedRows = rows.map(row => {
        const headword = row['Headword'];
        
        if (!headword) return row;
        
        // Only fill empty fields
        const needsEntry = !row['Latin_Entry'];
        const needsPOS = !row['Part_of_Speech'];
        const needsEnglish = !row['English'];
        
        if (!needsEntry && !needsPOS && !needsEnglish) {
            return row;
        }
        
        const dictEntry = findDictionaryEntry(headword, entries);
        if (dictEntry) {
            matchedCount++;
            
            if (needsEntry) {
                const endings = extractLatinEndings(headword, dictEntry.dictionaryForm, dictEntry.partOfSpeech, dictEntry.gender, dictEntry.declension);
                if (endings) {
                    row['Latin_Entry'] = endings;
                    filledCount++;
                }
            }
            
            if (needsPOS) {
                row['Part_of_Speech'] = formatPartOfSpeech(dictEntry.partOfSpeech, dictEntry.partOfSpeechDisplay);
            }
            
            if (needsEnglish && dictEntry.meaning) {
                row['English'] = dictEntry.meaning;
            }
            
            console.log(`✓ Enhanced ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return row;
    });
    
    console.log(`Apuleius: ${matchedCount} matches, ${filledCount} entries filled`);
    
    const output = rowsToCSV(headers, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/Apuleius_Required_final.csv', output);
    return { matched: matchedCount, filled: filledCount };
}

// Process Ovid CSV
function processOvidCSV(entries) {
    console.log('Processing Ovid_Required.csv...');
    const content = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/Ovid_Required.csv', 'utf8');
    const { headers, rows } = parseCSV(content);
    
    let matchedCount = 0;
    let filledCount = 0;
    
    const processedRows = rows.map(row => {
        const headword = row['Headword'];
        
        if (!headword) return row;
        
        // Only fill empty fields
        const needsEntry = !row['Latin_Entry'];
        const needsPOS = !row['Part_of_Speech'];
        const needsEnglish = !row['English'];
        
        if (!needsEntry && !needsPOS && !needsEnglish) {
            return row;
        }
        
        const dictEntry = findDictionaryEntry(headword, entries);
        if (dictEntry) {
            matchedCount++;
            
            if (needsEntry) {
                const endings = extractLatinEndings(headword, dictEntry.dictionaryForm, dictEntry.partOfSpeech, dictEntry.gender, dictEntry.declension);
                if (endings) {
                    row['Latin_Entry'] = endings;
                    filledCount++;
                }
            }
            
            if (needsPOS) {
                row['Part_of_Speech'] = formatPartOfSpeech(dictEntry.partOfSpeech, dictEntry.partOfSpeechDisplay);
            }
            
            if (needsEnglish && dictEntry.meaning) {
                row['English'] = dictEntry.meaning;
            }
            
            console.log(`✓ Enhanced ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return row;
    });
    
    console.log(`Ovid: ${matchedCount} matches, ${filledCount} entries filled`);
    
    const output = rowsToCSV(headers, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/Ovid_Required_final.csv', output);
    return { matched: matchedCount, filled: filledCount };
}

// Main execution
function main() {
    console.log('Loading Whitaker\'s dictionary data...');
    const entries = loadWhitakersData();
    console.log(`Loaded ${entries.length} dictionary entries\n`);
    
    const results = [];
    
    try {
        results.push(processCaesarCSV(entries));
        results.push(processCiceroCSV(entries));
        results.push(processApuleiusCSV(entries));
        results.push(processOvidCSV(entries));
        
        console.log('\n=== FINAL SUMMARY ===');
        console.log('Enhanced CSV files created with "_final" suffix');
        const files = ['caesar_required.csv', 'Cicero_Required.csv', 'Apuleius_Required.csv', 'Ovid_Required.csv'];
        results.forEach((result, index) => {
            console.log(`${files[index]}: ${result.matched} matches, ${result.filled} entries filled`);
        });
        
    } catch (error) {
        console.error('Error processing files:', error);
    }
}

if (require.main === module) {
    main();
}
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

// Robust CSV parser that handles quoted fields
function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    
    const rows = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((header, index) => {
            row[header.trim()] = (values[index] || '').trim();
        });
        return row;
    });
    return { headers, rows };
}

// Parse a single CSV line handling quotes properly
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip the next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Convert rows back to CSV with proper quoting
function rowsToCSV(headers, rows) {
    const escapeCellValue = (value) => {
        if (!value) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };
    
    const headerLine = headers.map(escapeCellValue).join(',');
    const dataLines = rows.map(row => 
        headers.map(header => escapeCellValue(row[header] || '')).join(',')
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

// Extract proper latin_endings following Ludus format exactly
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

// Check if a field is truly empty (not just whitespace)
function isEmpty(value) {
    return !value || value.trim() === '';
}

// Process Caesar CSV
function processCaesarCSV(entries) {
    console.log('Processing caesar_required.csv...');
    const content = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/caesar_required.csv', 'utf8');
    const { headers, rows } = parseCSV(content);
    
    // Ensure we have exactly the expected headers
    const expectedHeaders = ['lesson_number', 'latin_headword', 'latin_endings', 'part_of_speech', 'english'];
    if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
        console.warn('Headers mismatch in caesar_required.csv');
        console.log('Expected:', expectedHeaders);
        console.log('Found:', headers);
    }
    
    let matchedCount = 0;
    let filledCount = 0;
    
    const processedRows = rows.map((row, index) => {
        const headword = row['latin_headword'];
        
        if (!headword) return row;
        
        // Only fill truly empty fields
        const needsEndings = isEmpty(row['latin_endings']);
        const needsPOS = isEmpty(row['part_of_speech']) || row['part_of_speech'] === 'adj. & noun';
        const needsEnglish = isEmpty(row['english']);
        
        if (!needsEndings && !needsPOS && !needsEnglish) {
            return row;
        }
        
        const dictEntry = findDictionaryEntry(headword, entries);
        if (dictEntry) {
            matchedCount++;
            
            // Create a clean row with only the expected fields
            const cleanRow = {
                'lesson_number': row['lesson_number'] || '',
                'latin_headword': row['latin_headword'] || '',
                'latin_endings': row['latin_endings'] || '',
                'part_of_speech': row['part_of_speech'] || '',
                'english': row['english'] || ''
            };
            
            if (needsEndings) {
                const endings = extractLatinEndings(headword, dictEntry.dictionaryForm, dictEntry.partOfSpeech, dictEntry.gender, dictEntry.declension);
                if (endings) {
                    cleanRow['latin_endings'] = endings;
                    filledCount++;
                }
            }
            
            if (needsPOS && (!row['part_of_speech'] || row['part_of_speech'] === 'adj. & noun')) {
                cleanRow['part_of_speech'] = formatPartOfSpeech(dictEntry.partOfSpeech, dictEntry.partOfSpeechDisplay);
            }
            
            if (needsEnglish && dictEntry.meaning) {
                cleanRow['english'] = dictEntry.meaning;
            }
            
            console.log(`✓ Enhanced ${headword} -> ${dictEntry.dictionaryForm}`);
            return cleanRow;
        } else {
            console.log(`✗ No match found for: ${headword}`);
            // Return clean row even if no match
            return {
                'lesson_number': row['lesson_number'] || '',
                'latin_headword': row['latin_headword'] || '',
                'latin_endings': row['latin_endings'] || '',
                'part_of_speech': row['part_of_speech'] || '',
                'english': row['english'] || ''
            };
        }
    });
    
    console.log(`Caesar: ${matchedCount} matches, ${filledCount} endings filled`);
    
    const output = rowsToCSV(expectedHeaders, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/caesar_required_perfect.csv', output);
    return { matched: matchedCount, filled: filledCount };
}

// Process Cicero CSV  
function processCiceroCSV(entries) {
    console.log('Processing Cicero_Required.csv...');
    const content = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/Cicero_Required.csv', 'utf8');
    const { headers, rows } = parseCSV(content);
    
    // Expected headers for Cicero
    const expectedHeaders = ['lesson_number', 'latin_headword', 'latin_endings', 'part_of_speech', 'english'];
    
    let matchedCount = 0;
    let filledCount = 0;
    
    const processedRows = rows.map(row => {
        const headword = row['latin_headword'];
        
        if (!headword) return {
            'lesson_number': row['lesson_number'] || '',
            'latin_headword': '',
            'latin_endings': '',
            'part_of_speech': '',
            'english': ''
        };
        
        // Check which fields need filling - be very strict about what constitutes empty
        const needsEndings = isEmpty(row['latin_endings']);
        const needsPOS = isEmpty(row['part_of_speech']);
        const needsEnglish = isEmpty(row['english']);
        
        const dictEntry = findDictionaryEntry(headword, entries);
        
        // Create clean row
        const cleanRow = {
            'lesson_number': row['lesson_number'] || '',
            'latin_headword': headword,
            'latin_endings': row['latin_endings'] || '',
            'part_of_speech': row['part_of_speech'] || '',
            'english': row['english'] || ''
        };
        
        if (dictEntry) {
            matchedCount++;
            
            if (needsEndings) {
                const endings = extractLatinEndings(headword, dictEntry.dictionaryForm, dictEntry.partOfSpeech, dictEntry.gender, dictEntry.declension);
                if (endings) {
                    cleanRow['latin_endings'] = endings;
                    filledCount++;
                }
            }
            
            if (needsPOS) {
                cleanRow['part_of_speech'] = formatPartOfSpeech(dictEntry.partOfSpeech, dictEntry.partOfSpeechDisplay);
            }
            
            if (needsEnglish && dictEntry.meaning) {
                cleanRow['english'] = dictEntry.meaning;
            }
            
            console.log(`✓ Enhanced ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return cleanRow;
    });
    
    console.log(`Cicero: ${matchedCount} matches, ${filledCount} endings filled`);
    
    const output = rowsToCSV(expectedHeaders, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/Cicero_Required_perfect.csv', output);
    return { matched: matchedCount, filled: filledCount };
}

// Process Apuleius CSV
function processApuleiusCSV(entries) {
    console.log('Processing Apuleius_Required.csv...');
    const content = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/Apuleius_Required.csv', 'utf8');
    const { headers, rows } = parseCSV(content);
    
    const expectedHeaders = ['Chapter', 'Headword', 'Latin_Entry', 'Part_of_Speech', 'English'];
    
    let matchedCount = 0;
    let filledCount = 0;
    
    const processedRows = rows.map(row => {
        const headword = row['Headword'];
        
        if (!headword) return {
            'Chapter': row['Chapter'] || '',
            'Headword': '',
            'Latin_Entry': '',
            'Part_of_Speech': '',
            'English': ''
        };
        
        const needsEntry = isEmpty(row['Latin_Entry']);
        const needsPOS = isEmpty(row['Part_of_Speech']);
        const needsEnglish = isEmpty(row['English']);
        
        const dictEntry = findDictionaryEntry(headword, entries);
        
        const cleanRow = {
            'Chapter': row['Chapter'] || '',
            'Headword': headword,
            'Latin_Entry': row['Latin_Entry'] || '',
            'Part_of_Speech': row['Part_of_Speech'] || '',
            'English': row['English'] || ''
        };
        
        if (dictEntry) {
            matchedCount++;
            
            if (needsEntry) {
                const endings = extractLatinEndings(headword, dictEntry.dictionaryForm, dictEntry.partOfSpeech, dictEntry.gender, dictEntry.declension);
                if (endings) {
                    cleanRow['Latin_Entry'] = endings;
                    filledCount++;
                }
            }
            
            if (needsPOS) {
                cleanRow['Part_of_Speech'] = formatPartOfSpeech(dictEntry.partOfSpeech, dictEntry.partOfSpeechDisplay);
            }
            
            if (needsEnglish && dictEntry.meaning) {
                cleanRow['English'] = dictEntry.meaning;
            }
            
            console.log(`✓ Enhanced ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return cleanRow;
    });
    
    console.log(`Apuleius: ${matchedCount} matches, ${filledCount} entries filled`);
    
    const output = rowsToCSV(expectedHeaders, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/Apuleius_Required_perfect.csv', output);
    return { matched: matchedCount, filled: filledCount };
}

// Process Ovid CSV
function processOvidCSV(entries) {
    console.log('Processing Ovid_Required.csv...');
    const content = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/Ovid_Required.csv', 'utf8');
    const { headers, rows } = parseCSV(content);
    
    const expectedHeaders = ['Chapter', 'Headword', 'Latin_Entry', 'Part_of_Speech', 'English'];
    
    let matchedCount = 0;
    let filledCount = 0;
    
    const processedRows = rows.map(row => {
        const headword = row['Headword'];
        
        if (!headword) return {
            'Chapter': row['Chapter'] || '',
            'Headword': '',
            'Latin_Entry': '',
            'Part_of_Speech': '',
            'English': ''
        };
        
        const needsEntry = isEmpty(row['Latin_Entry']);
        const needsPOS = isEmpty(row['Part_of_Speech']);
        const needsEnglish = isEmpty(row['English']);
        
        const dictEntry = findDictionaryEntry(headword, entries);
        
        const cleanRow = {
            'Chapter': row['Chapter'] || '',
            'Headword': headword,
            'Latin_Entry': row['Latin_Entry'] || '',
            'Part_of_Speech': row['Part_of_Speech'] || '',
            'English': row['English'] || ''
        };
        
        if (dictEntry) {
            matchedCount++;
            
            if (needsEntry) {
                const endings = extractLatinEndings(headword, dictEntry.dictionaryForm, dictEntry.partOfSpeech, dictEntry.gender, dictEntry.declension);
                if (endings) {
                    cleanRow['Latin_Entry'] = endings;
                    filledCount++;
                }
            }
            
            if (needsPOS) {
                cleanRow['Part_of_Speech'] = formatPartOfSpeech(dictEntry.partOfSpeech, dictEntry.partOfSpeechDisplay);
            }
            
            if (needsEnglish && dictEntry.meaning) {
                cleanRow['English'] = dictEntry.meaning;
            }
            
            console.log(`✓ Enhanced ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return cleanRow;
    });
    
    console.log(`Ovid: ${matchedCount} matches, ${filledCount} entries filled`);
    
    const output = rowsToCSV(expectedHeaders, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/Ovid_Required_perfect.csv', output);
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
        
        console.log('\n=== PERFECT SUMMARY ===');
        console.log('Clean CSV files created with "_perfect" suffix');
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
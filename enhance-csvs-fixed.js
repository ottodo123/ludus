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
        .replace(/ā/g, 'a')
        .replace(/ē/g, 'e')
        .replace(/ī/g, 'i')
        .replace(/ō/g, 'o')
        .replace(/ū/g, 'u')
        .replace(/ȳ/g, 'y')
        .replace(/Ā/g, 'A')
        .replace(/Ē/g, 'E')
        .replace(/Ī/g, 'I')
        .replace(/Ō/g, 'O')
        .replace(/Ū/g, 'U')
        .replace(/Ȳ/g, 'Y');
}

// Parse CSV content
function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header.trim()] = values[index] ? values[index].trim() : '';
        });
        return row;
    });
    return { headers, rows };
}

// Convert rows back to CSV
function rowsToCSV(headers, rows) {
    const headerLine = headers.join(',');
    const dataLines = rows.map(row => 
        headers.map(header => {
            const value = row[header] || '';
            // Wrap in quotes if contains comma
            return value.includes(',') ? `"${value}"` : value;
        }).join(',')
    );
    return [headerLine, ...dataLines].join('\n');
}

// Find dictionary entry by headword (with macron handling)
function findDictionaryEntry(headword, entries) {
    // Clean the headword and strip macrons for matching
    const cleanHeadword = stripMacrons(headword.toLowerCase().trim());
    
    // Try exact match first on dictionaryForm
    let match = entries.find(entry => {
        if (!entry.dictionaryForm) return false;
        const firstForm = stripMacrons(entry.dictionaryForm.split(',')[0].trim().toLowerCase());
        return firstForm === cleanHeadword;
    });
    
    if (match) return match;
    
    // Try partial match
    match = entries.find(entry => {
        if (!entry.dictionaryForm) return false;
        const strippedForm = stripMacrons(entry.dictionaryForm.toLowerCase());
        return strippedForm.includes(cleanHeadword);
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

// Extract only the endings from dictionary form (following Ludus format)
function extractEndings(headword, dictionaryForm, partOfSpeech) {
    if (!dictionaryForm) return '';
    
    const forms = dictionaryForm.split(',').map(f => f.trim());
    const mainForm = forms[0];
    
    // For nouns, extract genitive ending
    if (partOfSpeech === 'N' && forms.length >= 2) {
        const genitive = forms[1];
        const nominative = forms[0];
        
        // Find common stem and return genitive ending
        let stem = '';
        for (let i = 0; i < Math.min(nominative.length, genitive.length); i++) {
            if (nominative[i].toLowerCase() === genitive[i].toLowerCase()) {
                stem += nominative[i];
            } else {
                break;
            }
        }
        
        if (stem.length > 0) {
            return '-' + genitive.substring(stem.length);
        }
        return '-' + genitive;
    }
    
    // For verbs, return infinitive in parentheses like "dare (1)"
    if (partOfSpeech === 'V' && forms.length >= 2) {
        const infinitive = forms[1];
        // Determine conjugation from infinitive ending
        let conj = '';
        if (infinitive.endsWith('are')) conj = ' (1)';
        else if (infinitive.endsWith('ere')) conj = ' (2)';
        else if (infinitive.endsWith('ere') && !infinitive.endsWith('ēre')) conj = ' (3)';
        else if (infinitive.endsWith('ire')) conj = ' (4)';
        
        return infinitive + conj;
    }
    
    // For adjectives, return feminine and neuter forms
    if (partOfSpeech === 'ADJ' && forms.length >= 3) {
        return forms[1] + ', ' + forms[2];
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

// Process individual CSV files
function processCaesarCSV(entries) {
    console.log('Processing caesar_required.csv...');
    const content = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/caesar_required.csv', 'utf8');
    const { headers, rows } = parseCSV(content);
    
    let matchedCount = 0;
    let totalCount = 0;
    
    const processedRows = rows.map(row => {
        totalCount++;
        const headword = row['latin_headword'];
        
        if (!headword || row['latin_endings'] || row['part_of_speech'] || row['english']) {
            return row; // Skip if already filled or no headword
        }
        
        const dictEntry = findDictionaryEntry(headword, entries);
        if (dictEntry) {
            matchedCount++;
            row['latin_endings'] = extractEndings(headword, dictEntry.dictionaryForm, dictEntry.partOfSpeech);
            row['part_of_speech'] = formatPartOfSpeech(dictEntry.partOfSpeech, dictEntry.partOfSpeechDisplay);
            row['english'] = dictEntry.meaning || '';
            console.log(`✓ Matched ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return row;
    });
    
    console.log(`Caesar: ${matchedCount}/${totalCount} entries matched`);
    
    const output = rowsToCSV(headers, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/caesar_required_fixed.csv', output);
    return { matched: matchedCount, total: totalCount };
}

function processCiceroCSV(entries) {
    console.log('Processing Cicero_Required.csv...');
    const content = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/Cicero_Required.csv', 'utf8');
    const { headers, rows } = parseCSV(content);
    
    let matchedCount = 0;
    let totalCount = 0;
    
    const processedRows = rows.map(row => {
        totalCount++;
        const headword = row['latin_headword'];
        
        if (!headword) {
            return row; // Skip if no headword
        }
        
        // Only fill missing fields
        const needsEndings = !row['latin_endings'];
        const needsPOS = !row['part_of_speech'];
        const needsEnglish = !row['english'];
        
        if (!needsEndings && !needsPOS && !needsEnglish) {
            return row; // Already complete
        }
        
        const dictEntry = findDictionaryEntry(headword, entries);
        if (dictEntry) {
            matchedCount++;
            if (needsEndings) {
                row['latin_endings'] = extractEndings(headword, dictEntry.dictionaryForm, dictEntry.partOfSpeech);
            }
            if (needsPOS) {
                row['part_of_speech'] = formatPartOfSpeech(dictEntry.partOfSpeech, dictEntry.partOfSpeechDisplay);
            }
            if (needsEnglish) {
                row['english'] = dictEntry.meaning || '';
            }
            console.log(`✓ Enhanced ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return row;
    });
    
    console.log(`Cicero: ${matchedCount}/${totalCount} entries matched`);
    
    const output = rowsToCSV(headers, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/Cicero_Required_fixed.csv', output);
    return { matched: matchedCount, total: totalCount };
}

function processApuleiusCSV(entries) {
    console.log('Processing Apuleius_Required.csv...');
    const content = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/Apuleius_Required.csv', 'utf8');
    const { headers, rows } = parseCSV(content);
    
    let matchedCount = 0;
    let totalCount = 0;
    
    const processedRows = rows.map(row => {
        totalCount++;
        const headword = row['Headword'];
        
        if (!headword || row['Latin_Entry'] || row['Part_of_Speech'] || row['English']) {
            return row; // Skip if already filled or no headword
        }
        
        const dictEntry = findDictionaryEntry(headword, entries);
        if (dictEntry) {
            matchedCount++;
            row['Latin_Entry'] = extractEndings(headword, dictEntry.dictionaryForm, dictEntry.partOfSpeech);
            row['Part_of_Speech'] = formatPartOfSpeech(dictEntry.partOfSpeech, dictEntry.partOfSpeechDisplay);
            row['English'] = dictEntry.meaning || '';
            console.log(`✓ Matched ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return row;
    });
    
    console.log(`Apuleius: ${matchedCount}/${totalCount} entries matched`);
    
    const output = rowsToCSV(headers, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/Apuleius_Required_fixed.csv', output);
    return { matched: matchedCount, total: totalCount };
}

function processOvidCSV(entries) {
    console.log('Processing Ovid_Required.csv...');
    const content = fs.readFileSync('/Users/ottodo/Documents/GitHub/ludus/Ovid_Required.csv', 'utf8');
    const { headers, rows } = parseCSV(content);
    
    let matchedCount = 0;
    let totalCount = 0;
    
    const processedRows = rows.map(row => {
        totalCount++;
        const headword = row['Headword'];
        
        if (!headword || row['Latin_Entry'] || row['Part_of_Speech'] || row['English']) {
            return row; // Skip if already filled or no headword
        }
        
        const dictEntry = findDictionaryEntry(headword, entries);
        if (dictEntry) {
            matchedCount++;
            row['Latin_Entry'] = extractEndings(headword, dictEntry.dictionaryForm, dictEntry.partOfSpeech);
            row['Part_of_Speech'] = formatPartOfSpeech(dictEntry.partOfSpeech, dictEntry.partOfSpeechDisplay);
            row['English'] = dictEntry.meaning || '';
            console.log(`✓ Matched ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return row;
    });
    
    console.log(`Ovid: ${matchedCount}/${totalCount} entries matched`);
    
    const output = rowsToCSV(headers, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/Ovid_Required_fixed.csv', output);
    return { matched: matchedCount, total: totalCount };
}

// Main execution
function main() {
    console.log('Loading Whitaker\'s dictionary data...');
    const entries = loadWhitakersData();
    console.log(`Loaded ${entries.length} dictionary entries`);
    
    const results = [];
    
    try {
        results.push(processCaesarCSV(entries));
        results.push(processCiceroCSV(entries));
        results.push(processApuleiusCSV(entries));
        results.push(processOvidCSV(entries));
        
        console.log('\n=== SUMMARY ===');
        console.log('Fixed CSV files created with "_fixed" suffix');
        results.forEach((result, index) => {
            const files = ['caesar_required.csv', 'Cicero_Required.csv', 'Apuleius_Required.csv', 'Ovid_Required.csv'];
            console.log(`${files[index]}: ${result.matched}/${result.total} entries matched`);
        });
        
    } catch (error) {
        console.error('Error processing files:', error);
    }
}

if (require.main === module) {
    main();
}
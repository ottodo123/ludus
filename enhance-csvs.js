const fs = require('fs');
const path = require('path');

// Load Whitaker's dictionary data
function loadWhitakersData() {
    const whitakersPath = path.join(__dirname, 'ludus-flashcards/src/data/whitakersOptimized.json');
    const data = JSON.parse(fs.readFileSync(whitakersPath, 'utf8'));
    return data.entries;
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
        headers.map(header => row[header] || '').join(',')
    );
    return [headerLine, ...dataLines].join('\n');
}

// Find dictionary entry by headword
function findDictionaryEntry(headword, entries) {
    // Clean the headword for matching
    const cleanHeadword = headword.toLowerCase().trim();
    
    // Try exact match first on dictionaryForm
    let match = entries.find(entry => {
        if (!entry.dictionaryForm) return false;
        const firstForm = entry.dictionaryForm.split(',')[0].trim().toLowerCase();
        return firstForm === cleanHeadword;
    });
    
    if (match) return match;
    
    // Try partial match
    match = entries.find(entry => {
        if (!entry.dictionaryForm) return false;
        return entry.dictionaryForm.toLowerCase().includes(cleanHeadword);
    });
    
    if (match) return match;
    
    // Try matching any part of the dictionary form
    match = entries.find(entry => {
        if (!entry.dictionaryForm) return false;
        const forms = entry.dictionaryForm.split(',').map(f => f.trim().toLowerCase());
        return forms.some(form => form === cleanHeadword);
    });
    
    return match;
}

// Extract endings from dictionary form
function extractEndings(dictionaryForm, partOfSpeech) {
    if (!dictionaryForm) return '';
    
    const forms = dictionaryForm.split(',').map(f => f.trim());
    if (forms.length < 2) return '';
    
    // For nouns, return genitive ending
    if (partOfSpeech === 'N') {
        const genitive = forms[1];
        const nominative = forms[0];
        // Extract the common ending pattern
        if (genitive.includes(nominative.slice(0, -1))) {
            return genitive.replace(nominative.slice(0, -1), '');
        }
        return genitive;
    }
    
    // For verbs, return infinitive
    if (partOfSpeech === 'V') {
        return forms[1] || '';
    }
    
    // For adjectives, return feminine and neuter forms
    if (partOfSpeech === 'ADJ') {
        if (forms.length >= 3) {
            return forms[1] + ', ' + forms[2];
        }
        return forms[1] || '';
    }
    
    return forms[1] || '';
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
            row['latin_endings'] = extractEndings(dictEntry.dictionaryForm, dictEntry.partOfSpeech);
            row['part_of_speech'] = dictEntry.partOfSpeechDisplay || dictEntry.partOfSpeech;
            row['english'] = dictEntry.meaning || '';
            console.log(`✓ Matched ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return row;
    });
    
    console.log(`Caesar: ${matchedCount}/${totalCount} entries matched`);
    
    const output = rowsToCSV(headers, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/caesar_required_enhanced.csv', output);
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
                row['latin_endings'] = extractEndings(dictEntry.dictionaryForm, dictEntry.partOfSpeech);
            }
            if (needsPOS) {
                row['part_of_speech'] = dictEntry.partOfSpeechDisplay || dictEntry.partOfSpeech;
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
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/Cicero_Required_enhanced.csv', output);
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
            row['Latin_Entry'] = dictEntry.dictionaryForm || '';
            row['Part_of_Speech'] = dictEntry.partOfSpeechDisplay || dictEntry.partOfSpeech;
            row['English'] = dictEntry.meaning || '';
            console.log(`✓ Matched ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return row;
    });
    
    console.log(`Apuleius: ${matchedCount}/${totalCount} entries matched`);
    
    const output = rowsToCSV(headers, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/Apuleius_Required_enhanced.csv', output);
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
            row['Latin_Entry'] = dictEntry.dictionaryForm || '';
            row['Part_of_Speech'] = dictEntry.partOfSpeechDisplay || dictEntry.partOfSpeech;
            row['English'] = dictEntry.meaning || '';
            console.log(`✓ Matched ${headword} -> ${dictEntry.dictionaryForm}`);
        } else {
            console.log(`✗ No match found for: ${headword}`);
        }
        
        return row;
    });
    
    console.log(`Ovid: ${matchedCount}/${totalCount} entries matched`);
    
    const output = rowsToCSV(headers, processedRows);
    fs.writeFileSync('/Users/ottodo/Documents/GitHub/ludus/Ovid_Required_enhanced.csv', output);
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
        console.log('Enhanced CSV files created with "_enhanced" suffix');
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
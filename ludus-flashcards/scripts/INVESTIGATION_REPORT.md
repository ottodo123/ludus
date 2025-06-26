# Investigation Report: Missing Forms (mavult, patitur, moritur)

## Summary

I investigated why the 3 specific forms (`mavult`, `patitur`, `moritur`) are missing from our morphological index and identified the exact root causes and required fixes.

## Root Cause Analysis

### 1. DICTLINE.GEN Entries (✅ Present and Correct)

All three verbs have correct entries in DICTLINE.GEN:

```
mal    mal    malu   zzz    V  6 2 X     prefer; incline toward, wish rather;
pati   pat    zzz    pass   V  3 1 DEP   suffer; allow; undergo, endure; permit;
mori   mor    zzz    mortu  V  3 1 DEP   die, expire, pass/die/wither away/out;
```

### 2. generateBasicInflections Function Issues (❌ Multiple Bugs)

The `generateBasicInflections` function in `/scripts/createOptimizedIndex.js` has three critical issues:

#### Issue A: MALO (V 6 2) - Missing Irregular Verb Handling
- **Current behavior**: Lines 914-957 assume all V 6 verbs follow the `eo` pattern
- **Problem**: Generates wrong forms: `eo, is, it, imus, itis, eunt`
- **Should generate**: `malo, mavis, mavult, malumus, mavultis, malunt`
- **Missing**: Special case handling for `malo` irregular verb

#### Issue B: PATIOR (V 3 1 DEP) - No Deponent Verb Support  
- **Current behavior**: Lines 824-863 treat as regular V 3 1, ignore DEP marker
- **Problem**: Generates active forms: `patio, patis, patit` (these don't exist!)
- **Should generate**: Passive forms: `patior, pateris, patitur` (deponent = passive form, active meaning)
- **Missing**: Detection of DEP marker and passive form generation

#### Issue C: MORIOR (V 3 1 DEP) - No Deponent Verb Support
- **Current behavior**: Same as patior - ignores DEP marker
- **Problem**: Generates active forms: `morio, moris, morit` (these don't exist!)
- **Should generate**: Passive forms: `morior, moreris, moritur`
- **Missing**: Same as patior

## Detailed Technical Analysis

### MALO Verb Pattern
```
Dictionary: malo, malle, malui, - (irregular)
Present:    malo, mavis, mavult, malumus, mavultis, malunt
Infinitive: malle (not *malere)
```

### Deponent Verb Pattern (PATIOR/MORIOR)
```
Deponent verbs use PASSIVE endings with ACTIVE meanings:

patior: patior, pateris, patitur, patimur, patimini, patiuntur
morior: morior, moreris, moritur, morimur, morimini, moriuntur

NOT: patio/morio (active forms that don't exist)
```

## Required Fixes

### 1. Add MALO Special Case
```javascript
// In generateBasicInflections, around line 914, add:
if (mainStem === 'mal' && declension.includes('6') && declension.includes('2')) {
  // Special handling for malo (irregular)
  forms.add('malo');      // 1sg: malo (I prefer)
  forms.add('mavis');     // 2sg: mavis (you prefer)  
  forms.add('mavult');    // 3sg: mavult (he/she/it prefers) ⭐ TARGET
  forms.add('malumus');   // 1pl: malumus (we prefer)
  forms.add('mavultis');  // 2pl: mavultis (you all prefer)
  forms.add('malunt');    // 3pl: malunt (they prefer)
  forms.add('malle');     // infinitive: malle (to prefer)
  return Array.from(forms);
}
```

### 2. Add Deponent Verb Detection
```javascript
// At the start of generateBasicInflections function:
const isDeponent = declension.includes('DEP');
```

### 3. Add Deponent Verb Forms for 3rd Conjugation
```javascript
// Replace regular V 3 handling (lines 824-863) with:
if (declension.startsWith('3')) {
  if (isDeponent) {
    // Deponent verbs: passive forms with active meanings
    forms.add(mainStem + 'or');       // 1sg: patior/morior
    forms.add(mainStem.replace(/i$/, '') + 'eris');  // 2sg: pateris/moreris  
    forms.add(mainStem.replace(/i$/, '') + 'itur');  // 3sg: patitur/moritur ⭐ TARGET
    forms.add(mainStem.replace(/i$/, '') + 'imur');  // 1pl: patimur/morimur
    forms.add(mainStem.replace(/i$/, '') + 'imini'); // 2pl: patimini/morimini
    forms.add(mainStem.replace(/i$/, '') + 'iuntur');// 3pl: patiuntur/moriuntur
    // ... additional deponent forms
  } else {
    // Regular 3rd conjugation (existing code)
  }
}
```

## Verification Test Cases

After implementing fixes, verify these specific forms are generated:

1. **mavult** - from malo entry (V 6 2)
2. **patitur** - from pati entry (V 3 1 DEP) 
3. **moritur** - from mori entry (V 3 1 DEP)

## Files to Modify

- `/scripts/createOptimizedIndex.js` - Update `generateBasicInflections` function
- Test by running the script and checking the generated index contains target forms

## Impact

This fix will:
- ✅ Add `mavult` (3rd person singular of malo)
- ✅ Add `patitur` (3rd person singular of patior) 
- ✅ Add `moritur` (3rd person singular of morior)
- ✅ Improve overall deponent verb coverage
- ✅ Fix incorrect irregular verb handling

The morphological index will become significantly more accurate for Latin verb inflections.
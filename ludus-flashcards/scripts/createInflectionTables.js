#!/usr/bin/env node

/**
 * Creates comprehensive inflection tables for Latin words
 * This generates all grammatical forms (cases, tenses, etc.) for each dictionary entry
 */

const fs = require('fs');
const path = require('path');

// Comprehensive inflection generators
const generateNounInflections = (entry) => {
  const { stems, declension, gender } = entry;
  const mainStem = stems[0];
  const genitiveStem = stems.length > 1 ? stems[1] : mainStem;
  
  const forms = {};
  
  if (declension.startsWith('1')) {
    // First declension: aqua, aquae
    forms.singular = {
      nominative: mainStem + 'a',
      genitive: mainStem + 'ae', 
      dative: mainStem + 'ae',
      accusative: mainStem + 'am',
      ablative: mainStem + 'a',
      vocative: mainStem + 'a'
    };
    forms.plural = {
      nominative: mainStem + 'ae',
      genitive: mainStem + 'arum',
      dative: mainStem + 'is',
      accusative: mainStem + 'as',
      ablative: mainStem + 'is',
      vocative: mainStem + 'ae'
    };
  } else if (declension.startsWith('2')) {
    // Second declension
    if (gender === 'N') {
      // Neuter: bellum, belli
      forms.singular = {
        nominative: mainStem + 'um',
        genitive: mainStem + 'i',
        dative: mainStem + 'o',
        accusative: mainStem + 'um',
        ablative: mainStem + 'o',
        vocative: mainStem + 'um'
      };
      forms.plural = {
        nominative: mainStem + 'a',
        genitive: mainStem + 'orum',
        dative: mainStem + 'is',
        accusative: mainStem + 'a',
        ablative: mainStem + 'is',
        vocative: mainStem + 'a'
      };
    } else {
      // Masculine: servus, servi
      forms.singular = {
        nominative: mainStem + 'us',
        genitive: mainStem + 'i',
        dative: mainStem + 'o',
        accusative: mainStem + 'um',
        ablative: mainStem + 'o',
        vocative: mainStem + 'e'
      };
      forms.plural = {
        nominative: mainStem + 'i',
        genitive: mainStem + 'orum',
        dative: mainStem + 'is',
        accusative: mainStem + 'os',
        ablative: mainStem + 'is',
        vocative: mainStem + 'i'
      };
    }
  } else if (declension.startsWith('3')) {
    // Third declension: rex, regis
    forms.singular = {
      nominative: mainStem,
      genitive: genitiveStem + 'is',
      dative: genitiveStem + 'i',
      accusative: genitiveStem + 'em',
      ablative: genitiveStem + 'e',
      vocative: mainStem
    };
    
    if (gender === 'N') {
      forms.plural = {
        nominative: genitiveStem + 'a',
        genitive: genitiveStem + 'um',
        dative: genitiveStem + 'ibus',
        accusative: genitiveStem + 'a',
        ablative: genitiveStem + 'ibus',
        vocative: genitiveStem + 'a'
      };
    } else {
      forms.plural = {
        nominative: genitiveStem + 'es',
        genitive: genitiveStem + 'um',
        dative: genitiveStem + 'ibus',
        accusative: genitiveStem + 'es',
        ablative: genitiveStem + 'ibus',
        vocative: genitiveStem + 'es'
      };
    }
  } else if (declension.startsWith('4')) {
    // Fourth declension
    if (gender === 'N') {
      // Neuter: cornu, cornus
      forms.singular = {
        nominative: mainStem + 'u',
        genitive: mainStem + 'us',
        dative: mainStem + 'u',
        accusative: mainStem + 'u',
        ablative: mainStem + 'u',
        vocative: mainStem + 'u'
      };
      forms.plural = {
        nominative: mainStem + 'ua',
        genitive: mainStem + 'uum',
        dative: mainStem + 'ibus',
        accusative: mainStem + 'ua',
        ablative: mainStem + 'ibus',
        vocative: mainStem + 'ua'
      };
    } else {
      // Masculine: manus, manus
      forms.singular = {
        nominative: mainStem + 'us',
        genitive: mainStem + 'us',
        dative: mainStem + 'ui',
        accusative: mainStem + 'um',
        ablative: mainStem + 'u',
        vocative: mainStem + 'us'
      };
      forms.plural = {
        nominative: mainStem + 'us',
        genitive: mainStem + 'uum',
        dative: mainStem + 'ibus',
        accusative: mainStem + 'us',
        ablative: mainStem + 'ibus',
        vocative: mainStem + 'us'
      };
    }
  } else if (declension.startsWith('5')) {
    // Fifth declension: res, rei
    forms.singular = {
      nominative: mainStem + 'es',
      genitive: mainStem + 'ei',
      dative: mainStem + 'ei',
      accusative: mainStem + 'em',
      ablative: mainStem + 'e',
      vocative: mainStem + 'es'
    };
    forms.plural = {
      nominative: mainStem + 'es',
      genitive: mainStem + 'erum',
      dative: mainStem + 'ebus',
      accusative: mainStem + 'es',
      ablative: mainStem + 'ebus',
      vocative: mainStem + 'es'
    };
  }
  
  return forms;
};

const generateVerbInflections = (entry) => {
  const { stems, declension } = entry;
  const presentStem = stems[0];
  const perfectStem = stems[2] && stems[2] !== 'zzz' ? stems[2] : null;
  const participleBaseStem = stems[3] && stems[3] !== 'zzz' ? stems[3] : null;
  
  const forms = {
    indicative: {
      present: {},
      imperfect: {},
      future: {},
      perfect: {},
      pluperfect: {},
      futurePerfect: {}
    },
    subjunctive: {
      present: {},
      imperfect: {},
      perfect: {},
      pluperfect: {}
    },
    imperative: {
      present: {},
      future: {}
    },
    infinitives: {},
    participles: {}
  };
  
  // Present indicative active
  if (declension.startsWith('1')) {
    // First conjugation: amo, amare
    forms.indicative.present.active = {
      '1sg': presentStem + 'o',
      '2sg': presentStem + 'as',
      '3sg': presentStem + 'at',
      '1pl': presentStem + 'amus',
      '2pl': presentStem + 'atis',
      '3pl': presentStem + 'ant'
    };
    
    forms.indicative.imperfect.active = {
      '1sg': presentStem + 'bam',
      '2sg': presentStem + 'bas',
      '3sg': presentStem + 'bat',
      '1pl': presentStem + 'bamus',
      '2pl': presentStem + 'batis',
      '3pl': presentStem + 'bant'
    };
    
    forms.indicative.future.active = {
      '1sg': presentStem + 'bo',
      '2sg': presentStem + 'bis',
      '3sg': presentStem + 'bit',
      '1pl': presentStem + 'bimus',
      '2pl': presentStem + 'bitis',
      '3pl': presentStem + 'bunt'
    };
    
    forms.infinitives.present = presentStem + 'are';
    
  } else if (declension.startsWith('2')) {
    // Second conjugation: habeo, habere
    forms.indicative.present.active = {
      '1sg': presentStem + 'eo',
      '2sg': presentStem + 'es',
      '3sg': presentStem + 'et',
      '1pl': presentStem + 'emus',
      '2pl': presentStem + 'etis',
      '3pl': presentStem + 'ent'
    };
    
    forms.indicative.imperfect.active = {
      '1sg': presentStem + 'ebam',
      '2sg': presentStem + 'ebas',
      '3sg': presentStem + 'ebat',
      '1pl': presentStem + 'ebamus',
      '2pl': presentStem + 'ebatis',
      '3pl': presentStem + 'ebant'
    };
    
    forms.indicative.future.active = {
      '1sg': presentStem + 'ebo',
      '2sg': presentStem + 'ebis',
      '3sg': presentStem + 'ebit',
      '1pl': presentStem + 'ebimus',
      '2pl': presentStem + 'ebitis',
      '3pl': presentStem + 'ebunt'
    };
    
    forms.infinitives.present = presentStem + 'ere';
    
  } else if (declension.startsWith('3')) {
    // Third conjugation: duco, ducere
    forms.indicative.present.active = {
      '1sg': presentStem + 'o',
      '2sg': presentStem + 'is',
      '3sg': presentStem + 'it',
      '1pl': presentStem + 'imus',
      '2pl': presentStem + 'itis',
      '3pl': presentStem + 'unt'
    };
    
    forms.indicative.imperfect.active = {
      '1sg': presentStem + 'ebam',
      '2sg': presentStem + 'ebas',
      '3sg': presentStem + 'ebat',
      '1pl': presentStem + 'ebamus',
      '2pl': presentStem + 'ebatis',
      '3pl': presentStem + 'ebant'
    };
    
    forms.indicative.future.active = {
      '1sg': presentStem + 'am',
      '2sg': presentStem + 'es',
      '3sg': presentStem + 'et',
      '1pl': presentStem + 'emus',
      '2pl': presentStem + 'etis',
      '3pl': presentStem + 'ent'
    };
    
    forms.infinitives.present = presentStem + 'ere';
    
  } else if (declension.startsWith('4')) {
    // Fourth conjugation: audio, audire
    forms.indicative.present.active = {
      '1sg': presentStem + 'io',
      '2sg': presentStem + 'is',
      '3sg': presentStem + 'it',
      '1pl': presentStem + 'imus',
      '2pl': presentStem + 'itis',
      '3pl': presentStem + 'iunt'
    };
    
    forms.indicative.imperfect.active = {
      '1sg': presentStem + 'iebam',
      '2sg': presentStem + 'iebas',
      '3sg': presentStem + 'iebat',
      '1pl': presentStem + 'iebamus',
      '2pl': presentStem + 'iebatis',
      '3pl': presentStem + 'iebant'
    };
    
    forms.indicative.future.active = {
      '1sg': presentStem + 'iam',
      '2sg': presentStem + 'ies',
      '3sg': presentStem + 'iet',
      '1pl': presentStem + 'iemus',
      '2pl': presentStem + 'ietis',
      '3pl': presentStem + 'ient'
    };
    
    forms.infinitives.present = presentStem + 'ire';
  }
  
  // Perfect tenses (if perfect stem is available)
  if (perfectStem) {
    forms.indicative.perfect.active = {
      '1sg': perfectStem + 'i',
      '2sg': perfectStem + 'isti',
      '3sg': perfectStem + 'it',
      '1pl': perfectStem + 'imus',
      '2pl': perfectStem + 'istis',
      '3pl': perfectStem + 'erunt'
    };
    
    forms.indicative.pluperfect.active = {
      '1sg': perfectStem + 'eram',
      '2sg': perfectStem + 'eras',
      '3sg': perfectStem + 'erat',
      '1pl': perfectStem + 'eramus',
      '2pl': perfectStem + 'eratis',
      '3pl': perfectStem + 'erant'
    };
    
    forms.indicative.futurePerfect.active = {
      '1sg': perfectStem + 'ero',
      '2sg': perfectStem + 'eris',
      '3sg': perfectStem + 'erit',
      '1pl': perfectStem + 'erimus',
      '2pl': perfectStem + 'eritis',
      '3pl': perfectStem + 'erint'
    };
    
    forms.infinitives.perfect = perfectStem + 'isse';
  }
  
  // Imperative
  if (declension.startsWith('1')) {
    forms.imperative.present = {
      '2sg': presentStem + 'a',
      '2pl': presentStem + 'ate'
    };
  } else if (declension.startsWith('2')) {
    forms.imperative.present = {
      '2sg': presentStem + 'e',
      '2pl': presentStem + 'ete'
    };
  } else if (declension.startsWith('3')) {
    forms.imperative.present = {
      '2sg': presentStem + 'e',
      '2pl': presentStem + 'ite'
    };
  } else if (declension.startsWith('4')) {
    forms.imperative.present = {
      '2sg': presentStem + 'i',
      '2pl': presentStem + 'ite'
    };
  }
  
  // Participles
  if (participleBaseStem) {
    forms.participles.perfectPassive = {
      'masc_nom_sg': participleBaseStem + 'us',
      'fem_nom_sg': participleBaseStem + 'a', 
      'neut_nom_sg': participleBaseStem + 'um'
    };
  }
  
  return forms;
};

const generateAdjectiveInflections = (entry) => {
  const { stems, declension } = entry;
  const mainStem = stems[0];
  
  const forms = {};
  
  if (declension.includes('1') && declension.includes('2')) {
    // First/second declension: bonus, -a, -um
    forms.masculine = {
      singular: {
        nominative: mainStem + 'us',
        genitive: mainStem + 'i',
        dative: mainStem + 'o',
        accusative: mainStem + 'um',
        ablative: mainStem + 'o',
        vocative: mainStem + 'e'
      },
      plural: {
        nominative: mainStem + 'i',
        genitive: mainStem + 'orum',
        dative: mainStem + 'is',
        accusative: mainStem + 'os',
        ablative: mainStem + 'is',
        vocative: mainStem + 'i'
      }
    };
    
    forms.feminine = {
      singular: {
        nominative: mainStem + 'a',
        genitive: mainStem + 'ae',
        dative: mainStem + 'ae',
        accusative: mainStem + 'am',
        ablative: mainStem + 'a',
        vocative: mainStem + 'a'
      },
      plural: {
        nominative: mainStem + 'ae',
        genitive: mainStem + 'arum',
        dative: mainStem + 'is',
        accusative: mainStem + 'as',
        ablative: mainStem + 'is',
        vocative: mainStem + 'ae'
      }
    };
    
    forms.neuter = {
      singular: {
        nominative: mainStem + 'um',
        genitive: mainStem + 'i',
        dative: mainStem + 'o',
        accusative: mainStem + 'um',
        ablative: mainStem + 'o',
        vocative: mainStem + 'um'
      },
      plural: {
        nominative: mainStem + 'a',
        genitive: mainStem + 'orum',
        dative: mainStem + 'is',
        accusative: mainStem + 'a',
        ablative: mainStem + 'is',
        vocative: mainStem + 'a'
      }
    };
  } else if (declension === '9 9') {
    // Indeclinable adjectives
    forms.indeclinable = {
      form: mainStem
    };
  }
  
  return forms;
};

// Test the inflection generation functions
function testInflectionGeneration() {
  console.log('🧪 Testing inflection table generation...\n');
  
  const testEntries = [
    {
      dictionaryForm: 'aqua, aquae',
      stems: ['aqu', 'aqu'],
      partOfSpeech: 'N',
      declension: '1 1',
      gender: 'F'
    },
    {
      dictionaryForm: 'amo, amare, amavi, amatum',
      stems: ['am', 'am', 'amav', 'amat'],
      partOfSpeech: 'V',
      declension: '1 1'
    },
    {
      dictionaryForm: 'bonus, bona, bonum',
      stems: ['bon', 'bon', 'bon', 'bon'],
      partOfSpeech: 'ADJ',
      declension: '1 2'
    }
  ];
  
  for (const entry of testEntries) {
    console.log(`=== ${entry.dictionaryForm} ===`);
    
    if (entry.partOfSpeech === 'N') {
      const inflections = generateNounInflections(entry);
      console.log('Noun inflections:');
      console.log('Singular:', inflections.singular);
      console.log('Plural:', inflections.plural);
    } else if (entry.partOfSpeech === 'V') {
      const inflections = generateVerbInflections(entry);
      console.log('Verb inflections (present indicative active):');
      console.log(inflections.indicative.present.active);
      console.log('Infinitive:', inflections.infinitives.present);
    } else if (entry.partOfSpeech === 'ADJ') {
      const inflections = generateAdjectiveInflections(entry);
      console.log('Adjective inflections (masculine singular):');
      console.log(inflections.masculine?.singular);
    }
    console.log();
  }
}

if (require.main === module) {
  testInflectionGeneration();
}

module.exports = {
  generateNounInflections,
  generateVerbInflections,
  generateAdjectiveInflections
};
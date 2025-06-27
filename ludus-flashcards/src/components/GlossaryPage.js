import React, { useState, useEffect } from 'react';
import '../styles/GlossaryPage.css';
import { useAuth } from '../contexts/AuthContext';
import SavedWordsPage from './SavedWordsPage';
import { 
  saveSavedWordSessions, 
  getSavedWordSessions, 
  deleteSavedWordSessions,
  debouncedSaveSessions,
  triggerIndexCreation,
  logFirebaseIndexInstructions 
} from '../services/userDataService';
import { debugSavedWordsSystem } from '../utils/debugSavedWords';

// Morphological analysis helper functions
const decodeDeclension = (declension, partOfSpeech, gender) => {
  if (!declension) return null;
  
  const analysis = {
    type: '',
    details: []
  };
  
  if (partOfSpeech === 'N') {
    // Noun declensions
    if (declension.startsWith('1')) {
      analysis.type = '1st declension';
      analysis.details.push('typically feminine');
      analysis.details.push('ends in -a');
    } else if (declension.startsWith('2')) {
      analysis.type = '2nd declension';
      if (gender === 'M' || gender === 'C') {
        analysis.details.push('masculine');
        analysis.details.push('ends in -us');
      } else if (gender === 'N') {
        analysis.details.push('neuter');
        analysis.details.push('ends in -um');
      }
    } else if (declension.startsWith('3')) {
      analysis.type = '3rd declension';
      analysis.details.push('consonant stem');
      if (gender === 'M') analysis.details.push('masculine');
      else if (gender === 'F') analysis.details.push('feminine');
      else if (gender === 'N') analysis.details.push('neuter');
    } else if (declension.startsWith('4')) {
      analysis.type = '4th declension';
      if (gender === 'M') {
        analysis.details.push('masculine');
        analysis.details.push('ends in -us');
      } else {
        analysis.details.push('neuter');
        analysis.details.push('ends in -u');
      }
    } else if (declension.startsWith('5')) {
      analysis.type = '5th declension';
      analysis.details.push('typically feminine');
      analysis.details.push('ends in -es');
    }
  } else if (partOfSpeech === 'V') {
    // Verb conjugations
    if (declension.startsWith('1')) {
      analysis.type = '1st conjugation';
      analysis.details.push('infinitive: -āre');
      if (declension.includes('DEP')) {
        analysis.details.push('deponent');
      }
    } else if (declension.startsWith('2')) {
      analysis.type = '2nd conjugation';
      analysis.details.push('infinitive: -ēre');
      if (declension.includes('DEP')) {
        analysis.details.push('deponent');
      }
    } else if (declension.startsWith('3')) {
      analysis.type = '3rd conjugation';
      analysis.details.push('infinitive: -ere');
      if (declension.includes('DEP')) {
        analysis.details.push('deponent');
      }
      if (declension.includes('SEMIDEP')) {
        analysis.details.push('semi-deponent');
      }
    } else if (declension.startsWith('4')) {
      analysis.type = '4th conjugation';
      analysis.details.push('infinitive: -īre');
      if (declension.includes('DEP')) {
        analysis.details.push('deponent');
      }
    } else if (declension.startsWith('5')) {
      analysis.type = 'irregular';
      if (declension.includes('TO_BEING')) {
        analysis.details.push('sum, esse type');
      }
    } else if (declension.startsWith('6')) {
      analysis.type = 'irregular';
      analysis.details.push('6th conjugation type');
    } else if (declension.startsWith('7')) {
      analysis.type = 'defective';
      analysis.details.push('limited forms');
    }
    
    // Additional verb characteristics
    if (declension.includes('TRANS')) {
      analysis.details.push('transitive');
    }
    if (declension.includes('INTRANS')) {
      analysis.details.push('intransitive');
    }
    if (declension.includes('IMPERS')) {
      analysis.details.push('impersonal');
    }
    if (declension.includes('PERFDEF')) {
      analysis.details.push('perfect definite');
    }
  } else if (partOfSpeech === 'ADJ') {
    // Adjective declensions
    if (declension.includes('1') && declension.includes('2')) {
      analysis.type = '1st/2nd declension';
      analysis.details.push('bonus, -a, -um type');
    } else if (declension.startsWith('3')) {
      analysis.type = '3rd declension';
      analysis.details.push('consonant stem');
    } else if (declension === '9 9') {
      analysis.type = 'indeclinable';
      analysis.details.push('unchanging form');
    }
  }
  
  return analysis;
};

const getGrammaticalInfo = (entry) => {
  const info = [];
  
  // Part of speech
  info.push({
    label: 'Part of Speech',
    value: entry.partOfSpeechDisplay
  });
  
  // Morphological analysis
  const morphAnalysis = decodeDeclension(entry.declension, entry.partOfSpeech, entry.gender);
  if (morphAnalysis) {
    info.push({
      label: morphAnalysis.type.includes('declension') ? 'Declension' : 
             morphAnalysis.type.includes('conjugation') ? 'Conjugation' : 'Type',
      value: morphAnalysis.type
    });
    
    if (morphAnalysis.details.length > 0) {
      info.push({
        label: 'Features',
        value: morphAnalysis.details.join(', ')
      });
    }
  }
  
  // Gender (for nouns and adjectives)
  if (entry.gender && (entry.partOfSpeech === 'N' || entry.partOfSpeech === 'ADJ')) {
    const genderMap = {
      'M': 'masculine',
      'F': 'feminine', 
      'N': 'neuter',
      'C': 'common (m/f)'
    };
    if (genderMap[entry.gender]) {
      info.push({
        label: 'Gender',
        value: genderMap[entry.gender]
      });
    }
  }
  
  return info;
};

// Inflection table generation functions
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
  }
  
  return forms;
};

const generateVerbInflections = (entry) => {
  const { stems, declension } = entry;
  const presentStem = stems[0];
  const perfectStem = stems[2] && stems[2] !== 'zzz' ? stems[2] : null;
  
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
      present: {}
    },
    infinitives: {},
    participles: {}
  };
  
  if (declension.startsWith('1')) {
    // First conjugation: amo, amare
    
    // INDICATIVE ACTIVE
    forms.indicative.present.active = {
      '1sg': presentStem + 'o',
      '2sg': presentStem + 'as',
      '3sg': presentStem + 'at',
      '1pl': presentStem + 'amus',
      '2pl': presentStem + 'atis',
      '3pl': presentStem + 'ant'
    };
    
    forms.indicative.imperfect.active = {
      '1sg': presentStem + 'abam',
      '2sg': presentStem + 'abas',
      '3sg': presentStem + 'abat',
      '1pl': presentStem + 'abamus',
      '2pl': presentStem + 'abatis',
      '3pl': presentStem + 'abant'
    };
    
    forms.indicative.future.active = {
      '1sg': presentStem + 'abo',
      '2sg': presentStem + 'abis',
      '3sg': presentStem + 'abit',
      '1pl': presentStem + 'abimus',
      '2pl': presentStem + 'abitis',
      '3pl': presentStem + 'abunt'
    };
    
    // INDICATIVE PASSIVE
    forms.indicative.present.passive = {
      '1sg': presentStem + 'or',
      '2sg': presentStem + 'aris',
      '3sg': presentStem + 'atur',
      '1pl': presentStem + 'amur',
      '2pl': presentStem + 'amini',
      '3pl': presentStem + 'antur'
    };
    
    forms.indicative.imperfect.passive = {
      '1sg': presentStem + 'abar',
      '2sg': presentStem + 'abaris',
      '3sg': presentStem + 'abatur',
      '1pl': presentStem + 'abamur',
      '2pl': presentStem + 'abamini',
      '3pl': presentStem + 'abantur'
    };
    
    forms.indicative.future.passive = {
      '1sg': presentStem + 'abor',
      '2sg': presentStem + 'aberis',
      '3sg': presentStem + 'abitur',
      '1pl': presentStem + 'abimur',
      '2pl': presentStem + 'abimini',
      '3pl': presentStem + 'abuntur'
    };
    
    // SUBJUNCTIVE ACTIVE
    forms.subjunctive.present.active = {
      '1sg': presentStem + 'em',
      '2sg': presentStem + 'es',
      '3sg': presentStem + 'et',
      '1pl': presentStem + 'emus',
      '2pl': presentStem + 'etis',
      '3pl': presentStem + 'ent'
    };
    
    forms.subjunctive.imperfect.active = {
      '1sg': presentStem + 'arem',
      '2sg': presentStem + 'ares',
      '3sg': presentStem + 'aret',
      '1pl': presentStem + 'aremus',
      '2pl': presentStem + 'aretis',
      '3pl': presentStem + 'arent'
    };
    
    // SUBJUNCTIVE PASSIVE
    forms.subjunctive.present.passive = {
      '1sg': presentStem + 'er',
      '2sg': presentStem + 'eris',
      '3sg': presentStem + 'etur',
      '1pl': presentStem + 'emur',
      '2pl': presentStem + 'emini',
      '3pl': presentStem + 'entur'
    };
    
    forms.subjunctive.imperfect.passive = {
      '1sg': presentStem + 'arer',
      '2sg': presentStem + 'areris',
      '3sg': presentStem + 'aretur',
      '1pl': presentStem + 'aremur',
      '2pl': presentStem + 'aremini',
      '3pl': presentStem + 'arentur'
    };
    
    // IMPERATIVE
    forms.imperative.present = {
      '2sg': presentStem + 'a',
      '2pl': presentStem + 'ate'
    };
    
    // INFINITIVES
    forms.infinitives.present = presentStem + 'are';
    forms.infinitives.presentPassive = presentStem + 'ari';
    
    // PARTICIPLES
    forms.participles.present = presentStem + 'ans';
    if (stems[3] && stems[3] !== 'zzz') {
      forms.participles.perfect = stems[3] + 'us';
      forms.participles.future = stems[3] + 'urus';
    }
    
  } else if (declension.startsWith('2')) {
    // Second conjugation: habeo, habere
    
    // INDICATIVE ACTIVE
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
    
    // INDICATIVE PASSIVE
    forms.indicative.present.passive = {
      '1sg': presentStem + 'eor',
      '2sg': presentStem + 'eris',
      '3sg': presentStem + 'etur',
      '1pl': presentStem + 'emur',
      '2pl': presentStem + 'emini',
      '3pl': presentStem + 'entur'
    };
    
    forms.indicative.imperfect.passive = {
      '1sg': presentStem + 'ebar',
      '2sg': presentStem + 'ebaris',
      '3sg': presentStem + 'ebatur',
      '1pl': presentStem + 'ebamur',
      '2pl': presentStem + 'ebamini',
      '3pl': presentStem + 'ebantur'
    };
    
    forms.indicative.future.passive = {
      '1sg': presentStem + 'ebor',
      '2sg': presentStem + 'eberis',
      '3sg': presentStem + 'ebitur',
      '1pl': presentStem + 'ebimur',
      '2pl': presentStem + 'ebimini',
      '3pl': presentStem + 'ebuntur'
    };
    
    // SUBJUNCTIVE ACTIVE
    forms.subjunctive.present.active = {
      '1sg': presentStem + 'eam',
      '2sg': presentStem + 'eas',
      '3sg': presentStem + 'eat',
      '1pl': presentStem + 'eamus',
      '2pl': presentStem + 'eatis',
      '3pl': presentStem + 'eant'
    };
    
    forms.subjunctive.imperfect.active = {
      '1sg': presentStem + 'erem',
      '2sg': presentStem + 'eres',
      '3sg': presentStem + 'eret',
      '1pl': presentStem + 'eremus',
      '2pl': presentStem + 'eretis',
      '3pl': presentStem + 'erent'
    };
    
    // SUBJUNCTIVE PASSIVE
    forms.subjunctive.present.passive = {
      '1sg': presentStem + 'ear',
      '2sg': presentStem + 'earis',
      '3sg': presentStem + 'eatur',
      '1pl': presentStem + 'eamur',
      '2pl': presentStem + 'eamini',
      '3pl': presentStem + 'eantur'
    };
    
    forms.subjunctive.imperfect.passive = {
      '1sg': presentStem + 'erer',
      '2sg': presentStem + 'ereris',
      '3sg': presentStem + 'eretur',
      '1pl': presentStem + 'eremur',
      '2pl': presentStem + 'eremini',
      '3pl': presentStem + 'erentur'
    };
    
    // IMPERATIVE
    forms.imperative.present = {
      '2sg': presentStem + 'e',
      '2pl': presentStem + 'ete'
    };
    
    // INFINITIVES
    forms.infinitives.present = presentStem + 'ere';
    forms.infinitives.presentPassive = presentStem + 'eri';
    
    // PARTICIPLES
    forms.participles.present = presentStem + 'ens';
    if (stems[3] && stems[3] !== 'zzz') {
      forms.participles.perfect = stems[3] + 'us';
      forms.participles.future = stems[3] + 'urus';
    }
    
  } else if (declension.startsWith('3')) {
    // Third conjugation: duco, ducere
    if (presentStem === 'quaes') {
      // quaeso, quaesere (I beg, ask) - irregular/defective 3rd conjugation
      forms.indicative.present.active = {
        '1sg': 'quaeso',
        '2sg': 'quaesis',
        '3sg': 'quaesit',
        '1pl': 'quaesimus',
        '2pl': 'quaesitis',
        '3pl': 'quaesunt'
      };
      
      forms.indicative.imperfect.active = {
        '1sg': 'quaesebam',
        '2sg': 'quaesebas',
        '3sg': 'quaesebat',
        '1pl': 'quaesebamus',
        '2pl': 'quaesebatis',
        '3pl': 'quaesebant'
      };
      
      forms.indicative.future.active = {
        '1sg': 'quaesam',
        '2sg': 'quaeses',
        '3sg': 'quaeset',
        '1pl': 'quaesemus',
        '2pl': 'quaesetis',
        '3pl': 'quaesent'
      };
      
      forms.subjunctive.present.active = {
        '1sg': 'quaesam',
        '2sg': 'quaesas',
        '3sg': 'quaesat',
        '1pl': 'quaesamus',
        '2pl': 'quaesatis',
        '3pl': 'quaesant'
      };
      
      forms.subjunctive.imperfect.active = {
        '1sg': 'quaeserem',
        '2sg': 'quaeseres',
        '3sg': 'quaeseret',
        '1pl': 'quaeseremus',
        '2pl': 'quaeseretis',
        '3pl': 'quaeserent'
      };
      
      forms.imperative.present = {
        '2sg': 'quaese',
        '2pl': 'quaesite'
      };
      
      forms.infinitives.present = 'quaesere';
      
      forms.explanation = {
        note: 'Quaeso is primarily used in present tense forms, often as an interjection meaning "please"'
      };
    } else {
      // Regular 3rd conjugation
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
      
      forms.infinitives.present = presentStem + 'ere';
    }
    
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
    
    forms.infinitives.present = presentStem + 'ire';
  }
  
  // Perfect tenses (if perfect stem is available)
  if (perfectStem) {
    // PERFECT INDICATIVE ACTIVE
    forms.indicative.perfect.active = {
      '1sg': perfectStem + 'i',
      '2sg': perfectStem + 'isti',
      '3sg': perfectStem + 'it',
      '1pl': perfectStem + 'imus',
      '2pl': perfectStem + 'istis',
      '3pl': perfectStem + 'erunt'
    };
    
    // PLUPERFECT INDICATIVE ACTIVE  
    forms.indicative.pluperfect.active = {
      '1sg': perfectStem + 'eram',
      '2sg': perfectStem + 'eras',
      '3sg': perfectStem + 'erat',
      '1pl': perfectStem + 'eramus',
      '2pl': perfectStem + 'eratis',
      '3pl': perfectStem + 'erant'
    };
    
    // FUTURE PERFECT INDICATIVE ACTIVE
    forms.indicative.futurePerfect.active = {
      '1sg': perfectStem + 'ero',
      '2sg': perfectStem + 'eris',
      '3sg': perfectStem + 'erit',
      '1pl': perfectStem + 'erimus',
      '2pl': perfectStem + 'eritis',
      '3pl': perfectStem + 'erint'
    };
    
    // PERFECT SUBJUNCTIVE ACTIVE
    forms.subjunctive.perfect.active = {
      '1sg': perfectStem + 'erim',
      '2sg': perfectStem + 'eris',
      '3sg': perfectStem + 'erit',
      '1pl': perfectStem + 'erimus',
      '2pl': perfectStem + 'eritis',
      '3pl': perfectStem + 'erint'
    };
    
    // PLUPERFECT SUBJUNCTIVE ACTIVE
    forms.subjunctive.pluperfect.active = {
      '1sg': perfectStem + 'issem',
      '2sg': perfectStem + 'isses',
      '3sg': perfectStem + 'isset',
      '1pl': perfectStem + 'issemus',
      '2pl': perfectStem + 'issetis',
      '3pl': perfectStem + 'issent'
    };
    
    forms.infinitives.perfect = perfectStem + 'isse';
  }
  
  // Perfect passive tenses (if perfect participle stem is available)
  const participleStem = stems[3] && stems[3] !== 'zzz' ? stems[3] : null;
  if (participleStem) {
    // PERFECT INDICATIVE PASSIVE (amatus sum, etc.)
    forms.indicative.perfect.passive = {
      '1sg': participleStem + 'us sum',
      '2sg': participleStem + 'us es', 
      '3sg': participleStem + 'us est',
      '1pl': participleStem + 'i sumus',
      '2pl': participleStem + 'i estis',
      '3pl': participleStem + 'i sunt'
    };
    
    // PLUPERFECT INDICATIVE PASSIVE (amatus eram, etc.)
    forms.indicative.pluperfect.passive = {
      '1sg': participleStem + 'us eram',
      '2sg': participleStem + 'us eras',
      '3sg': participleStem + 'us erat', 
      '1pl': participleStem + 'i eramus',
      '2pl': participleStem + 'i eratis',
      '3pl': participleStem + 'i erant'
    };
    
    // FUTURE PERFECT INDICATIVE PASSIVE (amatus ero, etc.)
    forms.indicative.futurePerfect.passive = {
      '1sg': participleStem + 'us ero',
      '2sg': participleStem + 'us eris',
      '3sg': participleStem + 'us erit',
      '1pl': participleStem + 'i erimus', 
      '2pl': participleStem + 'i eritis',
      '3pl': participleStem + 'i erunt'
    };
    
    // PERFECT SUBJUNCTIVE PASSIVE (amatus sim, etc.)
    forms.subjunctive.perfect.passive = {
      '1sg': participleStem + 'us sim',
      '2sg': participleStem + 'us sis',
      '3sg': participleStem + 'us sit',
      '1pl': participleStem + 'i simus',
      '2pl': participleStem + 'i sitis', 
      '3pl': participleStem + 'i sint'
    };
    
    // PLUPERFECT SUBJUNCTIVE PASSIVE (amatus essem, etc.)
    forms.subjunctive.pluperfect.passive = {
      '1sg': participleStem + 'us essem',
      '2sg': participleStem + 'us esses',
      '3sg': participleStem + 'us esset',
      '1pl': participleStem + 'i essemus',
      '2pl': participleStem + 'i essetis',
      '3pl': participleStem + 'i essent'
    };
    
    // PERFECT INFINITIVE PASSIVE
    forms.infinitives.perfectPassive = participleStem + 'us esse';
  }
  
  // IRREGULAR VERB SUPPORT
  if (declension.startsWith('5')) {
    // Fifth conjugation: irregular verbs like sum, possum
    if (declension.includes('TO_BEING')) {
      if (presentStem === 'su') {
        // sum, esse, fui, futurus (to be)
        forms.indicative.present.active = {
          '1sg': 'sum',
          '2sg': 'es', 
          '3sg': 'est',
          '1pl': 'sumus',
          '2pl': 'estis',
          '3pl': 'sunt'
        };
        
        forms.indicative.imperfect.active = {
          '1sg': 'eram',
          '2sg': 'eras',
          '3sg': 'erat', 
          '1pl': 'eramus',
          '2pl': 'eratis',
          '3pl': 'erant'
        };
        
        forms.indicative.future.active = {
          '1sg': 'ero',
          '2sg': 'eris',
          '3sg': 'erit',
          '1pl': 'erimus', 
          '2pl': 'eritis',
          '3pl': 'erunt'
        };
        
        forms.subjunctive.present.active = {
          '1sg': 'sim',
          '2sg': 'sis',
          '3sg': 'sit',
          '1pl': 'simus',
          '2pl': 'sitis',
          '3pl': 'sint'
        };
        
        forms.subjunctive.imperfect.active = {
          '1sg': 'essem',
          '2sg': 'esses', 
          '3sg': 'esset',
          '1pl': 'essemus',
          '2pl': 'essetis',
          '3pl': 'essent'
        };
        
        forms.imperative.present = {
          '2sg': 'es',
          '2pl': 'este'
        };
        
        forms.infinitives.present = 'esse';
        forms.infinitives.future = 'fore';
        
        forms.participles.future = 'futurus';
        
        // No passive forms for sum
        forms.explanation = {
          passive: 'Sum has no passive forms (linking verb)'
        };
      } else if (presentStem === 'poss') {
        // possum, posse, potui (to be able)
        forms.indicative.present.active = {
          '1sg': 'possum',
          '2sg': 'potes',
          '3sg': 'potest',
          '1pl': 'possumus',
          '2pl': 'potestis',
          '3pl': 'possunt'
        };
        
        forms.indicative.imperfect.active = {
          '1sg': 'poteram',
          '2sg': 'poteras',
          '3sg': 'poterat',
          '1pl': 'poteramus',
          '2pl': 'poteratis', 
          '3pl': 'poterant'
        };
        
        forms.indicative.future.active = {
          '1sg': 'potero',
          '2sg': 'poteris',
          '3sg': 'poterit',
          '1pl': 'poterimus',
          '2pl': 'poteritis',
          '3pl': 'poterunt'
        };
        
        forms.subjunctive.present.active = {
          '1sg': 'possim',
          '2sg': 'possis',
          '3sg': 'possit',
          '1pl': 'possimus',
          '2pl': 'possitis',
          '3pl': 'possint'
        };
        
        forms.subjunctive.imperfect.active = {
          '1sg': 'possem',
          '2sg': 'posses',
          '3sg': 'posset',
          '1pl': 'possemus',
          '2pl': 'possetis',
          '3pl': 'possent'
        };
        
        forms.infinitives.present = 'posse';
        
        // No passive forms for possum
        forms.explanation = {
          passive: 'Possum has no passive forms (auxiliary verb)',
          imperative: 'Possum has no imperative forms'
        };
      }
    }
  } else if (declension.startsWith('6')) {
    // Sixth conjugation: volo, nolo, malo, eo, odeo
    if (declension.includes('6 1') && presentStem === 'ode') {
      // odeo, odire, odivi (to hate) - defective verb, primarily used in perfect tenses
      forms.indicative.present.active = {
        '1sg': 'odi',
        '2sg': 'odisti',
        '3sg': 'odit',
        '1pl': 'odimus',
        '2pl': 'odistis',
        '3pl': 'oderunt'
      };
      
      forms.indicative.imperfect.active = {
        '1sg': 'oderam',
        '2sg': 'oderas',
        '3sg': 'oderat',
        '1pl': 'oderamus',
        '2pl': 'oderatis',
        '3pl': 'oderant'
      };
      
      forms.indicative.future.active = {
        '1sg': 'odero',
        '2sg': 'oderis',
        '3sg': 'oderit',
        '1pl': 'oderimus',
        '2pl': 'oderitis',
        '3pl': 'oderint'
      };
      
      forms.subjunctive.present.active = {
        '1sg': 'oderim',
        '2sg': 'oderis',
        '3sg': 'oderit',
        '1pl': 'oderimus',
        '2pl': 'oderitis',
        '3pl': 'oderint'
      };
      
      forms.subjunctive.imperfect.active = {
        '1sg': 'odissem',
        '2sg': 'odisses',
        '3sg': 'odisset',
        '1pl': 'odissemus',
        '2pl': 'odissetis',
        '3pl': 'odissent'
      };
      
      forms.infinitives.present = 'odisse';
      
      forms.explanation = {
        defective: 'Odeo is primarily used in perfect tenses (present forms have perfect meaning)',
        passive: 'Odeo has no passive forms',
        imperative: 'Odeo has no imperative forms'
      };
    } else if (presentStem === 'vol') {
      // volo, velle, volui (to wish)
      forms.indicative.present.active = {
        '1sg': 'volo',
        '2sg': 'vis',
        '3sg': 'vult',
        '1pl': 'volumus',
        '2pl': 'vultis',
        '3pl': 'volunt'
      };
      
      forms.indicative.imperfect.active = {
        '1sg': 'volebam',
        '2sg': 'volebas',
        '3sg': 'volebat',
        '1pl': 'volebamus',
        '2pl': 'volebatis',
        '3pl': 'volebant'
      };
      
      forms.indicative.future.active = {
        '1sg': 'volam',
        '2sg': 'voles',
        '3sg': 'volet',
        '1pl': 'volemus',
        '2pl': 'voletis',
        '3pl': 'volent'
      };
      
      forms.subjunctive.present.active = {
        '1sg': 'velim',
        '2sg': 'velis',
        '3sg': 'velit',
        '1pl': 'velimus',
        '2pl': 'velitis',
        '3pl': 'velint'
      };
      
      forms.subjunctive.imperfect.active = {
        '1sg': 'vellem',
        '2sg': 'velles',
        '3sg': 'vellet',
        '1pl': 'vellemus',
        '2pl': 'velletis',
        '3pl': 'vellent'
      };
      
      forms.infinitives.present = 'velle';
      
      forms.explanation = {
        passive: 'Volo has no passive forms (intransitive verb)',
        imperative: 'Volo has no imperative forms'
      };
    } else if (presentStem === 'nol') {
      // nolo, nolle, nolui (to not wish)
      forms.indicative.present.active = {
        '1sg': 'nolo',
        '2sg': 'non vis',
        '3sg': 'non vult',
        '1pl': 'nolumus',
        '2pl': 'non vultis',
        '3pl': 'nolunt'
      };
      
      forms.indicative.imperfect.active = {
        '1sg': 'nolebam',
        '2sg': 'nolebas',
        '3sg': 'nolebat',
        '1pl': 'nolebamus',
        '2pl': 'nolebatis',
        '3pl': 'nolebant'
      };
      
      forms.indicative.future.active = {
        '1sg': 'nolam',
        '2sg': 'noles',
        '3sg': 'nolet',
        '1pl': 'nolemus',
        '2pl': 'noletis',
        '3pl': 'nolent'
      };
      
      forms.subjunctive.present.active = {
        '1sg': 'nolim',
        '2sg': 'nolis',
        '3sg': 'nolit',
        '1pl': 'nolimus',
        '2pl': 'nolitis',
        '3pl': 'nolint'
      };
      
      forms.subjunctive.imperfect.active = {
        '1sg': 'nollem',
        '2sg': 'nolles',
        '3sg': 'nollet',
        '1pl': 'nollemus',
        '2pl': 'nolletis',
        '3pl': 'nollent'
      };
      
      forms.imperative.present = {
        '2sg': 'noli',
        '2pl': 'nolite'
      };
      
      forms.infinitives.present = 'nolle';
      
      forms.explanation = {
        passive: 'Nolo has no passive forms (intransitive verb)'
      };
    } else if (presentStem === 'e') {
      // eo, ire, ivi, itum (to go)
      forms.indicative.present.active = {
        '1sg': 'eo',
        '2sg': 'is',
        '3sg': 'it',
        '1pl': 'imus',
        '2pl': 'itis',
        '3pl': 'eunt'
      };
      
      forms.indicative.imperfect.active = {
        '1sg': 'ibam',
        '2sg': 'ibas',
        '3sg': 'ibat',
        '1pl': 'ibamus',
        '2pl': 'ibatis',
        '3pl': 'ibant'
      };
      
      forms.indicative.future.active = {
        '1sg': 'ibo',
        '2sg': 'ibis',
        '3sg': 'ibit',
        '1pl': 'ibimus',
        '2pl': 'ibitis',
        '3pl': 'ibunt'
      };
      
      forms.subjunctive.present.active = {
        '1sg': 'eam',
        '2sg': 'eas',
        '3sg': 'eat',
        '1pl': 'eamus',
        '2pl': 'eatis',
        '3pl': 'eant'
      };
      
      forms.subjunctive.imperfect.active = {
        '1sg': 'irem',
        '2sg': 'ires',
        '3sg': 'iret',
        '1pl': 'iremus',
        '2pl': 'iretis',
        '3pl': 'irent'
      };
      
      forms.imperative.present = {
        '2sg': 'i',
        '2pl': 'ite'
      };
      
      forms.infinitives.present = 'ire';
      
      forms.explanation = {
        passive: 'Eo has no passive forms (intransitive verb of motion)'
      };
    }
  } else if (declension.startsWith('7')) {
    // Seventh conjugation: defective verbs
    if (presentStem === 'inqu') {
      // inquo (defective verb - only certain forms exist)
      forms.indicative.present.active = {
        '1sg': 'inquam',
        '2sg': 'inquis',
        '3sg': 'inquit',
        '1pl': '-',
        '2pl': '-',
        '3pl': 'inquiunt'
      };
      
      forms.explanation = {
        defective: 'Inquo is a defective verb with only limited forms',
        passive: 'Inquo has no passive forms',
        perfect: 'Inquo has no perfect tenses',
        imperative: 'Inquo has no imperative forms'
      };
    }
  } else if (declension.includes('SEMIDEP')) {
    // Semi-deponent verbs like fio
    if (presentStem === 'fi') {
      // fio, fieri, factus sum (to be made, become)
      forms.indicative.present.passive = {
        '1sg': 'fio',
        '2sg': 'fis',
        '3sg': 'fit',
        '1pl': 'fimus',
        '2pl': 'fitis',
        '3pl': 'fiunt'
      };
      
      forms.indicative.imperfect.passive = {
        '1sg': 'fiebam',
        '2sg': 'fiebas',
        '3sg': 'fiebat',
        '1pl': 'fiebamus',
        '2pl': 'fiebatis',
        '3pl': 'fiebant'
      };
      
      forms.indicative.future.passive = {
        '1sg': 'fiam',
        '2sg': 'fies',
        '3sg': 'fiet',
        '1pl': 'fiemus',
        '2pl': 'fietis',
        '3pl': 'fient'
      };
      
      forms.subjunctive.present.passive = {
        '1sg': 'fiam',
        '2sg': 'fias',
        '3sg': 'fiat',
        '1pl': 'fiamus',
        '2pl': 'fiatis',
        '3pl': 'fiant'
      };
      
      forms.subjunctive.imperfect.passive = {
        '1sg': 'fierem',
        '2sg': 'fieres',
        '3sg': 'fieret',
        '1pl': 'fieremus',
        '2pl': 'fieretis',
        '3pl': 'fierent'
      };
      
      forms.infinitives.present = 'fieri';
      
      forms.explanation = {
        active: 'Fio has no active forms (semi-deponent verb)',
        perfect: 'Perfect tenses use factus sum (passive participle + sum)'
      };
    }
  }
  
  return forms;
};

const generateAdjectiveInflections = (entry) => {
  const { stems, declension } = entry;
  const mainStem = stems[0];
  
  const forms = {};
  
  if (declension === '1 1' || (declension.includes('1') && declension.includes('2'))) {
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
  } else if (declension.startsWith('3')) {
    // Third declension adjectives: e.g., omnis, omne
    const genitiveStem = stems.length > 1 ? stems[1] : mainStem;
    
    forms.masculineFeminine = {
      singular: {
        nominative: mainStem,
        genitive: genitiveStem + 'is',
        dative: genitiveStem + 'i',
        accusative: genitiveStem + 'em',
        ablative: genitiveStem + 'i', // Note: -i for adjectives, not -e
        vocative: mainStem
      },
      plural: {
        nominative: genitiveStem + 'es',
        genitive: genitiveStem + 'ium', // Note: -ium for adjectives
        dative: genitiveStem + 'ibus',
        accusative: genitiveStem + 'es',
        ablative: genitiveStem + 'ibus',
        vocative: genitiveStem + 'es'
      }
    };
    
    forms.neuter = {
      singular: {
        nominative: mainStem,
        genitive: genitiveStem + 'is',
        dative: genitiveStem + 'i',
        accusative: mainStem,
        ablative: genitiveStem + 'i',
        vocative: mainStem
      },
      plural: {
        nominative: genitiveStem + 'ia',
        genitive: genitiveStem + 'ium',
        dative: genitiveStem + 'ibus',
        accusative: genitiveStem + 'ia',
        ablative: genitiveStem + 'ibus',
        vocative: genitiveStem + 'ia'
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

const generatePronounInflections = (entry) => {
  const { stems, dictionaryForm } = entry;
  const forms = {};
  
  // Handle different pronoun types based on their stems
  if (dictionaryForm.includes('hic')) {
    // hic, haec, hoc (this/these)
    forms.masculine = {
      singular: {
        nominative: 'hic',
        genitive: 'huius', 
        dative: 'huic',
        accusative: 'hunc',
        ablative: 'hoc'
      },
      plural: {
        nominative: 'hi',
        genitive: 'horum',
        dative: 'his', 
        accusative: 'hos',
        ablative: 'his'
      }
    };
    
    forms.feminine = {
      singular: {
        nominative: 'haec',
        genitive: 'huius',
        dative: 'huic', 
        accusative: 'hanc',
        ablative: 'hac'
      },
      plural: {
        nominative: 'hae',
        genitive: 'harum',
        dative: 'his',
        accusative: 'has', 
        ablative: 'his'
      }
    };
    
    forms.neuter = {
      singular: {
        nominative: 'hoc',
        genitive: 'huius',
        dative: 'huic',
        accusative: 'hoc', 
        ablative: 'hoc'
      },
      plural: {
        nominative: 'haec',
        genitive: 'horum',
        dative: 'his',
        accusative: 'haec',
        ablative: 'his'
      }
    };
  } else if (dictionaryForm.includes('iste')) {
    // iste, ista, istud (that near you)
    forms.masculine = {
      singular: {
        nominative: 'iste',
        genitive: 'istius',
        dative: 'isti',
        accusative: 'istum', 
        ablative: 'isto'
      },
      plural: {
        nominative: 'isti',
        genitive: 'istorum',
        dative: 'istis',
        accusative: 'istos',
        ablative: 'istis'
      }
    };
    
    forms.feminine = {
      singular: {
        nominative: 'ista',
        genitive: 'istius',
        dative: 'isti',
        accusative: 'istam',
        ablative: 'ista'
      },
      plural: {
        nominative: 'istae',
        genitive: 'istarum', 
        dative: 'istis',
        accusative: 'istas',
        ablative: 'istis'
      }
    };
    
    forms.neuter = {
      singular: {
        nominative: 'istud',
        genitive: 'istius',
        dative: 'isti',
        accusative: 'istud',
        ablative: 'isto'
      },
      plural: {
        nominative: 'ista',
        genitive: 'istorum',
        dative: 'istis',
        accusative: 'ista',
        ablative: 'istis'
      }
    };
  } else if (dictionaryForm.includes('ille')) {
    // ille, illa, illud (that/those)
    forms.masculine = {
      singular: {
        nominative: 'ille',
        genitive: 'illius',
        dative: 'illi',
        accusative: 'illum', 
        ablative: 'illo'
      },
      plural: {
        nominative: 'illi',
        genitive: 'illorum',
        dative: 'illis',
        accusative: 'illos',
        ablative: 'illis'
      }
    };
    
    forms.feminine = {
      singular: {
        nominative: 'illa',
        genitive: 'illius',
        dative: 'illi',
        accusative: 'illam',
        ablative: 'illa'
      },
      plural: {
        nominative: 'illae',
        genitive: 'illarum', 
        dative: 'illis',
        accusative: 'illas',
        ablative: 'illis'
      }
    };
    
    forms.neuter = {
      singular: {
        nominative: 'illud',
        genitive: 'illius',
        dative: 'illi',
        accusative: 'illud',
        ablative: 'illo'
      },
      plural: {
        nominative: 'illa',
        genitive: 'illorum',
        dative: 'illis', 
        accusative: 'illa',
        ablative: 'illis'
      }
    };
  } else if (dictionaryForm.includes('qui')) {
    // qui, quae, quod (who/which/that)
    forms.masculine = {
      singular: {
        nominative: 'qui',
        genitive: 'cuius',
        dative: 'cui',
        accusative: 'quem',
        ablative: 'quo'
      },
      plural: {
        nominative: 'qui',
        genitive: 'quorum',
        dative: 'quibus',
        accusative: 'quos', 
        ablative: 'quibus'
      }
    };
    
    forms.feminine = {
      singular: {
        nominative: 'quae',
        genitive: 'cuius',
        dative: 'cui',
        accusative: 'quam',
        ablative: 'qua'
      },
      plural: {
        nominative: 'quae',
        genitive: 'quarum',
        dative: 'quibus',
        accusative: 'quas',
        ablative: 'quibus'
      }
    };
    
    forms.neuter = {
      singular: {
        nominative: 'quod',
        genitive: 'cuius',
        dative: 'cui',
        accusative: 'quod',
        ablative: 'quo'
      },
      plural: {
        nominative: 'quae',
        genitive: 'quorum',
        dative: 'quibus',
        accusative: 'quae',
        ablative: 'quibus'
      }
    };
  } else if (dictionaryForm.includes('ego')) {
    // ego (I/me) - personal pronoun
    forms.personal = {
      first_person: {
        nominative: 'ego',
        genitive: 'mei',
        dative: 'mihi',
        accusative: 'me',
        ablative: 'me'
      },
      first_person_plural: {
        nominative: 'nos',
        genitive: 'nostri/nostrum',
        dative: 'nobis',
        accusative: 'nos',
        ablative: 'nobis'
      }
    };
  } else if (dictionaryForm.includes('tu')) {
    // tu (you) - personal pronoun
    forms.personal = {
      second_person: {
        nominative: 'tu',
        genitive: 'tui',
        dative: 'tibi',
        accusative: 'te',
        ablative: 'te'
      },
      second_person_plural: {
        nominative: 'vos',
        genitive: 'vestri/vestrum',
        dative: 'vobis', 
        accusative: 'vos',
        ablative: 'vobis'
      }
    };
  } else {
    // Default: treat as regular demonstrative pronoun using stems
    if (stems.length >= 3) {
      const mascStem = stems[0];
      const femStem = stems[1]; 
      const neutStem = stems[2];
      
      forms.basic = {
        masculine: mascStem,
        feminine: femStem,
        neuter: neutStem
      };
    }
  }
  
  return forms;
};

// Helper function to display verb forms with explanations
const displayVerbForm = (form, explanation, voiceType) => {
  if (form && form !== '-') {
    return form;
  }
  
  // Check if there's an explanation for why this form is missing
  if (explanation) {
    if (voiceType === 'passive' && explanation.passive) {
      return <em style={{color: '#6c757d', fontSize: '12px'}}>No passive</em>;
    }
    if (voiceType === 'active' && explanation.active) {
      return <em style={{color: '#6c757d', fontSize: '12px'}}>No active</em>;
    }
    if (explanation.defective) {
      return <em style={{color: '#6c757d', fontSize: '12px'}}>Not used</em>;
    }
  }
  
  return '-';
};

// Inflection Table Component
const InflectionTable = ({ entry }) => {
  const { partOfSpeech } = entry;
  
  if (partOfSpeech === 'N') {
    const inflections = generateNounInflections(entry);
    
    return (
      <div className="inflection-table">
        <h3>Noun Declension</h3>
        <table className="declension-table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Singular</th>
              <th>Plural</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Nominative</td>
              <td>{inflections.singular?.nominative || '-'}</td>
              <td>{inflections.plural?.nominative || '-'}</td>
            </tr>
            <tr>
              <td>Genitive</td>
              <td>{inflections.singular?.genitive || '-'}</td>
              <td>{inflections.plural?.genitive || '-'}</td>
            </tr>
            <tr>
              <td>Dative</td>
              <td>{inflections.singular?.dative || '-'}</td>
              <td>{inflections.plural?.dative || '-'}</td>
            </tr>
            <tr>
              <td>Accusative</td>
              <td>{inflections.singular?.accusative || '-'}</td>
              <td>{inflections.plural?.accusative || '-'}</td>
            </tr>
            <tr>
              <td>Ablative</td>
              <td>{inflections.singular?.ablative || '-'}</td>
              <td>{inflections.plural?.ablative || '-'}</td>
            </tr>
            <tr>
              <td>Vocative</td>
              <td>{inflections.singular?.vocative || '-'}</td>
              <td>{inflections.plural?.vocative || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  } else if (partOfSpeech === 'V') {
    const inflections = generateVerbInflections(entry);
    
    return (
      <div className="inflection-table">
        <h3>Verb Conjugation</h3>
        
        {/* Show explanations for irregular/missing forms */}
        {inflections.explanation && (
          <div className="verb-explanations" style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6', 
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <h4 style={{marginTop: 0, fontSize: '14px', color: '#495057'}}>Note:</h4>
            <ul style={{marginBottom: 0, fontSize: '13px', color: '#6c757d'}}>
              {inflections.explanation.passive && (
                <li><strong>Passive forms:</strong> {inflections.explanation.passive}</li>
              )}
              {inflections.explanation.active && (
                <li><strong>Active forms:</strong> {inflections.explanation.active}</li>
              )}
              {inflections.explanation.perfect && (
                <li><strong>Perfect tenses:</strong> {inflections.explanation.perfect}</li>
              )}
              {inflections.explanation.imperative && (
                <li><strong>Imperative forms:</strong> {inflections.explanation.imperative}</li>
              )}
              {inflections.explanation.defective && (
                <li><strong>Defective verb:</strong> {inflections.explanation.defective}</li>
              )}
            </ul>
          </div>
        )}
        
        {/* INDICATIVE MOOD */}
        <h4>Indicative Mood</h4>
        
        {/* Present Indicative */}
        <div className="verb-section">
          <h5>Present Tense</h5>
          <table className="conjugation-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Active</th>
                <th>Passive</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1st singular</td>
                <td>{displayVerbForm(inflections.indicative.present.active?.['1sg'], inflections.explanation, 'active')}</td>
                <td>{displayVerbForm(inflections.indicative.present.passive?.['1sg'], inflections.explanation, 'passive')}</td>
              </tr>
              <tr>
                <td>2nd singular</td>
                <td>{displayVerbForm(inflections.indicative.present.active?.['2sg'], inflections.explanation, 'active')}</td>
                <td>{displayVerbForm(inflections.indicative.present.passive?.['2sg'], inflections.explanation, 'passive')}</td>
              </tr>
              <tr>
                <td>3rd singular</td>
                <td>{displayVerbForm(inflections.indicative.present.active?.['3sg'], inflections.explanation, 'active')}</td>
                <td>{displayVerbForm(inflections.indicative.present.passive?.['3sg'], inflections.explanation, 'passive')}</td>
              </tr>
              <tr>
                <td>1st plural</td>
                <td>{displayVerbForm(inflections.indicative.present.active?.['1pl'], inflections.explanation, 'active')}</td>
                <td>{displayVerbForm(inflections.indicative.present.passive?.['1pl'], inflections.explanation, 'passive')}</td>
              </tr>
              <tr>
                <td>2nd plural</td>
                <td>{displayVerbForm(inflections.indicative.present.active?.['2pl'], inflections.explanation, 'active')}</td>
                <td>{displayVerbForm(inflections.indicative.present.passive?.['2pl'], inflections.explanation, 'passive')}</td>
              </tr>
              <tr>
                <td>3rd plural</td>
                <td>{displayVerbForm(inflections.indicative.present.active?.['3pl'], inflections.explanation, 'active')}</td>
                <td>{displayVerbForm(inflections.indicative.present.passive?.['3pl'], inflections.explanation, 'passive')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Imperfect Indicative */}
        <div className="verb-section">
          <h5>Imperfect Tense</h5>
          <table className="conjugation-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Active</th>
                <th>Passive</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1st singular</td>
                <td>{inflections.indicative.imperfect.active?.['1sg'] || '-'}</td>
                <td>{inflections.indicative.imperfect.passive?.['1sg'] || '-'}</td>
              </tr>
              <tr>
                <td>2nd singular</td>
                <td>{inflections.indicative.imperfect.active?.['2sg'] || '-'}</td>
                <td>{inflections.indicative.imperfect.passive?.['2sg'] || '-'}</td>
              </tr>
              <tr>
                <td>3rd singular</td>
                <td>{inflections.indicative.imperfect.active?.['3sg'] || '-'}</td>
                <td>{inflections.indicative.imperfect.passive?.['3sg'] || '-'}</td>
              </tr>
              <tr>
                <td>1st plural</td>
                <td>{inflections.indicative.imperfect.active?.['1pl'] || '-'}</td>
                <td>{inflections.indicative.imperfect.passive?.['1pl'] || '-'}</td>
              </tr>
              <tr>
                <td>2nd plural</td>
                <td>{inflections.indicative.imperfect.active?.['2pl'] || '-'}</td>
                <td>{inflections.indicative.imperfect.passive?.['2pl'] || '-'}</td>
              </tr>
              <tr>
                <td>3rd plural</td>
                <td>{inflections.indicative.imperfect.active?.['3pl'] || '-'}</td>
                <td>{inflections.indicative.imperfect.passive?.['3pl'] || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Future Indicative */}
        {inflections.indicative.future.active && (
          <div className="verb-section">
            <h5>Future Tense</h5>
            <table className="conjugation-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Active</th>
                  <th>Passive</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1st singular</td>
                  <td>{inflections.indicative.future.active?.['1sg'] || '-'}</td>
                  <td>{inflections.indicative.future.passive?.['1sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>2nd singular</td>
                  <td>{inflections.indicative.future.active?.['2sg'] || '-'}</td>
                  <td>{inflections.indicative.future.passive?.['2sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>3rd singular</td>
                  <td>{inflections.indicative.future.active?.['3sg'] || '-'}</td>
                  <td>{inflections.indicative.future.passive?.['3sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>1st plural</td>
                  <td>{inflections.indicative.future.active?.['1pl'] || '-'}</td>
                  <td>{inflections.indicative.future.passive?.['1pl'] || '-'}</td>
                </tr>
                <tr>
                  <td>2nd plural</td>
                  <td>{inflections.indicative.future.active?.['2pl'] || '-'}</td>
                  <td>{inflections.indicative.future.passive?.['2pl'] || '-'}</td>
                </tr>
                <tr>
                  <td>3rd plural</td>
                  <td>{inflections.indicative.future.active?.['3pl'] || '-'}</td>
                  <td>{inflections.indicative.future.passive?.['3pl'] || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        
        {/* Perfect Indicative */}
        {inflections.indicative.perfect.active && (
          <div className="verb-section">
            <h5>Perfect Tense</h5>
            <table className="conjugation-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Active</th>
                  <th>Passive</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1st singular</td>
                  <td>{inflections.indicative.perfect.active?.['1sg'] || '-'}</td>
                  <td>{inflections.indicative.perfect.passive?.['1sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>2nd singular</td>
                  <td>{inflections.indicative.perfect.active?.['2sg'] || '-'}</td>
                  <td>{inflections.indicative.perfect.passive?.['2sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>3rd singular</td>
                  <td>{inflections.indicative.perfect.active?.['3sg'] || '-'}</td>
                  <td>{inflections.indicative.perfect.passive?.['3sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>1st plural</td>
                  <td>{inflections.indicative.perfect.active?.['1pl'] || '-'}</td>
                  <td>{inflections.indicative.perfect.passive?.['1pl'] || '-'}</td>
                </tr>
                <tr>
                  <td>2nd plural</td>
                  <td>{inflections.indicative.perfect.active?.['2pl'] || '-'}</td>
                  <td>{inflections.indicative.perfect.passive?.['2pl'] || '-'}</td>
                </tr>
                <tr>
                  <td>3rd plural</td>
                  <td>{inflections.indicative.perfect.active?.['3pl'] || '-'}</td>
                  <td>{inflections.indicative.perfect.passive?.['3pl'] || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pluperfect Indicative */}
        {inflections.indicative.pluperfect.active && (
          <div className="verb-section">
            <h5>Pluperfect Tense</h5>
            <table className="conjugation-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Active</th>
                  <th>Passive</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1st singular</td>
                  <td>{inflections.indicative.pluperfect.active?.['1sg'] || '-'}</td>
                  <td>{inflections.indicative.pluperfect.passive?.['1sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>2nd singular</td>
                  <td>{inflections.indicative.pluperfect.active?.['2sg'] || '-'}</td>
                  <td>{inflections.indicative.pluperfect.passive?.['2sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>3rd singular</td>
                  <td>{inflections.indicative.pluperfect.active?.['3sg'] || '-'}</td>
                  <td>{inflections.indicative.pluperfect.passive?.['3sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>1st plural</td>
                  <td>{inflections.indicative.pluperfect.active?.['1pl'] || '-'}</td>
                  <td>{inflections.indicative.pluperfect.passive?.['1pl'] || '-'}</td>
                </tr>
                <tr>
                  <td>2nd plural</td>
                  <td>{inflections.indicative.pluperfect.active?.['2pl'] || '-'}</td>
                  <td>{inflections.indicative.pluperfect.passive?.['2pl'] || '-'}</td>
                </tr>
                <tr>
                  <td>3rd plural</td>
                  <td>{inflections.indicative.pluperfect.active?.['3pl'] || '-'}</td>
                  <td>{inflections.indicative.pluperfect.passive?.['3pl'] || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        
        {/* Future Perfect Indicative */}
        {inflections.indicative.futurePerfect.active && (
          <div className="verb-section">
            <h5>Future Perfect Tense</h5>
            <table className="conjugation-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Active</th>
                  <th>Passive</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1st singular</td>
                  <td>{inflections.indicative.futurePerfect.active?.['1sg'] || '-'}</td>
                  <td>{inflections.indicative.futurePerfect.passive?.['1sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>2nd singular</td>
                  <td>{inflections.indicative.futurePerfect.active?.['2sg'] || '-'}</td>
                  <td>{inflections.indicative.futurePerfect.passive?.['2sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>3rd singular</td>
                  <td>{inflections.indicative.futurePerfect.active?.['3sg'] || '-'}</td>
                  <td>{inflections.indicative.futurePerfect.passive?.['3sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>1st plural</td>
                  <td>{inflections.indicative.futurePerfect.active?.['1pl'] || '-'}</td>
                  <td>{inflections.indicative.futurePerfect.passive?.['1pl'] || '-'}</td>
                </tr>
                <tr>
                  <td>2nd plural</td>
                  <td>{inflections.indicative.futurePerfect.active?.['2pl'] || '-'}</td>
                  <td>{inflections.indicative.futurePerfect.passive?.['2pl'] || '-'}</td>
                </tr>
                <tr>
                  <td>3rd plural</td>
                  <td>{inflections.indicative.futurePerfect.active?.['3pl'] || '-'}</td>
                  <td>{inflections.indicative.futurePerfect.passive?.['3pl'] || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        
        {/* SUBJUNCTIVE MOOD */}
        {(inflections.subjunctive.present.active || inflections.subjunctive.imperfect.active) && (
          <>
            <h4>Subjunctive Mood</h4>
            
            {/* Present Subjunctive */}
            {inflections.subjunctive.present.active && (
              <div className="verb-section">
                <h5>Present Subjunctive</h5>
                <table className="conjugation-table">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Active</th>
                      <th>Passive</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1st singular</td>
                      <td>{inflections.subjunctive.present.active?.['1sg'] || '-'}</td>
                      <td>{inflections.subjunctive.present.passive?.['1sg'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>2nd singular</td>
                      <td>{inflections.subjunctive.present.active?.['2sg'] || '-'}</td>
                      <td>{inflections.subjunctive.present.passive?.['2sg'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>3rd singular</td>
                      <td>{inflections.subjunctive.present.active?.['3sg'] || '-'}</td>
                      <td>{inflections.subjunctive.present.passive?.['3sg'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>1st plural</td>
                      <td>{inflections.subjunctive.present.active?.['1pl'] || '-'}</td>
                      <td>{inflections.subjunctive.present.passive?.['1pl'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>2nd plural</td>
                      <td>{inflections.subjunctive.present.active?.['2pl'] || '-'}</td>
                      <td>{inflections.subjunctive.present.passive?.['2pl'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>3rd plural</td>
                      <td>{inflections.subjunctive.present.active?.['3pl'] || '-'}</td>
                      <td>{inflections.subjunctive.present.passive?.['3pl'] || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Imperfect Subjunctive */}
            {inflections.subjunctive.imperfect.active && (
              <div className="verb-section">
                <h5>Imperfect Subjunctive</h5>
                <table className="conjugation-table">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Active</th>
                      <th>Passive</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1st singular</td>
                      <td>{inflections.subjunctive.imperfect.active?.['1sg'] || '-'}</td>
                      <td>{inflections.subjunctive.imperfect.passive?.['1sg'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>2nd singular</td>
                      <td>{inflections.subjunctive.imperfect.active?.['2sg'] || '-'}</td>
                      <td>{inflections.subjunctive.imperfect.passive?.['2sg'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>3rd singular</td>
                      <td>{inflections.subjunctive.imperfect.active?.['3sg'] || '-'}</td>
                      <td>{inflections.subjunctive.imperfect.passive?.['3sg'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>1st plural</td>
                      <td>{inflections.subjunctive.imperfect.active?.['1pl'] || '-'}</td>
                      <td>{inflections.subjunctive.imperfect.passive?.['1pl'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>2nd plural</td>
                      <td>{inflections.subjunctive.imperfect.active?.['2pl'] || '-'}</td>
                      <td>{inflections.subjunctive.imperfect.passive?.['2pl'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>3rd plural</td>
                      <td>{inflections.subjunctive.imperfect.active?.['3pl'] || '-'}</td>
                      <td>{inflections.subjunctive.imperfect.passive?.['3pl'] || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Perfect Subjunctive */}
            {inflections.subjunctive.perfect.active && (
              <div className="verb-section">
                <h5>Perfect Subjunctive</h5>
                <table className="conjugation-table">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Active</th>
                      <th>Passive</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1st singular</td>
                      <td>{inflections.subjunctive.perfect.active?.['1sg'] || '-'}</td>
                      <td>{inflections.subjunctive.perfect.passive?.['1sg'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>2nd singular</td>
                      <td>{inflections.subjunctive.perfect.active?.['2sg'] || '-'}</td>
                      <td>{inflections.subjunctive.perfect.passive?.['2sg'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>3rd singular</td>
                      <td>{inflections.subjunctive.perfect.active?.['3sg'] || '-'}</td>
                      <td>{inflections.subjunctive.perfect.passive?.['3sg'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>1st plural</td>
                      <td>{inflections.subjunctive.perfect.active?.['1pl'] || '-'}</td>
                      <td>{inflections.subjunctive.perfect.passive?.['1pl'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>2nd plural</td>
                      <td>{inflections.subjunctive.perfect.active?.['2pl'] || '-'}</td>
                      <td>{inflections.subjunctive.perfect.passive?.['2pl'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>3rd plural</td>
                      <td>{inflections.subjunctive.perfect.active?.['3pl'] || '-'}</td>
                      <td>{inflections.subjunctive.perfect.passive?.['3pl'] || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pluperfect Subjunctive */}
            {inflections.subjunctive.pluperfect.active && (
              <div className="verb-section">
                <h5>Pluperfect Subjunctive</h5>
                <table className="conjugation-table">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Active</th>
                      <th>Passive</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1st singular</td>
                      <td>{inflections.subjunctive.pluperfect.active?.['1sg'] || '-'}</td>
                      <td>{inflections.subjunctive.pluperfect.passive?.['1sg'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>2nd singular</td>
                      <td>{inflections.subjunctive.pluperfect.active?.['2sg'] || '-'}</td>
                      <td>{inflections.subjunctive.pluperfect.passive?.['2sg'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>3rd singular</td>
                      <td>{inflections.subjunctive.pluperfect.active?.['3sg'] || '-'}</td>
                      <td>{inflections.subjunctive.pluperfect.passive?.['3sg'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>1st plural</td>
                      <td>{inflections.subjunctive.pluperfect.active?.['1pl'] || '-'}</td>
                      <td>{inflections.subjunctive.pluperfect.passive?.['1pl'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>2nd plural</td>
                      <td>{inflections.subjunctive.pluperfect.active?.['2pl'] || '-'}</td>
                      <td>{inflections.subjunctive.pluperfect.passive?.['2pl'] || '-'}</td>
                    </tr>
                    <tr>
                      <td>3rd plural</td>
                      <td>{inflections.subjunctive.pluperfect.active?.['3pl'] || '-'}</td>
                      <td>{inflections.subjunctive.pluperfect.passive?.['3pl'] || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        
        {/* IMPERATIVE MOOD */}
        {inflections.imperative.present && (
          <div className="verb-section">
            <h4>Imperative Mood</h4>
            <table className="conjugation-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Form</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2nd singular</td>
                  <td>{inflections.imperative.present?.['2sg'] || '-'}</td>
                </tr>
                <tr>
                  <td>2nd plural</td>
                  <td>{inflections.imperative.present?.['2pl'] || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        
        {/* INFINITIVES AND PARTICIPLES */}
        <div className="verb-section">
          <h4>Infinitives & Participles</h4>
          <table className="conjugation-table">
            <thead>
              <tr>
                <th>Form</th>
                <th>Latin</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Present Infinitive Active</td>
                <td>{inflections.infinitives.present || '-'}</td>
              </tr>
              {inflections.infinitives.presentPassive && (
                <tr>
                  <td>Present Infinitive Passive</td>
                  <td>{inflections.infinitives.presentPassive}</td>
                </tr>
              )}
              {inflections.infinitives.perfect && (
                <tr>
                  <td>Perfect Infinitive Active</td>
                  <td>{inflections.infinitives.perfect}</td>
                </tr>
              )}
              {inflections.infinitives.perfectPassive && (
                <tr>
                  <td>Perfect Infinitive Passive</td>
                  <td>{inflections.infinitives.perfectPassive}</td>
                </tr>
              )}
              {inflections.participles.present && (
                <tr>
                  <td>Present Participle</td>
                  <td>{inflections.participles.present}</td>
                </tr>
              )}
              {inflections.participles.perfect && (
                <tr>
                  <td>Perfect Participle</td>
                  <td>{inflections.participles.perfect}</td>
                </tr>
              )}
              {inflections.participles.future && (
                <tr>
                  <td>Future Participle</td>
                  <td>{inflections.participles.future}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else if (partOfSpeech === 'ADJ') {
    const inflections = generateAdjectiveInflections(entry);
    
    if (inflections.indeclinable) {
      return (
        <div className="inflection-table">
          <h3>Indeclinable Adjective</h3>
          <p>This adjective has the same form for all cases, numbers, and genders: <strong>{inflections.indeclinable.form}</strong></p>
        </div>
      );
    } else if (inflections.masculine && inflections.feminine && inflections.neuter) {
      // First/second declension adjectives (imus, -a, -um type)
      return (
        <div className="inflection-table">
          <h3>Adjective Declension (1st/2nd Declension)</h3>
          
          <h4>Masculine</h4>
          <table className="declension-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Singular</th>
                <th>Plural</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nominative</td>
                <td>{inflections.masculine.singular?.nominative || '-'}</td>
                <td>{inflections.masculine.plural?.nominative || '-'}</td>
              </tr>
              <tr>
                <td>Genitive</td>
                <td>{inflections.masculine.singular?.genitive || '-'}</td>
                <td>{inflections.masculine.plural?.genitive || '-'}</td>
              </tr>
              <tr>
                <td>Dative</td>
                <td>{inflections.masculine.singular?.dative || '-'}</td>
                <td>{inflections.masculine.plural?.dative || '-'}</td>
              </tr>
              <tr>
                <td>Accusative</td>
                <td>{inflections.masculine.singular?.accusative || '-'}</td>
                <td>{inflections.masculine.plural?.accusative || '-'}</td>
              </tr>
              <tr>
                <td>Ablative</td>
                <td>{inflections.masculine.singular?.ablative || '-'}</td>
                <td>{inflections.masculine.plural?.ablative || '-'}</td>
              </tr>
              <tr>
                <td>Vocative</td>
                <td>{inflections.masculine.singular?.vocative || '-'}</td>
                <td>{inflections.masculine.plural?.vocative || '-'}</td>
              </tr>
            </tbody>
          </table>
          
          <h4>Feminine</h4>
          <table className="declension-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Singular</th>
                <th>Plural</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nominative</td>
                <td>{inflections.feminine.singular?.nominative || '-'}</td>
                <td>{inflections.feminine.plural?.nominative || '-'}</td>
              </tr>
              <tr>
                <td>Genitive</td>
                <td>{inflections.feminine.singular?.genitive || '-'}</td>
                <td>{inflections.feminine.plural?.genitive || '-'}</td>
              </tr>
              <tr>
                <td>Dative</td>
                <td>{inflections.feminine.singular?.dative || '-'}</td>
                <td>{inflections.feminine.plural?.dative || '-'}</td>
              </tr>
              <tr>
                <td>Accusative</td>
                <td>{inflections.feminine.singular?.accusative || '-'}</td>
                <td>{inflections.feminine.plural?.accusative || '-'}</td>
              </tr>
              <tr>
                <td>Ablative</td>
                <td>{inflections.feminine.singular?.ablative || '-'}</td>
                <td>{inflections.feminine.plural?.ablative || '-'}</td>
              </tr>
              <tr>
                <td>Vocative</td>
                <td>{inflections.feminine.singular?.vocative || '-'}</td>
                <td>{inflections.feminine.plural?.vocative || '-'}</td>
              </tr>
            </tbody>
          </table>
          
          <h4>Neuter</h4>
          <table className="declension-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Singular</th>
                <th>Plural</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nominative</td>
                <td>{inflections.neuter.singular?.nominative || '-'}</td>
                <td>{inflections.neuter.plural?.nominative || '-'}</td>
              </tr>
              <tr>
                <td>Genitive</td>
                <td>{inflections.neuter.singular?.genitive || '-'}</td>
                <td>{inflections.neuter.plural?.genitive || '-'}</td>
              </tr>
              <tr>
                <td>Dative</td>
                <td>{inflections.neuter.singular?.dative || '-'}</td>
                <td>{inflections.neuter.plural?.dative || '-'}</td>
              </tr>
              <tr>
                <td>Accusative</td>
                <td>{inflections.neuter.singular?.accusative || '-'}</td>
                <td>{inflections.neuter.plural?.accusative || '-'}</td>
              </tr>
              <tr>
                <td>Ablative</td>
                <td>{inflections.neuter.singular?.ablative || '-'}</td>
                <td>{inflections.neuter.plural?.ablative || '-'}</td>
              </tr>
              <tr>
                <td>Vocative</td>
                <td>{inflections.neuter.singular?.vocative || '-'}</td>
                <td>{inflections.neuter.plural?.vocative || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    } else if (inflections.masculineFeminine && inflections.neuter) {
      // Third declension adjectives (omnis, omne type)
      return (
        <div className="inflection-table">
          <h3>Adjective Declension (3rd Declension)</h3>
          
          <h4>Masculine/Feminine</h4>
          <table className="declension-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Singular</th>
                <th>Plural</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nominative</td>
                <td>{inflections.masculineFeminine.singular?.nominative || '-'}</td>
                <td>{inflections.masculineFeminine.plural?.nominative || '-'}</td>
              </tr>
              <tr>
                <td>Genitive</td>
                <td>{inflections.masculineFeminine.singular?.genitive || '-'}</td>
                <td>{inflections.masculineFeminine.plural?.genitive || '-'}</td>
              </tr>
              <tr>
                <td>Dative</td>
                <td>{inflections.masculineFeminine.singular?.dative || '-'}</td>
                <td>{inflections.masculineFeminine.plural?.dative || '-'}</td>
              </tr>
              <tr>
                <td>Accusative</td>
                <td>{inflections.masculineFeminine.singular?.accusative || '-'}</td>
                <td>{inflections.masculineFeminine.plural?.accusative || '-'}</td>
              </tr>
              <tr>
                <td>Ablative</td>
                <td>{inflections.masculineFeminine.singular?.ablative || '-'}</td>
                <td>{inflections.masculineFeminine.plural?.ablative || '-'}</td>
              </tr>
              <tr>
                <td>Vocative</td>
                <td>{inflections.masculineFeminine.singular?.vocative || '-'}</td>
                <td>{inflections.masculineFeminine.plural?.vocative || '-'}</td>
              </tr>
            </tbody>
          </table>
          
          <h4>Neuter</h4>
          <table className="declension-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Singular</th>
                <th>Plural</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nominative</td>
                <td>{inflections.neuter.singular?.nominative || '-'}</td>
                <td>{inflections.neuter.plural?.nominative || '-'}</td>
              </tr>
              <tr>
                <td>Genitive</td>
                <td>{inflections.neuter.singular?.genitive || '-'}</td>
                <td>{inflections.neuter.plural?.genitive || '-'}</td>
              </tr>
              <tr>
                <td>Dative</td>
                <td>{inflections.neuter.singular?.dative || '-'}</td>
                <td>{inflections.neuter.plural?.dative || '-'}</td>
              </tr>
              <tr>
                <td>Accusative</td>
                <td>{inflections.neuter.singular?.accusative || '-'}</td>
                <td>{inflections.neuter.plural?.accusative || '-'}</td>
              </tr>
              <tr>
                <td>Ablative</td>
                <td>{inflections.neuter.singular?.ablative || '-'}</td>
                <td>{inflections.neuter.plural?.ablative || '-'}</td>
              </tr>
              <tr>
                <td>Vocative</td>
                <td>{inflections.neuter.singular?.vocative || '-'}</td>
                <td>{inflections.neuter.plural?.vocative || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
  } else if (partOfSpeech === 'PRON') {
    const inflections = generatePronounInflections(entry);
    
    if (inflections.personal) {
      // Personal pronouns (ego, tu)
      return (
        <div className="inflection-table">
          <h3>Personal Pronoun</h3>
          {inflections.personal.first_person && (
            <>
              <h4>First Person (I/me)</h4>
              <table className="declension-table">
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Singular</th>
                    <th>Plural</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Nominative</td>
                    <td>{inflections.personal.first_person.nominative}</td>
                    <td>{inflections.personal.first_person_plural.nominative}</td>
                  </tr>
                  <tr>
                    <td>Genitive</td>
                    <td>{inflections.personal.first_person.genitive}</td>
                    <td>{inflections.personal.first_person_plural.genitive}</td>
                  </tr>
                  <tr>
                    <td>Dative</td>
                    <td>{inflections.personal.first_person.dative}</td>
                    <td>{inflections.personal.first_person_plural.dative}</td>
                  </tr>
                  <tr>
                    <td>Accusative</td>
                    <td>{inflections.personal.first_person.accusative}</td>
                    <td>{inflections.personal.first_person_plural.accusative}</td>
                  </tr>
                  <tr>
                    <td>Ablative</td>
                    <td>{inflections.personal.first_person.ablative}</td>
                    <td>{inflections.personal.first_person_plural.ablative}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
          {inflections.personal.second_person && (
            <>
              <h4>Second Person (you)</h4>
              <table className="declension-table">
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Singular</th>
                    <th>Plural</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Nominative</td>
                    <td>{inflections.personal.second_person.nominative}</td>
                    <td>{inflections.personal.second_person_plural.nominative}</td>
                  </tr>
                  <tr>
                    <td>Genitive</td>
                    <td>{inflections.personal.second_person.genitive}</td>
                    <td>{inflections.personal.second_person_plural.genitive}</td>
                  </tr>
                  <tr>
                    <td>Dative</td>
                    <td>{inflections.personal.second_person.dative}</td>
                    <td>{inflections.personal.second_person_plural.dative}</td>
                  </tr>
                  <tr>
                    <td>Accusative</td>
                    <td>{inflections.personal.second_person.accusative}</td>
                    <td>{inflections.personal.second_person_plural.accusative}</td>
                  </tr>
                  <tr>
                    <td>Ablative</td>
                    <td>{inflections.personal.second_person.ablative}</td>
                    <td>{inflections.personal.second_person_plural.ablative}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>
      );
    } else if (inflections.masculine && inflections.feminine && inflections.neuter) {
      // Demonstrative pronouns (hic, ille, qui)
      return (
        <div className="inflection-table">
          <h3>Pronoun Declension</h3>
          
          <h4>Masculine</h4>
          <table className="declension-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Singular</th>
                <th>Plural</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nominative</td>
                <td>{inflections.masculine.singular?.nominative || '-'}</td>
                <td>{inflections.masculine.plural?.nominative || '-'}</td>
              </tr>
              <tr>
                <td>Genitive</td>
                <td>{inflections.masculine.singular?.genitive || '-'}</td>
                <td>{inflections.masculine.plural?.genitive || '-'}</td>
              </tr>
              <tr>
                <td>Dative</td>
                <td>{inflections.masculine.singular?.dative || '-'}</td>
                <td>{inflections.masculine.plural?.dative || '-'}</td>
              </tr>
              <tr>
                <td>Accusative</td>
                <td>{inflections.masculine.singular?.accusative || '-'}</td>
                <td>{inflections.masculine.plural?.accusative || '-'}</td>
              </tr>
              <tr>
                <td>Ablative</td>
                <td>{inflections.masculine.singular?.ablative || '-'}</td>
                <td>{inflections.masculine.plural?.ablative || '-'}</td>
              </tr>
            </tbody>
          </table>
          
          <h4>Feminine</h4>
          <table className="declension-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Singular</th>
                <th>Plural</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nominative</td>
                <td>{inflections.feminine.singular?.nominative || '-'}</td>
                <td>{inflections.feminine.plural?.nominative || '-'}</td>
              </tr>
              <tr>
                <td>Genitive</td>
                <td>{inflections.feminine.singular?.genitive || '-'}</td>
                <td>{inflections.feminine.plural?.genitive || '-'}</td>
              </tr>
              <tr>
                <td>Dative</td>
                <td>{inflections.feminine.singular?.dative || '-'}</td>
                <td>{inflections.feminine.plural?.dative || '-'}</td>
              </tr>
              <tr>
                <td>Accusative</td>
                <td>{inflections.feminine.singular?.accusative || '-'}</td>
                <td>{inflections.feminine.plural?.accusative || '-'}</td>
              </tr>
              <tr>
                <td>Ablative</td>
                <td>{inflections.feminine.singular?.ablative || '-'}</td>
                <td>{inflections.feminine.plural?.ablative || '-'}</td>
              </tr>
            </tbody>
          </table>
          
          <h4>Neuter</h4>
          <table className="declension-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Singular</th>
                <th>Plural</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nominative</td>
                <td>{inflections.neuter.singular?.nominative || '-'}</td>
                <td>{inflections.neuter.plural?.nominative || '-'}</td>
              </tr>
              <tr>
                <td>Genitive</td>
                <td>{inflections.neuter.singular?.genitive || '-'}</td>
                <td>{inflections.neuter.plural?.genitive || '-'}</td>
              </tr>
              <tr>
                <td>Dative</td>
                <td>{inflections.neuter.singular?.dative || '-'}</td>
                <td>{inflections.neuter.plural?.dative || '-'}</td>
              </tr>
              <tr>
                <td>Accusative</td>
                <td>{inflections.neuter.singular?.accusative || '-'}</td>
                <td>{inflections.neuter.plural?.accusative || '-'}</td>
              </tr>
              <tr>
                <td>Ablative</td>
                <td>{inflections.neuter.singular?.ablative || '-'}</td>
                <td>{inflections.neuter.plural?.ablative || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    } else {
      // Basic pronoun display
      return (
        <div className="inflection-table">
          <h3>Pronoun</h3>
          <p>This pronoun has limited inflection information available.</p>
          {inflections.basic && (
            <div>
              <strong>Forms:</strong> {inflections.basic.masculine}, {inflections.basic.feminine}, {inflections.basic.neuter}
            </div>
          )}
        </div>
      );
    }
  } else {
    return (
      <div className="inflection-table">
        <p>Inflection tables are not available for {entry.partOfSpeechDisplay}s.</p>
      </div>
    );
  }
};

const getMetadataBadges = (entry) => {
  const badges = [];
  
  // Part of speech badge
  badges.push({
    text: entry.partOfSpeechDisplay,
    type: 'pos'
  });
  
  // Gender badge (for nouns)
  if (entry.gender && entry.gender !== '') {
    badges.push({
      text: entry.gender === 'M' ? 'Masculine' : 
            entry.gender === 'F' ? 'Feminine' : 
            entry.gender === 'N' ? 'Neuter' : 
            entry.gender === 'C' ? 'Common' : entry.gender,
      type: 'gender'
    });
  }
  
  // Declension analysis
  if (entry.declension) {
    const declension = entry.declension;
    
    if (entry.partOfSpeech === 'N') {
      // Noun declensions
      if (declension.startsWith('1')) badges.push({ text: '1st Declension', type: 'declension' });
      else if (declension.startsWith('2')) badges.push({ text: '2nd Declension', type: 'declension' });
      else if (declension.startsWith('3')) badges.push({ text: '3rd Declension', type: 'declension' });
      else if (declension.startsWith('4')) badges.push({ text: '4th Declension', type: 'declension' });
      else if (declension.startsWith('5')) badges.push({ text: '5th Declension', type: 'declension' });
    } else if (entry.partOfSpeech === 'V') {
      // Verb conjugations and features
      if (declension.startsWith('1')) badges.push({ text: '1st Conjugation', type: 'conjugation' });
      else if (declension.startsWith('2')) badges.push({ text: '2nd Conjugation', type: 'conjugation' });
      else if (declension.startsWith('3')) badges.push({ text: '3rd Conjugation', type: 'conjugation' });
      else if (declension.startsWith('4')) badges.push({ text: '4th Conjugation', type: 'conjugation' });
      else if (declension.startsWith('5')) badges.push({ text: 'Irregular', type: 'irregular' });
      else if (declension.startsWith('6')) badges.push({ text: 'Irregular', type: 'irregular' });
      else if (declension.startsWith('7')) badges.push({ text: 'Defective', type: 'defective' });
      
      // Verb characteristics
      if (declension.includes('DEP')) badges.push({ text: 'Deponent', type: 'feature' });
      if (declension.includes('SEMIDEP')) badges.push({ text: 'Semi-deponent', type: 'feature' });
      if (declension.includes('TRANS')) badges.push({ text: 'Transitive', type: 'feature' });
      if (declension.includes('INTRANS')) badges.push({ text: 'Intransitive', type: 'feature' });
      if (declension.includes('IMPERS')) badges.push({ text: 'Impersonal', type: 'feature' });
      if (declension.includes('PERFDEF')) badges.push({ text: 'Perfect Definite', type: 'feature' });
      if (declension.includes('TO_BEING')) badges.push({ text: 'Sum-type', type: 'irregular' });
    } else if (entry.partOfSpeech === 'ADJ') {
      // Adjective declensions
      if (declension.includes('1') && declension.includes('2')) {
        badges.push({ text: '1st/2nd Declension', type: 'declension' });
      } else if (declension.includes('3')) {
        badges.push({ text: '3rd Declension', type: 'declension' });
      } else if (declension === '9 9') {
        badges.push({ text: 'Indeclinable', type: 'feature' });
      }
    }
  }
  
  return badges;
};

const GlossaryPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('glossary'); // 'glossary' or 'savedwords'
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [morphData, setMorphData] = useState(null);
  const [englishData, setEnglishData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchDirection, setSearchDirection] = useState('latin'); // 'latin' or 'english'
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showInflectionTable, setShowInflectionTable] = useState(false);
  const [savedWords, setSavedWords] = useState([]);
  const [showSavedWords, setShowSavedWords] = useState(true); // Always show saved words
  const [currentSessionId, setCurrentSessionId] = useState(1);
  const [sessions, setSessions] = useState([
    {
      id: 1,
      name: "Session 1",
      startedAt: new Date().toISOString(),
      words: []
    }
  ]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [draggedWord, setDraggedWord] = useState(null);
  const [draggedFromSession, setDraggedFromSession] = useState(null);
  const [dragOverSession, setDragOverSession] = useState(null);
  const [dragOverWordIndex, setDragOverWordIndex] = useState(null);
  const [draggedWordIndex, setDraggedWordIndex] = useState(null);

  // Load saved sessions from Firebase/localStorage on component mount
  useEffect(() => {
    const loadSavedSessions = async () => {
      if (user?.uid) {
        // User is authenticated, try to load from Firebase
        try {
          console.log('🔥 Loading saved sessions from Firebase for user:', user.uid);
          const firebaseData = await getSavedWordSessions(user.uid);
          
          if (firebaseData.sessions && firebaseData.sessions.length > 0) {
            console.log('🔄 Loading Firebase data, current local words:', savedWords.length);
            setSessions(firebaseData.sessions);
            setCurrentSessionId(firebaseData.currentSessionId);
            
            // Rebuild flattened savedWords array from sessions
            const allWords = firebaseData.sessions.flatMap(session => session.words);
            setSavedWords(allWords);
            
            console.log('✅ Loaded sessions from Firebase:', firebaseData.sessions.length, 'sessions', allWords.length, 'total words');
            
            // Also trigger index creation check
            try {
              await triggerIndexCreation(user.uid);
            } catch (indexError) {
              // This is expected to fail and generate the index creation link
              console.log('📊 Index creation triggered');
            }
            
            setHasLoadedInitialData(true);
            return; // Successfully loaded from Firebase
          }
        } catch (error) {
          console.error('❌ Error loading from Firebase, falling back to localStorage:', error);
          
          // Log manual index creation instructions
          if (error.code === 'failed-precondition' && error.message.includes('index')) {
            logFirebaseIndexInstructions();
          } else {
            // For any Firebase error, show the manual instructions
            console.warn('⚠️ Firebase error detected, showing manual index creation instructions:');
            logFirebaseIndexInstructions();
          }
        }
      }
      
      // Fall back to localStorage (for unauthenticated users or Firebase errors)
      const savedSessionsData = localStorage.getItem('glossary-sessions');
      const savedCurrentSessionId = localStorage.getItem('glossary-current-session-id');
      
      if (savedSessionsData) {
        try {
          const parsedSessions = JSON.parse(savedSessionsData);
          setSessions(parsedSessions);
          
          // Rebuild flattened savedWords array from sessions
          const allWords = parsedSessions.flatMap(session => session.words);
          setSavedWords(allWords);
          
          // Restore current session ID
          if (savedCurrentSessionId) {
            setCurrentSessionId(parseInt(savedCurrentSessionId, 10));
          }
          
          console.log('📱 Loaded sessions from localStorage:', parsedSessions.length, 'sessions');
        } catch (error) {
          console.error('Error parsing saved sessions data:', error);
        }
      }
      
      setHasLoadedInitialData(true);
    };
    
    loadSavedSessions();
  }, [user]);

  // Save sessions to Firebase/localStorage whenever sessions state changes
  useEffect(() => {
    // CRITICAL: Only save if we've loaded initial data to prevent overwriting with empty state
    if (!hasLoadedInitialData) {
      console.log('⏳ Skipping save - initial data not loaded yet');
      return;
    }
    
    // Always save to localStorage for offline support
    localStorage.setItem('glossary-sessions', JSON.stringify(sessions));
    localStorage.setItem('glossary-current-session-id', currentSessionId.toString());
    
    // Also save to Firebase if user is authenticated
    if (user?.uid) {
      const sessionsData = {
        sessions,
        currentSessionId
      };
      
      console.log('💾 Saving to Firebase:', sessions.length, 'sessions with', sessions.reduce((total, s) => total + s.words.length, 0), 'total words');
      
      // Save directly to Firebase (with a small delay to batch rapid changes)
      setTimeout(async () => {
        try {
          await saveSavedWordSessions(user.uid, sessionsData);
          console.log('✅ Auto-saved to Firebase');
        } catch (error) {
          console.error('❌ Auto-save failed:', error);
        }
      }, 500);
    }
  }, [sessions, currentSessionId, user, hasLoadedInitialData]);

  // Load dictionary data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📚 Loading dictionary data...');
        
        console.log('📥 Importing whitakersOptimized.json...');
        const morphDataModule = await import('../data/whitakersOptimized.json');
        console.log('✅ Morph data loaded:', !!morphDataModule.default);
        
        console.log('📥 Importing englishIndex.json...');
        const englishDataModule = await import('../data/englishIndex.json');
        console.log('✅ English data loaded:', !!englishDataModule.default);
        
        if (!morphDataModule.default) {
          throw new Error('Failed to load whitakersOptimized.json - no default export');
        }
        
        if (!englishDataModule.default) {
          throw new Error('Failed to load englishIndex.json - no default export');
        }
        
        setMorphData(morphDataModule.default);
        setEnglishData(englishDataModule.default);
        setDataLoaded(true);
        console.log('✅ Dictionary loading complete!');
      } catch (error) {
        console.error('❌ Dictionary loading error:', error);
        setLoadError(`Dictionary loading failed: ${error.message}`);
      }
    };
    loadData();
  }, []);

  // Enhanced search handler for both Latin→English and English→Latin
  useEffect(() => {
    console.log('Search effect triggered:', { 
      searchTerm, 
      dataLoaded, 
      morphData: !!morphData, 
      englishData: !!englishData,
      searchDirection 
    });
    
    if (!searchTerm.trim() || !dataLoaded || !morphData) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // For English→Latin search, we also need the English index
    if (searchDirection === 'english' && !englishData) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Add a small delay to show loading state for very fast searches
    const searchTimeout = setTimeout(() => {
      try {
        const term = searchTerm.toLowerCase().trim();
        console.log('Searching for:', term, 'Direction:', searchDirection);
        
        let entryIds = [];
        
        if (searchDirection === 'latin') {
          // Latin→English search (original functionality)
          entryIds = morphData.morphIndex[term] || [];
        } else {
          // English→Latin search (new functionality)
          entryIds = englishData.englishIndex[term] || [];
          
          // If no exact match, try partial matches for English
          if (entryIds.length === 0) {
            const partialMatches = Object.keys(englishData.englishIndex)
              .filter(englishTerm => englishTerm.includes(term) || term.includes(englishTerm))
              .slice(0, 50) // Limit partial matches
              .flatMap(englishTerm => englishData.englishIndex[englishTerm]);
            
            entryIds = [...new Set(partialMatches)]; // Remove duplicates
          }
        }
        
        console.log('Found entry IDs:', entryIds);
        
        if (entryIds.length === 0) {
          setResults([]);
          setIsLoading(false);
          return;
        }

        const matches = entryIds.map(id => {
          const entry = morphData.entries[id];
          console.log('Processing entry:', entry);
          return entry;
        }).filter(entry => entry != null);
        
        let filteredMatches;
        
        if (searchDirection === 'latin') {
          // For Latin→English search, apply the existing filtering logic
          const exactMatches = matches.filter(entry => 
            entry.stems.includes(term) || entry.dictionaryForm.toLowerCase().includes(term)
          );
          const derivativeMatches = matches.filter(entry => 
            !entry.stems.includes(term) && !entry.dictionaryForm.toLowerCase().includes(term)
          );
          
          if (exactMatches.length > 0) {
            filteredMatches = [...exactMatches];
            
            // For specific cases, filter out confusing derivative matches
            if (term === 'satis') {
              const relevantDerivatives = derivativeMatches.filter(entry => 
                entry.dictionaryForm !== 'sat, sat'
              );
              filteredMatches.push(...relevantDerivatives);
            } else {
              filteredMatches.push(...derivativeMatches);
            }
          } else {
            filteredMatches = matches;
          }
        } else {
          // For English→Latin search, show all matches without complex filtering
          // but limit the number to avoid overwhelming results
          filteredMatches = matches.slice(0, 20); // Limit to 20 results for English searches
        }
        
        // Sort by part of speech priority (ADJ/ADV before V)
        filteredMatches.sort((a, b) => {
          const posOrder = { 'ADJ': 1, 'ADV': 2, 'N': 3, 'V': 4, 'PREP': 5 };
          const aPriority = posOrder[a.partOfSpeech] || 6;
          const bPriority = posOrder[b.partOfSpeech] || 6;
          
          return aPriority - bPriority;
        });
        
        const finalMatches = filteredMatches;

        // Deduplicate by dictionary form AND part of speech to avoid showing the same word multiple times
        const uniqueMatches = [];
        const seenForms = new Set();
        
        for (const entry of finalMatches) {
          const key = `${entry.dictionaryForm}|${entry.partOfSpeech}`;
          if (!seenForms.has(key)) {
            seenForms.add(key);
            uniqueMatches.push(entry);
          }
        }

        console.log('Final matches after deduplication:', uniqueMatches);
        setResults(uniqueMatches);
        setIsLoading(false);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setIsLoading(false);
      }
    }, 100); // Small delay to show loading state

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, dataLoaded, morphData, englishData, searchDirection]);

  // Session management functions
  const startNewSession = () => {
    const newSessionId = Math.max(...sessions.map(s => s.id)) + 1;
    const newSession = {
      id: newSessionId,
      name: `Session ${newSessionId}`,
      startedAt: new Date().toISOString(),
      words: []
    };
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSessionId);
  };

  // Saved words functions
  const addToSavedWords = (entry) => {
    console.log('➕ Adding word:', entry.dictionaryForm);
    
    // Check if already saved in any session
    const isAlreadySaved = sessions.some(session => 
      session.words.some(word => word.id === entry.id)
    );
    
    if (isAlreadySaved) {
      return; // Don't add duplicates
    }

    // Add to current session and update savedWords for display
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { ...session, words: [...session.words, { ...entry, addedAt: new Date().toISOString() }] }
        : session
    ));
    
    // Update the flattened savedWords array for easy checking
    setSavedWords(prev => [...prev, entry]);
  };

  const removeFromSavedWords = (entryId) => {
    console.log('🗑️ Removing word with ID:', entryId);
    
    // Remove from all sessions
    setSessions(prev => {
      const updated = prev.map(session => ({
        ...session,
        words: session.words.filter(word => word.id !== entryId)
      }));
      console.log('📊 Sessions after removal:', updated);
      return updated;
    });
    
    // Update the flattened savedWords array
    setSavedWords(prev => {
      const updated = prev.filter(saved => saved.id !== entryId);
      console.log('📝 SavedWords after removal:', updated.length, 'words');
      return updated;
    });
  };

  const isWordSaved = (entryId) => {
    return savedWords.some(saved => saved.id === entryId);
  };

  // Get all sessions for display (newest first, show even empty sessions)
  const getSessionizedWords = () => {
    return sessions
      .slice() // Create copy to avoid mutating original
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)); // Newest first
  };

  // Drag and Drop handlers
  const handleDragStart = (e, word, sessionId, wordIndex) => {
    setDraggedWord(word);
    setDraggedFromSession(sessionId);
    setDraggedWordIndex(wordIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // For Firefox compatibility
  };

  const handleDragOver = (e, sessionId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSession(sessionId);
  };

  const handleWordDragOver = (e, sessionId, wordIndex) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSession(sessionId);
    setDragOverWordIndex(wordIndex);
  };

  const handleDragLeave = (e) => {
    // Only clear drag over if we're leaving the session container entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverSession(null);
      setDragOverWordIndex(null);
    }
  };

  const handleDrop = (e, targetSessionId) => {
    e.preventDefault();
    
    if (!draggedWord || !draggedFromSession) return;

    // If dropping in the same session, handle reordering
    if (draggedFromSession === targetSessionId && dragOverWordIndex !== null) {
      console.log('🔄 Reordering word', draggedWord.dictionaryForm, 'in session', targetSessionId, 'to position', dragOverWordIndex);
      
      setSessions(prev => {
        return prev.map(session => {
          if (session.id === targetSessionId) {
            const sortedWords = session.words
              .slice()
              .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
            
            // Remove the dragged word from its current position
            const filteredWords = sortedWords.filter(word => word.id !== draggedWord.id);
            
            // Insert at the new position
            const newWords = [...filteredWords];
            newWords.splice(dragOverWordIndex, 0, draggedWord);
            
            // Update timestamps to maintain the new order
            const reorderedWords = newWords.map((word, index) => ({
              ...word,
              addedAt: new Date(Date.now() - index * 1000).toISOString() // Stagger timestamps
            }));
            
            return {
              ...session,
              words: reorderedWords
            };
          }
          return session;
        });
      });
    } else if (draggedFromSession !== targetSessionId) {
      // Move word between sessions
      console.log('🚚 Moving word', draggedWord.dictionaryForm, 'from session', draggedFromSession, 'to session', targetSessionId);

      setSessions(prev => {
        return prev.map(session => {
          if (session.id === draggedFromSession) {
            // Remove from source session
            return {
              ...session,
              words: session.words.filter(word => word.id !== draggedWord.id)
            };
          } else if (session.id === targetSessionId) {
            // Add to target session (with new timestamp)
            return {
              ...session,
              words: [...session.words, { ...draggedWord, addedAt: new Date().toISOString() }]
            };
          }
          return session;
        });
      });
    }

    // Clear drag state
    setDraggedWord(null);
    setDraggedFromSession(null);
    setDragOverSession(null);
    setDragOverWordIndex(null);
    setDraggedWordIndex(null);
  };

  const handleDragEnd = () => {
    // Clean up drag state
    setDraggedWord(null);
    setDraggedFromSession(null);
    setDragOverSession(null);
    setDragOverWordIndex(null);
    setDraggedWordIndex(null);
  };

  // Session renaming functions
  const startEditingSession = (sessionId, currentName) => {
    setEditingSessionId(sessionId);
    setEditingSessionName(currentName);
  };

  const saveSessionName = () => {
    if (editingSessionName.trim()) {
      setSessions(prev => prev.map(session => 
        session.id === editingSessionId 
          ? { ...session, name: editingSessionName.trim() }
          : session
      ));
    }
    setEditingSessionId(null);
    setEditingSessionName('');
  };

  const cancelEditingSession = () => {
    setEditingSessionId(null);
    setEditingSessionName('');
  };

  // Delete session function
  const deleteSession = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session and all its words?')) {
      const sessionToDelete = sessions.find(s => s.id === sessionId);
      
      if (sessionToDelete) {
        // Remove words from the session from savedWords array
        const wordsToRemove = sessionToDelete.words.map(word => word.id);
        setSavedWords(prev => prev.filter(word => !wordsToRemove.includes(word.id)));
        
        // Remove session from sessions array
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        
        // If we deleted the current session, switch to the next available session
        if (sessionId === currentSessionId) {
          const remainingSessions = sessions.filter(session => session.id !== sessionId);
          if (remainingSessions.length > 0) {
            setCurrentSessionId(remainingSessions[0].id);
          } else {
            // Create a new default session if no sessions remain
            const newSession = {
              id: 1,
              name: "Session 1",
              startedAt: new Date().toISOString(),
              words: []
            };
            setSessions([newSession]);
            setCurrentSessionId(1);
          }
        }
      }
    }
  };


  // Show loading state if data isn't ready
  if (loadError) {
    return (
      <div className="glossary-page">
        <div className="glossary-container">
          <div className="no-results">
            <div className="no-results-icon">⚠️</div>
            <h3>Dictionary Loading Error</h3>
            <p>{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className="glossary-page">
        <div className="glossary-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>Loading dictionary data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render SavedWordsPage if in savedwords view
  if (currentView === 'savedwords') {
    return <SavedWordsPage onBack={() => setCurrentView('glossary')} />;
  }

  return (
    <div className="glossary-page">
      <div className="glossary-container">
        {/* SAVED HEADER CODE - RESTORE IF NEEDED:
        <div className="glossary-header">
          <h1>📖 Latin Dictionary</h1>
          <p>
            {searchTerm.trim() === '' ? (
              `${morphData?.metadata?.totalEntries?.toLocaleString() || 0} entries, ${morphData?.metadata?.totalForms?.toLocaleString() || 0} searchable forms`
            ) : isLoading ? (
              `Searching for "${searchTerm}"...`
            ) : (
              `Showing ${results.length} result${results.length !== 1 ? 's' : ''} for "${searchTerm}"`
            )}
          </p>
        </div>
        */}

        <div className="search-section">
          <div className="search-tabs">
            <div className="tabs-left">
              <button
                className={`search-tab ${searchDirection === 'latin' ? 'active' : ''}`}
                onClick={() => {
                  setSearchDirection('latin');
                  setSearchTerm(''); // Clear search when switching
                  setResults([]);
                }}
              >
                Latin
              </button>
              <button
                className={`search-tab ${searchDirection === 'english' ? 'active' : ''}`}
                onClick={() => {
                  setSearchDirection('english');
                  setSearchTerm(''); // Clear search when switching
                  setResults([]);
                }}
              >
                English
              </button>
            </div>
            <button 
              className="saved-words-toggle active"
              onClick={() => setCurrentView(currentView === 'savedwords' ? 'glossary' : 'savedwords')}
              title={currentView === 'savedwords' ? 'Back to Glossary' : 'Manage Saved Words'}
            >
              {currentView === 'savedwords' ? '← Back to Glossary' : `📚 Saved (${savedWords.length})`}
            </button>
          </div>
          <div className="search-bar">
            <input
              type="text"
              placeholder={searchDirection === 'latin' ? 'Search Latin words (e.g., amo, puella, magnus)...' : 'Search English words (e.g., love, girl, big)...'}
              value={searchTerm}
              onChange={(e) => {
                console.log('Input changed:', e.target.value);
                setSearchTerm(e.target.value);
              }}
              className="search-input"
            />
          </div>
        </div>

        <div className={`main-content ${showSavedWords ? 'with-sidebar' : ''}`}>
          <div className="results-section">
          {searchTerm.trim() === '' ? (
            <div className="search-prompt">
              <h3>
                {searchDirection === 'latin' 
                  ? 'Enter a Latin word to search' 
                  : 'Enter an English word to find Latin translations'
                }
              </h3>
            </div>
          ) : results.length === 0 ? (
            <div className="no-results">
              <h3>No results found for "{searchTerm}"</h3>
            </div>
          ) : (
            <div className="results-list">
              <div className="results-header">
                <span>
                  {results.length === 1 ? 
                    `Found 1 dictionary entry for "${searchTerm}":` :
                    `Found ${results.length} dictionary entries for "${searchTerm}":`
                  }
                </span>
              </div>
              {results.map((entry, index) => {
                const badges = getMetadataBadges(entry);
                
                return (
                  <div 
                    key={`${entry.id}_${index}`} 
                    className={`result-item ${(entry.partOfSpeech === 'N' || entry.partOfSpeech === 'V' || entry.partOfSpeech === 'ADJ' || entry.partOfSpeech === 'PRON') ? 'clickable' : ''}`}
                    onClick={() => {
                      if (entry.partOfSpeech === 'N' || entry.partOfSpeech === 'V' || entry.partOfSpeech === 'ADJ' || entry.partOfSpeech === 'PRON') {
                        setSelectedEntry(entry);
                        setShowInflectionTable(true);
                      }
                    }}
                  >
                    <div className="entry-header">
                      <div className="dictionary-form">
                        <strong>{entry.dictionaryForm}</strong>
                      </div>
                      <button
                        className={`save-word-btn ${isWordSaved(entry.id) ? 'saved' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the card click
                          if (isWordSaved(entry.id)) {
                            removeFromSavedWords(entry.id);
                          } else {
                            addToSavedWords(entry);
                          }
                        }}
                        title={isWordSaved(entry.id) ? 'Remove from saved words' : 'Add to saved words'}
                      >
                        {isWordSaved(entry.id) ? '✓' : '+'}
                      </button>
                    </div>
                    <div className="meaning">
                      {entry.meaning}
                    </div>
                    <div className="metadata-badges">
                      {badges.map((badge, badgeIndex) => (
                        <span key={badgeIndex} className={`metadata-badge ${badge.type}`}>
                          {badge.text}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

          {/* Saved Words Panel */}
          {showSavedWords && (
            <div className="saved-words-panel">
              <div className="saved-words-header">
                <div className="saved-words-title">
                  <h3>📚 Saved Words ({savedWords.length})</h3>
                </div>
                <div className="saved-words-controls">
                  <button 
                    className="new-session-btn"
                    onClick={startNewSession}
                    title="Start a new session"
                  >
                    + New Session
                  </button>
                  {savedWords.length > 0 && (
                    <button 
                      className="clear-all-btn"
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to clear all saved words and sessions? This action cannot be undone.')) {
                          // Clear local state
                          setSavedWords([]);
                          setSessions([{
                            id: 1,
                            name: "Session 1",
                            startedAt: new Date().toISOString(),
                            words: []
                          }]);
                          setCurrentSessionId(1);
                          
                          // Also delete from Firebase if user is authenticated
                          if (user?.uid) {
                            try {
                              await deleteSavedWordSessions(user.uid);
                              console.log('🔥 Cleared all sessions from Firebase');
                            } catch (error) {
                              console.error('❌ Error clearing Firebase sessions:', error);
                            }
                          }
                        }
                      }}
                      title="Clear all saved words"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <div className="saved-words-list">
                {savedWords.length === 0 ? (
                  <div className="empty-state">
                    <p>No saved words yet</p>
                    <p className="hint">Click the + button next to any word to save it here</p>
                  </div>
                ) : (
                  getSessionizedWords().map((session) => (
                    <div 
                      key={session.id} 
                      className={`session-group ${dragOverSession === session.id ? 'drag-over' : ''}`}
                      onDragOver={(e) => handleDragOver(e, session.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, session.id)}
                    >
                      <div className="session-divider">
                        {editingSessionId === session.id ? (
                          <input
                            type="text"
                            value={editingSessionName}
                            onChange={(e) => setEditingSessionName(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') saveSessionName();
                              if (e.key === 'Escape') cancelEditingSession();
                            }}
                            onBlur={saveSessionName}
                            autoFocus
                            className="session-name-input"
                          />
                        ) : (
                          <>
                            <h4 
                              className="session-name"
                              onClick={() => startEditingSession(session.id, session.name)}
                              title="Click to rename session"
                            >
                              {session.name}
                            </h4>
                            <span className="session-count">
                              ({session.words.length} words)
                            </span>
                            <span className="session-date">
                              {new Date(session.startedAt).toLocaleDateString()}
                            </span>
                            <button
                              className="delete-session-btn"
                              onClick={() => deleteSession(session.id)}
                              title="Delete this session and all its words"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                      <div className="session-words">
                        {session.words.length === 0 ? (
                          <div className="empty-session">
                            <p>No words in this session yet</p>
                          </div>
                        ) : (
                          session.words
                            .slice() // Create copy to avoid mutating original
                            .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)) // Most recent first
                            .map((word, wordIndex) => (
                          <div 
                            key={word.id} 
                            className={`saved-word-item ${(word.partOfSpeech === 'N' || word.partOfSpeech === 'V' || word.partOfSpeech === 'ADJ' || word.partOfSpeech === 'PRON') ? 'clickable' : ''} ${draggedWord?.id === word.id ? 'dragging' : ''} ${dragOverWordIndex === wordIndex && dragOverSession === session.id ? 'drag-over-word' : ''}`}
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, word, session.id, wordIndex)}
                            onDragOver={(e) => handleWordDragOver(e, session.id, wordIndex)}
                            onDragEnd={handleDragEnd}
                            onClick={() => {
                              if (word.partOfSpeech === 'N' || word.partOfSpeech === 'V' || word.partOfSpeech === 'ADJ' || word.partOfSpeech === 'PRON') {
                                setSelectedEntry(word);
                                setShowInflectionTable(true);
                              }
                            }}
                          >
                            <div className="saved-word-content">
                              <div className="word-header">
                                <strong>{word.dictionaryForm}</strong>
                                <span className="part-of-speech">{word.partOfSpeechDisplay}</span>
                              </div>
                              <div className="word-meaning">{word.meaning}</div>
                            </div>
                            <div className="saved-word-actions">
                              <button
                                className="remove-word-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromSavedWords(word.id);
                                }}
                                title="Remove from saved words"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

        
        {/* Inflection Table Modal */}
        {showInflectionTable && selectedEntry && (
          <div className="modal-overlay" onClick={() => setShowInflectionTable(false)}>
            <div className="inflection-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📋 Inflection Table: {selectedEntry.dictionaryForm}</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowInflectionTable(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <InflectionTable entry={selectedEntry} />
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default GlossaryPage;
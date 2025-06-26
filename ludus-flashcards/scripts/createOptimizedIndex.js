#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Creates an optimized morphological index for production use
 * - Smaller file size
 * - Focus on common Latin words
 * - Optimized for web delivery
 */

const DICTLINE_FILE = path.join(__dirname, '../../whitakers-words-master/DICTLINE.GEN');
const UNIQUES_FILE = path.join(__dirname, '../../whitakers-words-master/UNIQUES.LAT');
const OUTPUT_FILE = path.join(__dirname, '../src/data/whitakersOptimized.json');

const POS_MAPPING = {
  'N': 'Noun',
  'V': 'Verb', 
  'ADJ': 'Adjective',
  'ADV': 'Adverb',
  'PREP': 'Preposition',
  'CONJ': 'Conjunction',
  'INTERJ': 'Interjection',
  'PRON': 'Pronoun',
  'NUM': 'Numeral',
  'PACK': 'Packon'
};

// Expanded patterns for more comprehensive Latin vocabulary
const PRIORITY_PATTERNS = [
  // Common verbs (expanded)
  /^(am|hab|vid|fac|dic|ven|da|sta|mitt|cap|duc|fer|ag|leg|scrib|curr|clam|laud|mon|put|ten|port|mov|sent|spect|aud|voc|ced|cred|fall|tim|vol|nol|mal|pos|sci|cogn|intelleg|memor|obl|viv|mor|nasc|cre|de|iac|rog|quaer|pet|orn|par|iub|vetu|sine|perm|prob|neg|aff|confirm)/,
  // Common nouns (expanded)
  /^(aqu|terr|vir|feminn|puell|puer|domin|serv|liber|bell|pax|urb|domus|temp|ann|dies|nox|vita|mort|corp|caput|man|ped|ocul|aur|or|dent|coll|brachi|reg|rex|princep|civis|popul|patr|matr|fil|fili|frat|sor|ux|marit|ami|host|de|angel|loc|via|iter|camp|mont|vall|fluvi|mar|cael|sol|lun|stell|igni|aer|vent|pluvii|niv|glaci|arb|flor|fruct|anim|equ|bov|can|fel|av|pisc)/,
  // Common adjectives (expanded)
  /^(bon|mal|magn|parv|alt|nov|veter|pulchr|long|brev|lat|angust|mult|pauc|prim|ultim|medi|fort|deb|san|aegr|sap|stult|dives|pauper|nobil|humil|liber|serv|sacr|profan|viv|mortu|alb|nigr|rub|virid|flav|celer|tard|facil|difficil|dul|amar|cal|frig|sicc|humid|plan|acut|rect|curv|den|rar)/,
  // Function words and pronouns  
  /^(ego|tu|nos|vos|hic|haec|hoc|ille|illa|illud|ipse|ipsa|ipsum|qui|quae|quod|quis|quid|aliqui|nullus|omn|tot|tant|quot|quant|uter|neuter|alter|ali|ceteri|reliq)/,
  // Numbers
  /^(un|du|tre|quattu|quin|sex|septe|octo|nove|dece|undece|duodece|tredece|quattuordece|quindece|sedece|septendece|duodevigint|undevigint|vigint|trigint|quadragint|quinquagint|sexagint|septuagint|octogint|nonagint|cent|mill)/,
  // Common prepositions and conjunctions
  /^(ad|ab|ex|de|in|cum|sine|per|sub|super|inter|ante|post|circum|contra|prop|secund|et|que|sed|autem|enim|nam|igitur|ergo|itaque|tamen|quamquam|cum|si|nisi|ut|ne|an|vel|aut)/,
];

function isValidEntry(stemArray, meaning) {
  // Filter out meanings that look like test data
  if (meaning.includes('zzz') || meaning.includes('xxx') || meaning.includes('test')) {
    return false;
  }
  
  // Count zzz/xxx stems - if ALL stems are zzz/xxx, it's test data
  let zzzCount = 0;
  let validStems = 0;
  
  for (const stem of stemArray) {
    if (stem === 'zzz' || stem === 'xxx' || stem === 'ZZZ' || stem === 'XXX') {
      zzzCount++;
    } else if (/^[a-zA-Z]+$/.test(stem) && stem.length <= 20) {
      validStems++;
    } else {
      // Filter out entries with non-Latin characters or numbers in valid stems
      return false;
    }
  }
  
  // Only reject if ALL stems are zzz/xxx (obvious test data)
  // Allow entries with some zzz stems (defective verbs with missing principal parts)
  if (zzzCount > 0 && validStems === 0) {
    return false;
  }
  
  return true;
}

function isHighPriorityWord(stem, meaning) {
  // First check if it's a valid entry
  if (!isValidEntry([stem], meaning)) {
    return false;
  }
  
  // Check if stem matches common patterns
  if (PRIORITY_PATTERNS.some(pattern => pattern.test(stem.toLowerCase()))) {
    return true;
  }
  
  // Expanded list of common English meanings
  const commonMeanings = [
    // Basic verbs
    'love', 'have', 'see', 'make', 'say', 'come', 'give', 'stand', 'send', 'take', 'go', 'walk', 'run', 'sit', 'lie', 'sleep', 'wake', 'eat', 'drink', 'think', 'know', 'remember', 'forget', 'learn', 'teach', 'speak', 'hear', 'listen', 'look', 'watch', 'feel', 'touch', 'hold', 'carry', 'put', 'place', 'find', 'lose', 'buy', 'sell', 'pay', 'cost', 'work', 'play', 'win', 'lose', 'begin', 'start', 'end', 'finish', 'continue', 'stop', 'wait', 'hurry', 'help', 'serve', 'follow', 'lead', 'rule', 'obey', 'allow', 'forbid', 'can', 'must', 'want', 'wish', 'hope', 'fear', 'worry', 'believe', 'doubt', 'agree', 'disagree', 'like', 'dislike', 'prefer', 'choose', 'decide', 'try', 'succeed', 'fail', 'seem', 'appear', 'happen', 'occur', 'exist', 'live', 'die', 'kill', 'hurt', 'heal', 'grow', 'change', 'become', 'remain', 'stay', 'leave', 'arrive', 'return', 'visit', 'meet', 'greet', 'welcome', 'invite', 'accept', 'refuse', 'thank', 'apologize', 'forgive', 'blame', 'praise', 'criticize', 'laugh', 'cry', 'smile', 'frown', 'worry', 'relax', 'enjoy', 'suffer', 'celebrate', 'mourn',
    // Basic nouns
    'water', 'earth', 'land', 'ground', 'soil', 'stone', 'rock', 'mountain', 'hill', 'valley', 'river', 'lake', 'sea', 'ocean', 'island', 'forest', 'tree', 'plant', 'flower', 'grass', 'leaf', 'branch', 'root', 'seed', 'fruit', 'vegetable', 'grain', 'bread', 'meat', 'fish', 'bird', 'animal', 'horse', 'cow', 'pig', 'dog', 'cat', 'sheep', 'goat', 'chicken', 'egg', 'milk', 'cheese', 'wine', 'beer', 'food', 'meal', 'breakfast', 'lunch', 'dinner', 'man', 'woman', 'person', 'people', 'child', 'boy', 'girl', 'baby', 'adult', 'old', 'young', 'parent', 'father', 'mother', 'son', 'daughter', 'brother', 'sister', 'family', 'friend', 'enemy', 'neighbor', 'stranger', 'guest', 'host', 'king', 'queen', 'prince', 'princess', 'lord', 'lady', 'master', 'servant', 'slave', 'citizen', 'foreigner', 'soldier', 'farmer', 'merchant', 'priest', 'doctor', 'teacher', 'student', 'worker', 'artist', 'musician', 'poet', 'writer', 'reader', 'speaker', 'listener', 'leader', 'follower', 'ruler', 'subject', 'judge', 'witness', 'criminal', 'victim', 'hero', 'coward', 'wise', 'fool', 'rich', 'poor', 'strong', 'weak', 'healthy', 'sick', 'happy', 'sad', 'angry', 'calm', 'brave', 'afraid', 'beautiful', 'ugly', 'clean', 'dirty', 'new', 'old', 'young', 'ancient', 'modern', 'early', 'late', 'quick', 'slow', 'easy', 'difficult', 'simple', 'complex', 'clear', 'unclear', 'true', 'false', 'right', 'wrong', 'good', 'bad', 'better', 'worse', 'best', 'worst', 'big', 'small', 'large', 'little', 'huge', 'tiny', 'long', 'short', 'tall', 'low', 'high', 'deep', 'shallow', 'wide', 'narrow', 'thick', 'thin', 'heavy', 'light', 'hard', 'soft', 'rough', 'smooth', 'sharp', 'dull', 'hot', 'cold', 'warm', 'cool', 'dry', 'wet', 'full', 'empty', 'open', 'closed', 'public', 'private', 'free', 'expensive', 'cheap', 'house', 'home', 'building', 'room', 'door', 'window', 'wall', 'roof', 'floor', 'ceiling', 'kitchen', 'bedroom', 'bathroom', 'garden', 'yard', 'farm', 'field', 'road', 'street', 'path', 'bridge', 'gate', 'fence', 'city', 'town', 'village', 'country', 'nation', 'state', 'government', 'law', 'rule', 'order', 'peace', 'war', 'battle', 'fight', 'victory', 'defeat', 'weapon', 'sword', 'shield', 'army', 'soldier', 'general', 'captain', 'guard', 'prison', 'jail', 'court', 'trial', 'crime', 'punishment', 'reward', 'gift', 'present', 'money', 'coin', 'gold', 'silver', 'bronze', 'iron', 'wood', 'paper', 'book', 'letter', 'word', 'language', 'speech', 'voice', 'sound', 'noise', 'music', 'song', 'dance', 'game', 'sport', 'play', 'toy', 'tool', 'machine', 'vehicle', 'ship', 'boat', 'cart', 'wheel', 'horse', 'journey', 'trip', 'travel', 'distance', 'place', 'location', 'position', 'direction', 'north', 'south', 'east', 'west', 'left', 'right', 'center', 'middle', 'edge', 'corner', 'top', 'bottom', 'front', 'back', 'inside', 'outside', 'above', 'below', 'over', 'under', 'between', 'among', 'near', 'far', 'here', 'there', 'where', 'time', 'moment', 'hour', 'day', 'night', 'morning', 'afternoon', 'evening', 'week', 'month', 'year', 'season', 'spring', 'summer', 'autumn', 'winter', 'today', 'yesterday', 'tomorrow', 'past', 'present', 'future', 'early', 'late', 'soon', 'never', 'always', 'often', 'sometimes', 'rarely', 'once', 'twice', 'again', 'still', 'yet', 'already', 'now', 'then', 'when', 'while', 'during', 'before', 'after', 'since', 'until', 'weather', 'sun', 'moon', 'star', 'sky', 'cloud', 'rain', 'snow', 'wind', 'storm', 'fire', 'light', 'dark', 'shadow', 'color', 'white', 'black', 'red', 'blue', 'green', 'yellow', 'brown', 'purple', 'orange', 'pink', 'gray', 'body', 'head', 'face', 'eye', 'nose', 'mouth', 'ear', 'hair', 'neck', 'shoulder', 'arm', 'hand', 'finger', 'chest', 'back', 'stomach', 'leg', 'foot', 'toe', 'heart', 'blood', 'bone', 'skin', 'mind', 'soul', 'spirit', 'life', 'death', 'birth', 'age', 'health', 'disease', 'pain', 'medicine', 'doctor', 'hospital', 'school', 'church', 'temple', 'god', 'goddess', 'prayer', 'sacrifice', 'festival', 'ceremony', 'marriage', 'wedding', 'funeral', 'love', 'hate', 'fear', 'hope', 'joy', 'sorrow', 'anger', 'peace', 'rest', 'work', 'job', 'business', 'trade', 'market', 'shop', 'store', 'price', 'value', 'profit', 'loss', 'debt', 'loan', 'interest', 'tax', 'food', 'hunger', 'thirst', 'taste', 'smell', 'touch', 'hearing', 'sight', 'feeling', 'emotion', 'thought', 'idea', 'plan', 'purpose', 'reason', 'cause', 'effect', 'result', 'consequence', 'problem', 'solution', 'question', 'answer', 'example', 'model', 'copy', 'original', 'real', 'fake', 'truth', 'lie', 'fact', 'opinion', 'belief', 'doubt', 'certainty', 'possibility', 'probability', 'chance', 'luck', 'fortune', 'fate', 'destiny', 'future', 'past', 'history', 'story', 'tale', 'news', 'information', 'knowledge', 'wisdom', 'ignorance', 'mistake', 'error', 'fault', 'blame', 'responsibility', 'duty', 'obligation', 'right', 'privilege', 'freedom', 'slavery', 'justice', 'injustice', 'fair', 'unfair', 'equal', 'unequal', 'same', 'different', 'similar', 'opposite', 'contrast', 'comparison', 'choice', 'decision', 'option', 'alternative', 'chance', 'opportunity', 'advantage', 'disadvantage', 'benefit', 'harm', 'help', 'hindrance', 'support', 'opposition', 'agreement', 'disagreement', 'cooperation', 'competition', 'conflict', 'argument', 'discussion', 'conversation', 'dialogue', 'debate', 'negotiation', 'compromise', 'treaty', 'alliance', 'friendship', 'enmity', 'relationship', 'connection', 'link', 'bond', 'tie', 'separation', 'division', 'unity', 'union', 'joining', 'meeting', 'gathering', 'assembly', 'crowd', 'group', 'team', 'organization', 'society', 'community', 'culture', 'tradition', 'custom', 'habit', 'practice', 'method', 'way', 'manner', 'style', 'fashion', 'trend', 'pattern', 'order', 'arrangement', 'system', 'structure', 'form', 'shape', 'size', 'amount', 'quantity', 'number', 'count', 'measure', 'weight', 'length', 'width', 'height', 'depth', 'area', 'volume', 'space', 'room', 'place', 'spot', 'point', 'line', 'circle', 'square', 'triangle', 'angle', 'curve', 'straight', 'level', 'slope', 'hill', 'mountain', 'valley', 'plain', 'desert', 'jungle', 'swamp', 'beach', 'coast', 'shore', 'harbor', 'port', 'dock', 'ship', 'boat', 'sail', 'anchor', 'rope', 'chain', 'metal', 'material', 'substance', 'matter', 'element', 'compound', 'mixture', 'pure', 'clean', 'dirty', 'pollution', 'environment', 'nature', 'natural', 'artificial', 'human', 'animal', 'plant', 'mineral', 'living', 'dead', 'alive', 'existence', 'being', 'creature', 'creation', 'destruction', 'construction', 'building', 'making', 'production', 'manufacture', 'industry', 'factory', 'machine', 'tool', 'instrument', 'device', 'equipment', 'furniture', 'table', 'chair', 'bed', 'cabinet', 'shelf', 'box', 'container', 'bottle', 'cup', 'plate', 'bowl', 'spoon', 'knife', 'fork', 'clothing', 'dress', 'shirt', 'pants', 'shoes', 'hat', 'coat', 'jacket', 'belt', 'ring', 'necklace', 'jewel', 'ornament', 'decoration', 'art', 'painting', 'picture', 'image', 'statue', 'sculpture', 'music', 'song', 'dance', 'entertainment', 'fun', 'pleasure', 'enjoyment', 'satisfaction', 'contentment', 'happiness', 'gladness', 'cheerfulness', 'laughter', 'smile', 'sadness', 'sorrow', 'grief', 'mourning', 'tears', 'crying', 'weeping', 'worry', 'anxiety', 'stress', 'tension', 'pressure', 'force', 'strength', 'power', 'energy', 'effort', 'struggle', 'fight', 'battle', 'war', 'conflict', 'violence', 'aggression', 'attack', 'defense', 'protection', 'safety', 'security', 'danger', 'risk', 'threat', 'warning', 'alarm', 'emergency', 'accident', 'injury', 'wound', 'cut', 'burn', 'bruise', 'healing', 'recovery', 'improvement', 'progress', 'development', 'growth', 'increase', 'decrease', 'reduction', 'change', 'transformation', 'revolution', 'evolution', 'advance', 'retreat', 'forward', 'backward', 'upward', 'downward', 'movement', 'motion', 'speed', 'velocity', 'acceleration', 'deceleration', 'stop', 'pause', 'rest', 'break', 'interruption', 'continuation', 'beginning', 'start', 'opening', 'end', 'finish', 'closing', 'conclusion', 'completion', 'achievement', 'accomplishment', 'success', 'failure', 'victory', 'defeat', 'win', 'lose', 'gain', 'profit', 'benefit', 'advantage', 'disadvantage', 'loss', 'damage', 'harm', 'hurt', 'pain', 'suffering', 'misery', 'agony', 'torture', 'punishment', 'penalty', 'fine', 'reward', 'prize', 'gift', 'present', 'offering', 'sacrifice', 'donation', 'contribution', 'payment', 'cost', 'expense', 'budget', 'economy', 'economics', 'finance', 'money', 'wealth', 'poverty', 'rich', 'poor', 'expensive', 'cheap', 'valuable', 'worthless', 'importance', 'significance', 'meaning', 'purpose', 'goal', 'aim', 'objective', 'target', 'intention', 'plan', 'scheme', 'project', 'program', 'schedule', 'timetable', 'calendar', 'date', 'appointment', 'meeting', 'conference', 'discussion', 'conversation', 'talk', 'speech', 'lecture', 'presentation', 'explanation', 'description', 'definition', 'meaning', 'sense', 'understanding', 'comprehension', 'knowledge', 'information', 'data', 'fact', 'detail', 'particular', 'general', 'specific', 'exact', 'precise', 'accurate', 'correct', 'right', 'proper', 'appropriate', 'suitable', 'fitting', 'matching', 'corresponding', 'related', 'connected', 'linked', 'associated', 'combined', 'joined', 'united', 'together', 'apart', 'separate', 'individual', 'personal', 'private', 'public', 'common', 'ordinary', 'normal', 'usual', 'regular', 'standard', 'typical', 'average', 'special', 'particular', 'unique', 'rare', 'unusual', 'strange', 'odd', 'weird', 'normal', 'natural', 'artificial', 'fake', 'real', 'genuine', 'authentic', 'original', 'copy', 'imitation', 'model', 'example', 'sample', 'specimen', 'case', 'instance', 'occasion', 'event', 'happening', 'incident', 'accident', 'emergency', 'crisis', 'problem', 'difficulty', 'trouble', 'issue', 'matter', 'subject', 'topic', 'theme', 'question', 'inquiry', 'investigation', 'research', 'study', 'examination', 'test', 'trial', 'experiment', 'experience', 'practice', 'training', 'education', 'learning', 'teaching', 'instruction', 'lesson', 'class', 'course', 'school', 'university', 'college', 'student', 'pupil', 'teacher', 'professor', 'master', 'expert', 'specialist', 'professional', 'amateur', 'beginner', 'novice', 'experienced', 'skilled', 'talented', 'gifted', 'clever', 'intelligent', 'smart', 'wise', 'foolish', 'stupid', 'ignorant', 'educated', 'learned', 'cultured', 'civilized', 'barbaric', 'savage', 'wild', 'tame', 'domestic', 'foreign', 'native', 'local', 'regional', 'national', 'international', 'global', 'universal', 'general', 'particular', 'specific', 'detailed', 'broad', 'narrow', 'wide', 'limited', 'unlimited', 'infinite', 'finite', 'complete', 'incomplete', 'partial', 'total', 'whole', 'part', 'piece', 'portion', 'section', 'division', 'department', 'branch', 'category', 'class', 'type', 'kind', 'sort', 'variety', 'species', 'genus', 'family', 'group', 'set', 'collection', 'gathering', 'assembly', 'meeting', 'conference', 'convention', 'festival', 'celebration', 'party', 'ceremony', 'ritual', 'custom', 'tradition', 'culture', 'civilization', 'society', 'community', 'nation', 'country', 'state', 'government', 'politics', 'policy', 'law', 'rule', 'regulation', 'order', 'command', 'instruction', 'direction', 'guidance', 'advice', 'suggestion', 'recommendation', 'proposal', 'offer', 'invitation', 'request', 'demand', 'requirement', 'need', 'necessity', 'want', 'desire', 'wish', 'hope', 'expectation', 'anticipation', 'prediction', 'forecast', 'prophecy', 'promise', 'commitment', 'obligation', 'duty', 'responsibility', 'job', 'task', 'work', 'labor', 'effort', 'activity', 'action', 'behavior', 'conduct', 'manner', 'way', 'method', 'technique', 'skill', 'ability', 'capability', 'capacity', 'talent', 'gift', 'quality', 'characteristic', 'feature', 'property', 'attribute', 'trait', 'aspect', 'element', 'factor', 'component', 'ingredient', 'part', 'detail', 'point', 'item', 'thing', 'object', 'article', 'piece', 'unit', 'individual', 'single', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand', 'million', 'billion', 'many', 'few', 'several', 'some', 'all', 'every', 'each', 'any', 'no', 'none', 'nothing', 'something', 'anything', 'everything'
  ];
  
  return commonMeanings.some(word => meaning.toLowerCase().includes(word));
}

function createDictionaryForm(entry) {
  const { stems, partOfSpeech, declension, gender } = entry;
  
  // Helper function to clean zzz placeholders from dictionary forms
  function cleanForm(form) {
    return form.replace(/,?\s*zzz\w*/g, '').replace(/,\s*$/, '').trim();
  }
  
  if (partOfSpeech === 'N') {
    if (declension.startsWith('1')) {
      // First declension: stem + a, stem + ae
      return `${stems[0]}a, ${stems[0]}ae`;
    } else if (declension.startsWith('2')) {
      // Second declension
      if (gender === 'M' || gender === 'C') {
        return `${stems[0]}us, ${stems[0]}i`;
      } else if (gender === 'N') {
        return `${stems[0]}um, ${stems[0]}i`;
      } else {
        return `${stems[0]}us, ${stems[0]}i`;
      }
    } else if (declension.startsWith('3')) {
      // Third declension: use nominative if available, otherwise construct
      if (stems.length > 1 && stems[1] !== stems[0]) {
        return `${stems[0]}, ${stems[1]}is`;
      } else {
        // Try to guess nominative from stem
        const stem = stems[0];
        if (stem.endsWith('n')) {
          return `${stem.slice(0, -1)}x, ${stem}is`;
        } else if (stem.endsWith('r')) {
          return `${stem}, ${stem}is`;
        } else {
          return `${stem}s, ${stem}is`;
        }
      }
    } else if (declension.startsWith('4')) {
      // Fourth declension
      if (gender === 'M' || gender === 'C') {
        return `${stems[0]}us, ${stems[0]}us`;
      } else {
        return `${stems[0]}u, ${stems[0]}us`;
      }
    } else if (declension.startsWith('5')) {
      // Fifth declension
      return `${stems[0]}es, ${stems[0]}ei`;
    } else {
      return cleanForm(stems.join(', '));
    }
  } else if (partOfSpeech === 'V') {
    // Special handling for PERFDEF verbs first
    if (declension.includes('PERFDEF')) {
      const perfectStem = stems[2];
      if (perfectStem && perfectStem !== 'zzz') {
        return `${perfectStem}i`; // memini, not "zzzeo, zzzere, memini, zzzum"
      }
    }
    
    // Special handling for quaeso - reconstruct complete principal parts
    if (stems[0] === 'quaes') {
      return 'quaeso, quaesere, quaesivi, quaesitum'; // Complete third conjugation forms
    }
    
    if (stems.length >= 4) {
      // All four principal parts available: [present stem, present stem, perfect stem, participle stem]
      const presentStem = stems[0];
      const perfectStem = stems[2];
      const participleStem = stems[3];
      
      // For first conjugation (ends in 'a'): amo, amare, amavi, amatum
      if (declension.startsWith('1')) {
        // Check if deponent
        if (declension.includes('DEP')) {
          return `${presentStem}or, ${presentStem}ari, ${participleStem}us sum`;
        } else {
          return cleanForm(`${presentStem}o, ${presentStem}are, ${perfectStem}i, ${participleStem}um`);
        }
      }
      // For other conjugations, try to determine the infinitive
      else if (declension.startsWith('2')) {
        if (declension.includes('DEP')) {
          return `${presentStem}eor, ${presentStem}eri, ${participleStem}us sum`;
        } else {
          return cleanForm(`${presentStem}eo, ${presentStem}ere, ${perfectStem}i, ${participleStem}um`);
        }
      }
      else if (declension.startsWith('3')) {
        if (declension.includes('DEP')) {
          return `${presentStem}or, ${presentStem}i, ${participleStem}us sum`;
        } else {
          return cleanForm(`${presentStem}o, ${presentStem}ere, ${perfectStem}i, ${participleStem}um`);
        }
      }
      else if (declension.startsWith('4')) {
        if (declension.includes('DEP')) {
          return `${presentStem}ior, ${presentStem}iri, ${participleStem}us sum`;
        } else {
          return cleanForm(`${presentStem}io, ${presentStem}ire, ${perfectStem}i, ${participleStem}um`);
        }
      }
      else if (declension.startsWith('6')) {
        // Irregular verbs like eo, nolo, malo, volo
        // Special cases for specific irregular verbs
        if (presentStem === 'nol') {
          // nolo, nolle, nolui (no participle)
          return `${presentStem}o, ${presentStem}le, ${perfectStem}i`;
        } else if (presentStem === 'mal') {
          // malo, malle, malui (no participle)
          return `${presentStem}o, ${presentStem}le, ${perfectStem}i`;
        } else if (presentStem === 'vol') {
          // volo, velle, volui (no participle)
          return `${presentStem}o, ${presentStem}le, ${perfectStem}i`;
        } else {
          // Other irregular verbs like eo: eo, ire, ivi/ii, itum
          const infinitiveStem = stems[1];
          return cleanForm(`${presentStem}o, ${infinitiveStem}re, ${perfectStem}i, ${participleStem}um`);
        }
      }
      else if (declension.startsWith('5')) {
        // Irregular verbs like possum
        if (declension.includes('TO_BEING')) {
          // Special case for sum, esse (to be)
          if (presentStem === 'su') {
            return `sum, esse, fui, futurus`;
          }
          // possum: poss, pot, potu -> possum, posse, potui
          return `${presentStem}um, ${presentStem}e, ${perfectStem}i`;
        } else {
          return cleanForm(`${presentStem}o, ${presentStem}ere, ${perfectStem}i, ${participleStem}um`);
        }
      }
      else if (declension.startsWith('7')) {
        // Seventh conjugation: defective verbs
        if (presentStem === 'ai') {
          // aio is defective - only has certain forms
          return `aio`;  // Just "aio" (I say)
        } else {
          // Other defective verbs - just show the base form
          return `${presentStem}o`;
        }
      }
      else if (declension.includes('SEMIDEP')) {
        // Semi-deponent verbs like fio
        return `${presentStem}o, ${presentStem}eri, ${participleStem}us sum`;
      }
      else {
        // Default: assume first conjugation pattern
        return `${presentStem}o, ${presentStem}are, ${perfectStem}i, ${participleStem}um`;
      }
    } else if (stems.length >= 2) {
      // Try to construct from available stems
      const stem1 = stems[0];
      const stem2 = stems[1];
      if (declension.startsWith('1')) {
        return `${stem1}o, ${stem1}are, ${stem1}avi, ${stem1}atum`;
      } else if (declension.startsWith('6')) {
        // Irregular verbs like eo: eo, ire, ivi/ii, itum
        return `${stem1}o, ${stem2}re, ${stem1}vi, ${stem1}tum`;
      } else {
        return `${stem1}o, ${stem1}ere, ${stem1}i, ${stem1}um`;
      }
    } else {
      // Single stem - guess conjugation
      const stem = stems[0];
      if (declension.startsWith('1')) {
        return `${stem}o, ${stem}are, ${stem}avi, ${stem}atum`;
      } else {
        return `${stem}o, ${stem}ere, ${stem}i, ${stem}um`;
      }
    }
  } else if (partOfSpeech === 'ADJ') {
    // Special case for irregular adjectives with comparative/superlative
    if (stems[0] === 'mal' && stems[2] === 'pej') {
      // malus, peior, pessimus (bad, worse, worst)
      return 'malus, peior, pessimus';
    }
    
    // If we have 4 stems with all three adjective forms (skip duplicate stem)
    if (stems.length >= 4 && stems[2] && stems[3]) {
      const masc = stems[0] + 'us';
      const fem = stems[2];
      const neut = stems[3];
      return `${masc}, ${fem}, ${neut}`;
    } else if (declension === '1 1' || (declension.includes('1') && declension.includes('2'))) {
      // First/second declension adjectives
      return `${stems[0]}us, ${stems[0]}a, ${stems[0]}um`;
    } else if (declension.startsWith('3')) {
      // Third declension adjectives
      if (stems.length > 1) {
        return `${stems[1]}, ${stems[0]}is`;
      } else {
        return `${stems[0]}, ${stems[0]}is`;
      }
    } else if (declension === '9 9') {
      // Indeclinable adjectives (like satis, sat)
      const stem = stems[0];
      if (stem === 'sat') {
        return 'satis'; // "sat" should show as "satis"
      } else {
        return stem; // For other indeclinable adjectives, use the stem as-is
      }
    } else {
      return cleanForm(stems.join(', '));
    }
  } else if (partOfSpeech === 'PREP') {
    // For prepositions, check for common variants
    const stem = stems[0];
    if (stem === 'a') {
      return 'a, ab';
    } else if (stem === 'ab') {
      return 'a, ab';
    } else {
      return stem;
    }
  } else if (partOfSpeech === 'ADV') {
    // For adverbs, handle special cases
    const stem = stems[0];
    if (stem === 'sat') {
      return 'satis'; // "sat" adverb should show as "satis"
    } else {
      return stem;
    }
  } else if (partOfSpeech === 'PRON') {
    // For pronouns, show all three forms (masc, fem, neut)
    if (stems.length >= 3) {
      // Most pronouns have three forms like ille, illa, illud
      return `${stems[0]}, ${stems[1]}, ${stems[2]}`;
    } else if (stems.length === 2) {
      // Some pronouns like ego, tu just have two forms
      return `${stems[0]}, ${stems[1]}`;
    } else {
      return stems[0];
    }
  } else {
    // Other parts of speech - just return the first stem
    let result = stems[0];
    // Clean any zzz placeholders
    return cleanForm(result);
  }
}

function generateBasicInflections(entry) {
  const { stems, partOfSpeech, declension, gender } = entry;
  const forms = new Set(stems);
  const mainStem = stems[0];
  
  // Generate comprehensive inflections for better search coverage
  if (partOfSpeech === 'N') {
    if (declension.startsWith('1')) {
      // First declension (feminine): aqua, aquae
      forms.add(mainStem + 'a');      // Nom/Abl sg: aqua
      forms.add(mainStem + 'ae');     // Gen/Dat/Nom/Voc pl: aquae
      forms.add(mainStem + 'am');     // Acc sg: aquam
      forms.add(mainStem + 'as');     // Acc pl: aquas
      forms.add(mainStem + 'arum');   // Gen pl: aquarum
      forms.add(mainStem + 'is');     // Dat/Abl pl: aquis
    } else if (declension.startsWith('2')) {
      // Second declension (masculine/neuter): servus, servi / bellum, belli
      forms.add(mainStem + 'us');     // Nom sg masc: servus
      forms.add(mainStem + 'um');     // Acc sg masc / Nom/Acc sg neut: bellum
      forms.add(mainStem + 'i');      // Gen sg / Nom pl / Voc pl: servi
      forms.add(mainStem + 'o');      // Dat/Abl sg: servo
      forms.add(mainStem + 'os');     // Acc pl masc: servos
      forms.add(mainStem + 'orum');   // Gen pl: servorum
      forms.add(mainStem + 'is');     // Dat/Abl pl: servis
      forms.add(mainStem + 'a');      // Nom/Acc/Voc pl neut: bella
    } else if (declension.startsWith('3')) {
      // Third declension: rex, regis - use second stem if available
      const genitiveStem = stems.length > 1 ? stems[1] : mainStem;
      
      // Add nominative form (first stem)
      forms.add(mainStem);           // Nom sg: rex
      
      // Use genitive stem for other cases
      forms.add(genitiveStem + 'is');     // Gen sg: regis
      forms.add(genitiveStem + 'i');      // Dat sg: regi
      forms.add(genitiveStem + 'em');     // Acc sg: regem
      forms.add(genitiveStem + 'e');      // Abl sg: rege
      forms.add(genitiveStem + 'es');     // Nom/Acc pl: reges
      forms.add(genitiveStem + 'um');     // Gen pl: regum
      forms.add(genitiveStem + 'ibus');   // Dat/Abl pl: regibus
      
      // For neuter 3rd declension, add -a plural forms
      if (gender === 'N') {
        forms.add(genitiveStem + 'a');   // Nom/Acc pl neut: tempora
      }
      
      // Also try main stem variations for irregular nouns
      if (genitiveStem !== mainStem) {
        forms.add(mainStem + 'is');     // Sometimes works
        forms.add(mainStem + 'em');     // Sometimes works
        forms.add(mainStem + 'es');     // Sometimes works
      }
    }
  } else if (partOfSpeech === 'PRON') {
    // Special handling for pronouns - highly irregular
    if (mainStem === 'ego') {
      // Personal pronoun: ego (I)
      forms.add('ego');           // Nom: ego
      forms.add('mei');           // Gen: mei
      forms.add('mihi');          // Dat: mihi
      forms.add('me');            // Acc/Abl: me
    } else if (mainStem === 'tu') {
      // Personal pronoun: tu (you)
      forms.add('tu');            // Nom: tu
      forms.add('tui');           // Gen: tui
      forms.add('tibi');          // Dat: tibi
      forms.add('te');            // Acc/Abl: te
    } else if (mainStem === 'hic') {
      // Demonstrative pronoun: hic, haec, hoc (this)
      // Masculine
      forms.add('hic');           // Nom sg m: hic
      forms.add('huius');         // Gen sg: huius
      forms.add('huic');          // Dat sg: huic
      forms.add('hunc');          // Acc sg m: hunc
      forms.add('hoc');           // Abl sg m: hoc
      // Feminine
      forms.add('haec');          // Nom/Acc sg f: haec
      forms.add('hanc');          // Acc sg f: hanc
      forms.add('hac');           // Abl sg f: hac
      // Neuter
      forms.add('hoc');           // Nom/Acc sg n: hoc
      // Plural forms
      forms.add('hi');            // Nom pl m: hi
      forms.add('hae');           // Nom pl f: hae
      forms.add('haec');          // Nom/Acc pl n: haec
      forms.add('hos');           // Acc pl m: hos
      forms.add('has');           // Acc pl f: has
      forms.add('horum');         // Gen pl m/n: horum
      forms.add('harum');         // Gen pl f: harum
      forms.add('his');           // Dat/Abl pl: his
    } else if (mainStem === 'ille') {
      // Demonstrative pronoun: ille, illa, illud (that)
      // Masculine
      forms.add('ille');          // Nom sg m: ille
      forms.add('illius');        // Gen sg: illius
      forms.add('illi');          // Dat sg: illi
      forms.add('illum');         // Acc sg m: illum
      forms.add('illo');          // Abl sg m: illo
      // Feminine
      forms.add('illa');          // Nom/Acc sg f: illa
      forms.add('illam');         // Acc sg f: illam
      forms.add('illa');          // Abl sg f: illa
      // Neuter
      forms.add('illud');         // Nom/Acc sg n: illud
      forms.add('illo');          // Abl sg n: illo
      // Plural forms
      forms.add('illi');          // Nom pl m: illi
      forms.add('illae');         // Nom pl f: illae
      forms.add('illa');          // Nom/Acc pl n: illa
      forms.add('illos');         // Acc pl m: illos
      forms.add('illas');         // Acc pl f: illas
      forms.add('illorum');       // Gen pl m/n: illorum
      forms.add('illarum');       // Gen pl f: illarum
      forms.add('illis');         // Dat/Abl pl: illis
    } else if (mainStem === 'qui') {
      // Relative pronoun: qui, quae, quod (who/which)
      // Masculine
      forms.add('qui');           // Nom sg m: qui
      forms.add('cuius');         // Gen sg: cuius
      forms.add('cui');           // Dat sg: cui
      forms.add('quem');          // Acc sg m: quem
      forms.add('quo');           // Abl sg m: quo
      // Feminine
      forms.add('quae');          // Nom/Acc sg f: quae
      forms.add('quam');          // Acc sg f: quam
      forms.add('qua');           // Abl sg f: qua
      // Neuter
      forms.add('quod');          // Nom/Acc sg n: quod
      forms.add('quo');           // Abl sg n: quo
      // Plural forms
      forms.add('qui');           // Nom pl m: qui
      forms.add('quae');          // Nom pl f: quae
      forms.add('quae');          // Nom/Acc pl n: quae
      forms.add('quos');          // Acc pl m: quos
      forms.add('quas');          // Acc pl f: quas
      forms.add('quorum');        // Gen pl m/n: quorum
      forms.add('quarum');        // Gen pl f: quarum
      forms.add('quibus');        // Dat/Abl pl: quibus
    }
  } else if (partOfSpeech === 'NUM') {
    // Numbers - often irregular
    if (mainStem === 'du') {
      // Two: duo, duae, duo
      forms.add('duo');           // Nom/Acc m/n: duo
      forms.add('duae');          // Nom f: duae
      forms.add('duas');          // Acc f: duas
      forms.add('duorum');        // Gen m/n: duorum
      forms.add('duarum');        // Gen f: duarum
      forms.add('duobus');        // Dat/Abl m/n: duobus
      forms.add('duabus');        // Dat/Abl f: duabus
    } else if (mainStem === 'tre') {
      // Three: tres, tria
      forms.add('tres');          // Nom/Acc m/f: tres
      forms.add('tria');          // Nom/Acc n: tria
      forms.add('trium');         // Gen: trium
      forms.add('tribus');        // Dat/Abl: tribus
    }
  } else if (partOfSpeech === 'V') {
    // Special handling for irregular verbs
    if (declension.includes('TO_BEING') && mainStem === 'poss') {
      // possum has special forms: possum, potes, potest, etc.
      forms.add('possum');        // 1sg: possum
      forms.add('potes');         // 2sg: potes  
      forms.add('potest');        // 3sg: potest
      forms.add('possumus');      // 1pl: possumus
      forms.add('potestis');      // 2pl: potestis
      forms.add('possunt');       // 3pl: possunt
      forms.add('posse');         // infinitive: posse
      
      // Add stem forms too
      forms.add('poss');
      forms.add('pot');
      
      return Array.from(forms);
    }
    
    // Special handling for sum, esse (to be) - most irregular verb in Latin
    if (declension.includes('TO_BEING') && mainStem === 'su') {
      // Present indicative
      forms.add('sum');           // 1sg: sum (I am)
      forms.add('es');            // 2sg: es (you are)
      forms.add('est');           // 3sg: est (he/she/it is)
      forms.add('sumus');         // 1pl: sumus (we are)
      forms.add('estis');         // 2pl: estis (you all are)
      forms.add('sunt');          // 3pl: sunt (they are)
      
      // Infinitive and other forms
      forms.add('esse');          // infinitive: esse (to be)
      forms.add('eram');          // 1sg impf: eram (I was)
      forms.add('eras');          // 2sg impf: eras (you were)
      forms.add('erat');          // 3sg impf: erat (he/she/it was)
      forms.add('eramus');        // 1pl impf: eramus (we were)
      forms.add('eratis');        // 2pl impf: eratis (you all were)
      forms.add('erant');         // 3pl impf: erant (they were)
      
      // Future forms
      forms.add('ero');           // 1sg fut: ero (I will be)
      forms.add('eris');          // 2sg fut: eris (you will be)
      forms.add('erit');          // 3sg fut: erit (he/she/it will be)
      forms.add('erimus');        // 1pl fut: erimus (we will be)
      forms.add('eritis');        // 2pl fut: eritis (you all will be)
      forms.add('erunt');         // 3pl fut: erunt (they will be)
      
      // Subjunctive forms
      forms.add('sim');           // 1sg subj: sim
      forms.add('sis');           // 2sg subj: sis
      forms.add('sit');           // 3sg subj: sit
      forms.add('simus');         // 1pl subj: simus
      forms.add('sitis');         // 2pl subj: sitis
      forms.add('sint');          // 3pl subj: sint
      
      // Perfect forms
      forms.add('fui');           // 1sg perf: fui (I was/have been)
      forms.add('fuisti');        // 2sg perf: fuisti
      forms.add('fuit');          // 3sg perf: fuit
      forms.add('fuimus');        // 1pl perf: fuimus
      forms.add('fuistis');       // 2pl perf: fuistis
      forms.add('fuerunt');       // 3pl perf: fuerunt
      forms.add('fuere');         // 3pl perf alt: fuere
      
      // Participles
      forms.add('futurus');       // future participle: futurus (about to be)
      forms.add('futura');        // future participle fem: futura
      forms.add('futurum');       // future participle neut: futurum
      forms.add('ens');           // present participle: ens (being) - rare archaic
      forms.add('entis');         // present participle gen: entis
      forms.add('fore');          // future infinitive: fore (to be about to be)
      
      // Add stem forms
      forms.add('su');
      forms.add('es');
      forms.add('fu');
      forms.add('fut');
      
      return Array.from(forms);
    }
    
    // Special handling for inquam (I say) - defective verb
    if (mainStem === 'inqu') {
      forms.add('inquam');        // 1sg: inquam (I say)
      forms.add('inquis');        // 2sg: inquis (you say)
      forms.add('inquit');        // 3sg: inquit (he/she/it says)
      forms.add('inquiunt');      // 3pl: inquiunt (they say)
      forms.add('inquisti');      // 2sg perf: inquisti
      forms.add('inquii');        // 1sg perf: inquii
      
      // Add stem forms
      forms.add('inqu');
      
      return Array.from(forms);
    }
    
    // Special handling for fero, ferre (to carry) - highly irregular
    if (mainStem === 'fer') {
      // Present indicative active
      forms.add('fero');          // 1sg: fero (I carry)
      forms.add('fers');          // 2sg: fers (you carry)  
      forms.add('fert');          // 3sg: fert (he/she/it carries)
      forms.add('ferimus');       // 1pl: ferimus (we carry)
      forms.add('fertis');        // 2pl: fertis (you all carry)
      forms.add('ferunt');        // 3pl: ferunt (they carry)
      
      // Infinitives
      forms.add('ferre');         // inf: ferre (to carry)
      forms.add('ferri');         // passive inf: ferri (to be carried)
      
      // Imperfect
      forms.add('ferebam');       // 1sg impf: ferebam
      forms.add('ferebas');       // 2sg impf: ferebas
      forms.add('ferebat');       // 3sg impf: ferebat
      forms.add('ferebamus');     // 1pl impf: ferebamus
      forms.add('ferebatis');     // 2pl impf: ferebatis
      forms.add('ferebant');      // 3pl impf: ferebant
      
      // Perfect system (tuli)
      forms.add('tuli');          // 1sg perf: tuli
      forms.add('tulisti');       // 2sg perf: tulisti
      forms.add('tulit');         // 3sg perf: tulit
      forms.add('tulimus');       // 1pl perf: tulimus
      forms.add('tulistis');      // 2pl perf: tulistis
      forms.add('tulerunt');      // 3pl perf: tulerunt
      forms.add('tulere');        // 3pl perf alt: tulere
      
      // Imperative
      forms.add('fer');           // 2sg imp: fer
      forms.add('ferte');         // 2pl imp: ferte
      
      // Add stem forms
      forms.add('fer');
      forms.add('tul');
      forms.add('lat');
      
      return Array.from(forms);
    }
    
    // Special handling for nolo, nolle (to not want) - irregular compound of volo
    if (mainStem === 'nol') {
      // Present indicative
      forms.add('nolo');          // 1sg: nolo (I don't want)
      forms.add('non');           // 2sg: non vis (you don't want) - note: 'non' appears in forms
      forms.add('vult');          // 3sg: non vult -> 'vult' portion
      forms.add('nolumus');       // 1pl: nolumus (we don't want)  
      forms.add('vultis');        // 2pl: non vultis -> 'vultis' portion
      forms.add('nolunt');        // 3pl: nolunt (they don't want)
      
      // Infinitive
      forms.add('nolle');         // inf: nolle (to not want)
      
      // Imperative
      forms.add('noli');          // 2sg imp: noli (don't!)
      forms.add('nolite');        // 2pl imp: nolite (don't!)
      
      // Perfect forms
      forms.add('nolui');         // 1sg perf: nolui
      forms.add('noluisti');      // 2sg perf: noluisti
      forms.add('noluit');        // 3sg perf: noluit
      
      // Add stem forms
      forms.add('nol');
      forms.add('nolu');
      
      return Array.from(forms);
    }
    
    // Special handling for edo, edere/esse (to eat) - irregular 3rd conjugation
    if (mainStem === 'ed' && declension.startsWith('3')) {
      // Present indicative
      forms.add('edo');           // 1sg: edo (I eat)
      forms.add('edis');          // 2sg: edis (you eat)  
      forms.add('edit');          // 3sg: edit (he/she/it eats)
      forms.add('edimus');        // 1pl: edimus (we eat)
      forms.add('editis');        // 2pl: editis (you all eat)
      forms.add('edunt');         // 3pl: edunt (they eat)
      
      // Alternative forms with short stem
      forms.add('es');            // 2sg: es (you eat)
      forms.add('est');           // 3sg: est (he/she/it eats)
      forms.add('estis');         // 2pl: estis (you all eat)
      
      // Infinitives - CRITICAL: both edere and esse
      forms.add('edere');         // inf: edere (to eat)
      forms.add('esse');          // inf: esse (to eat) - irregular form
      
      // Imperative
      forms.add('ede');           // 2sg imp: ede (eat!)
      forms.add('edite');         // 2pl imp: edite (eat!)
      
      // Perfect forms
      forms.add('edi');           // 1sg perf: edi
      forms.add('edisti');        // 2sg perf: edisti
      forms.add('edit');          // 3sg perf: edit (same as present)
      
      // Participles
      forms.add('esus');          // past participle: esus
      forms.add('esa');           // past participle fem: esa
      forms.add('esum');          // past participle neut: esum
      forms.add('edendus');       // gerundive: edendus
      
      // Add stem forms
      forms.add('ed');
      forms.add('es');
      forms.add('ess');
      
      return Array.from(forms);
    }
    
    // Special handling for volo, velle (to want) - highly irregular
    if (mainStem === 'vol' && declension.includes('6') && declension.includes('2')) {
      // Present indicative for volo (irregular)
      forms.add('volo');          // 1sg: volo (I want)
      forms.add('vis');           // 2sg: vis (you want)
      forms.add('vult');          // 3sg: vult (he/she/it wants)
      forms.add('volumus');       // 1pl: volumus (we want)  
      forms.add('vultis');        // 2pl: vultis (you all want)
      forms.add('volunt');        // 3pl: volunt (they want)
      
      // Infinitive
      forms.add('velle');         // inf: velle (to want)
      
      // Imperfect
      forms.add('volebam');       // 1sg impf: volebam
      forms.add('volebas');       // 2sg impf: volebas
      forms.add('volebat');       // 3sg impf: volebat
      forms.add('volebamus');     // 1pl impf: volebamus
      forms.add('volebatis');     // 2pl impf: volebatis
      forms.add('volebant');      // 3pl impf: volebant
      
      // Perfect forms
      forms.add('volui');         // 1sg perf: volui
      forms.add('voluisti');      // 2sg perf: voluisti
      forms.add('voluit');        // 3sg perf: voluit
      forms.add('voluimus');      // 1pl perf: voluimus
      forms.add('voluistis');     // 2pl perf: voluistis
      forms.add('voluerunt');     // 3pl perf: voluerunt
      
      // Subjunctive
      forms.add('velim');         // 1sg subj: velim
      forms.add('velis');         // 2sg subj: velis
      forms.add('velit');         // 3sg subj: velit
      forms.add('velimus');       // 1pl subj: velimus
      forms.add('velitis');       // 2pl subj: velitis
      forms.add('velint');        // 3pl subj: velint
      
      // Add stem forms
      forms.add('vol');
      forms.add('vel');
      forms.add('volu');
      
      return Array.from(forms);
    }
    
    // === CONJUGATION-SPECIFIC FORMS ===
    if (declension.startsWith('1')) {
      // First conjugation: amare, amari
      
      // Present Active Indicative  
      forms.add(mainStem + 'o');        // 1sg: amo
      forms.add(mainStem + 'as');       // 2sg: amas
      forms.add(mainStem + 'at');       // 3sg: amat
      forms.add(mainStem + 'amus');     // 1pl: amamus
      forms.add(mainStem + 'atis');     // 2pl: amatis
      forms.add(mainStem + 'ant');      // 3pl: amant
      
      // Present Passive Indicative
      forms.add(mainStem + 'or');       // 1sg: amor
      forms.add(mainStem + 'aris');     // 2sg: amaris
      forms.add(mainStem + 'atur');     // 3sg: amatur
      forms.add(mainStem + 'amur');     // 1pl: amamur
      forms.add(mainStem + 'amini');    // 2pl: amamini
      forms.add(mainStem + 'antur');    // 3pl: amantur
      
      // Infinitives
      forms.add(mainStem + 'are');      // Present active infinitive
      forms.add(mainStem + 'ari');      // Present passive infinitive
      
      // Imperfect indicative
      forms.add(mainStem + 'abam');     // 1sg: amabam
      forms.add(mainStem + 'abas');     // 2sg: amabas  
      forms.add(mainStem + 'abat');     // 3sg: amabat
      forms.add(mainStem + 'abamus');   // 1pl: amabamus
      forms.add(mainStem + 'abatis');   // 2pl: amabatis
      forms.add(mainStem + 'abant');    // 3pl: amabant
      
      // Future indicative
      forms.add(mainStem + 'abo');      // 1sg: amabo
      forms.add(mainStem + 'abis');     // 2sg: amabis
      forms.add(mainStem + 'abit');     // 3sg: amabit
      forms.add(mainStem + 'abimus');   // 1pl: amabimus
      forms.add(mainStem + 'abitis');   // 2pl: amabitis
      forms.add(mainStem + 'abunt');    // 3pl: amabunt
      
      // Present subjunctive
      forms.add(mainStem + 'em');       // 1sg: amem
      forms.add(mainStem + 'es');       // 2sg: ames
      forms.add(mainStem + 'et');       // 3sg: amet
      forms.add(mainStem + 'emus');     // 1pl: amemus
      forms.add(mainStem + 'etis');     // 2pl: ametis
      forms.add(mainStem + 'ent');      // 3pl: ament
      
      // Imperative
      forms.add(mainStem + 'a');        // 2sg: ama
      forms.add(mainStem + 'ate');      // 2pl: amate
      
    } else if (declension.startsWith('2')) {
      // Second conjugation: habere, haberi
      
      // Present Active Indicative  
      forms.add(mainStem + 'eo');       // 1sg: habeo
      forms.add(mainStem + 'es');       // 2sg: habes
      forms.add(mainStem + 'et');       // 3sg: habet
      forms.add(mainStem + 'emus');     // 1pl: habemus
      forms.add(mainStem + 'etis');     // 2pl: habetis
      forms.add(mainStem + 'ent');      // 3pl: habent
      
      // Present Passive Indicative
      forms.add(mainStem + 'eor');      // 1sg: habeor
      forms.add(mainStem + 'eris');     // 2sg: haberis
      forms.add(mainStem + 'etur');     // 3sg: habetur
      forms.add(mainStem + 'emur');     // 1pl: habemur
      forms.add(mainStem + 'emini');    // 2pl: habemini
      forms.add(mainStem + 'entur');    // 3pl: habentur
      
      // Infinitives
      forms.add(mainStem + 'ere');      // Present active infinitive
      forms.add(mainStem + 'eri');      // Present passive infinitive
      
      // Imperfect
      forms.add(mainStem + 'ebam');     // 1sg: habebam
      forms.add(mainStem + 'ebas');     // 2sg: habebas
      forms.add(mainStem + 'ebat');     // 3sg: habebat
      forms.add(mainStem + 'ebamus');   // 1pl: habebamus
      forms.add(mainStem + 'ebatis');   // 2pl: habebatis
      forms.add(mainStem + 'ebant');    // 3pl: habebant
      
      // Future
      forms.add(mainStem + 'ebo');      // 1sg: habebo
      forms.add(mainStem + 'ebis');     // 2sg: habebis
      forms.add(mainStem + 'ebit');     // 3sg: habebit
      forms.add(mainStem + 'ebimus');   // 1pl: habebimus
      forms.add(mainStem + 'ebitis');   // 2pl: habebitis
      forms.add(mainStem + 'ebunt');    // 3pl: habebunt
      
      // Present subjunctive
      forms.add(mainStem + 'eam');      // 1sg: habeam
      forms.add(mainStem + 'eas');      // 2sg: habeas
      forms.add(mainStem + 'eat');      // 3sg: habeat
      forms.add(mainStem + 'eamus');    // 1pl: habeamus
      forms.add(mainStem + 'eatis');    // 2pl: habeatis
      forms.add(mainStem + 'eant');     // 3pl: habeant
      
      // Imperative
      forms.add(mainStem + 'e');        // 2sg: habe
      forms.add(mainStem + 'ete');      // 2pl: habete
      
    } else if (declension.startsWith('3')) {
      // Third conjugation: ducere, duci
      // Check if this is a deponent verb (DEP marker)
      const isDeponent = declension.includes('DEP');
      
      // Special handling for quaeso - add missing perfect/supine forms
      if (mainStem === 'quaes') {
        // Add perfect system forms that are missing due to "zzz" placeholders
        forms.add('quaesivi');        // 1sg perfect: quaesivi (I begged)
        forms.add('quaesivisti');     // 2sg perfect: quaesivisti
        forms.add('quaesivit');       // 3sg perfect: quaesivit
        forms.add('quaesivimus');     // 1pl perfect: quaesivimus
        forms.add('quaesivistis');    // 2pl perfect: quaesivistis
        forms.add('quaesiverunt');    // 3pl perfect: quaesiverunt
        forms.add('quaesivere');      // 3pl perfect alt: quaesivere
        
        // Alternative perfect forms (quaesii)
        forms.add('quaesii');         // 1sg perfect: quaesii
        forms.add('quaesiisti');      // 2sg perfect: quaesiisti
        forms.add('quaesiit');        // 3sg perfect: quaesiit
        
        // Supine forms
        forms.add('quaesitum');       // supine: quaesitum
        forms.add('quaesitus');       // perfect passive participle: quaesitus
        forms.add('quaesita');        // perfect passive participle fem: quaesita
        forms.add('quaesitum');       // perfect passive participle neut: quaesitum
      }
      
      if (!isDeponent) {
        // Regular (non-deponent) 3rd conjugation verbs - generate active forms
        
        // Check if this is a 3rd conjugation -io verb (like facio, capio)
        if (mainStem.endsWith('i')) {
          // 3rd conjugation -io verbs (facio, capio)
          const shortStem = mainStem.slice(0, -1);  // faci -> fac
          
          // Present Active Indicative  
          forms.add(mainStem + 'o');      // 1sg: facio
          forms.add(mainStem + 's');      // 2sg: facis (not "faciis")
          forms.add(mainStem + 't');      // 3sg: facit 
          forms.add(mainStem + 'mus');    // 1pl: facimus
          forms.add(mainStem + 'tis');    // 2pl: facitis
          forms.add(mainStem + 'unt');    // 3pl: faciunt
          
          // Also add short stem forms for some cases
          forms.add(shortStem + 'is');    // 2sg: facis
          forms.add(shortStem + 'it');    // 3sg: facit  
          forms.add(shortStem + 'imus');  // 1pl: facimus
          forms.add(shortStem + 'itis');  // 2pl: facitis
          
        } else {
          // Regular 3rd conjugation verbs (duco, duco)
          // Present Active Indicative  
          forms.add(mainStem + 'o');      // 1sg: duco
          forms.add(mainStem + 'is');     // 2sg: ducis
          forms.add(mainStem + 'it');     // 3sg: ducit
          forms.add(mainStem + 'imus');   // 1pl: ducimus
          forms.add(mainStem + 'itis');   // 2pl: ducitis
          forms.add(mainStem + 'unt');    // 3pl: ducunt
        }
      }
      
      // Present Passive Indicative (for both regular and deponent verbs)
      // For deponent verbs, these are the ONLY forms (passive form, active meaning)
      // For regular verbs, these are additional passive forms
      
      // Special case for morior (die) - uses shorter stem "mor" for some forms
      if (mainStem === 'mori' && isDeponent) {
        const shortStem = 'mor';  // Use "mor" instead of "mori"
        forms.add(shortStem + 'ior');     // 1sg: morior
        forms.add(shortStem + 'eris');    // 2sg: moreris  
        forms.add(shortStem + 'itur');    // 3sg: moritur ⭐ TARGET
        forms.add(shortStem + 'imur');    // 1pl: morimur
        forms.add(shortStem + 'imini');   // 2pl: morimini
        forms.add(shortStem + 'iuntur');  // 3pl: moriuntur
      } else {
        // For 3rd conjugation deponent verbs, use the second stem for passive forms
        let stemForPassive = mainStem;
        if (isDeponent && stems.length > 1 && stems[1]) {
          // Use second stem for deponent verbs: pati, pat -> use 'pat'
          stemForPassive = stems[1];
        }
        
        forms.add(mainStem + 'or');             // 1sg: patior (use first stem for -or)
        forms.add(stemForPassive + 'eris');     // 2sg: pateris (use second stem)
        forms.add(stemForPassive + 'itur');     // 3sg: patitur ⭐ TARGET
        forms.add(stemForPassive + 'imur');     // 1pl: patimur
        forms.add(stemForPassive + 'imini');    // 2pl: patimini
        forms.add(stemForPassive + 'untur');    // 3pl: patiuntur
      }
      
      // Infinitives
      forms.add(mainStem + 'ere');      // Present active infinitive
      forms.add(mainStem + 'i');        // Present passive infinitive
      
      // Imperfect
      forms.add(mainStem + 'ebam');     // 1sg: ducebam
      forms.add(mainStem + 'ebas');     // 2sg: ducebas
      forms.add(mainStem + 'ebat');     // 3sg: ducebat
      forms.add(mainStem + 'ebamus');   // 1pl: ducebamus
      forms.add(mainStem + 'ebatis');   // 2pl: ducebatis
      forms.add(mainStem + 'ebant');    // 3pl: ducebant
      
      // Future
      forms.add(mainStem + 'am');       // 1sg: ducam
      forms.add(mainStem + 'es');       // 2sg: duces
      forms.add(mainStem + 'et');       // 3sg: ducet
      forms.add(mainStem + 'emus');     // 1pl: ducemus
      forms.add(mainStem + 'etis');     // 2pl: ducetis
      forms.add(mainStem + 'ent');      // 3pl: ducent
      
      // Present subjunctive
      forms.add(mainStem + 'am');       // 1sg: ducam
      forms.add(mainStem + 'as');       // 2sg: ducas
      forms.add(mainStem + 'at');       // 3sg: ducat
      forms.add(mainStem + 'amus');     // 1pl: ducamus
      forms.add(mainStem + 'atis');     // 2pl: ducatis
      forms.add(mainStem + 'ant');      // 3pl: ducant
      
      // Imperative
      forms.add(mainStem + 'e');        // 2sg: duce
      forms.add(mainStem + 'ite');      // 2pl: ducite
      
    } else if (declension.startsWith('4')) {
      // Fourth conjugation: audire, audiri
      
      // Present Active Indicative  
      forms.add(mainStem + 'io');       // 1sg: audio
      forms.add(mainStem + 'is');       // 2sg: audis
      forms.add(mainStem + 'it');       // 3sg: audit
      forms.add(mainStem + 'imus');     // 1pl: audimus
      forms.add(mainStem + 'itis');     // 2pl: auditis
      forms.add(mainStem + 'iunt');     // 3pl: audiunt
      
      // Present Passive Indicative
      forms.add(mainStem + 'ior');      // 1sg: audior
      forms.add(mainStem + 'iris');     // 2sg: audiris
      forms.add(mainStem + 'itur');     // 3sg: auditur
      forms.add(mainStem + 'imur');     // 1pl: audimur
      forms.add(mainStem + 'imini');    // 2pl: audimini
      forms.add(mainStem + 'iuntur');   // 3pl: audiuntur
      
      // Infinitives
      forms.add(mainStem + 'ire');      // Present active infinitive
      forms.add(mainStem + 'iri');      // Present passive infinitive
      
      // Imperfect
      forms.add(mainStem + 'iebam');    // 1sg: audiebam
      forms.add(mainStem + 'iebas');    // 2sg: audiebas
      forms.add(mainStem + 'iebat');    // 3sg: audiebat
      forms.add(mainStem + 'iebamus');  // 1pl: audiebamus
      forms.add(mainStem + 'iebatis');  // 2pl: audiebatis
      forms.add(mainStem + 'iebant');   // 3pl: audiebant
      
      // Future
      forms.add(mainStem + 'iam');      // 1sg: audiam
      forms.add(mainStem + 'ies');      // 2sg: audies
      forms.add(mainStem + 'iet');      // 3sg: audiet
      forms.add(mainStem + 'iemus');    // 1pl: audiemus
      forms.add(mainStem + 'ietis');    // 2pl: audietis
      forms.add(mainStem + 'ient');     // 3pl: audient
      
      // Present subjunctive
      forms.add(mainStem + 'iam');      // 1sg: audiam
      forms.add(mainStem + 'ias');      // 2sg: audias
      forms.add(mainStem + 'iat');      // 3sg: audiat
      forms.add(mainStem + 'iamus');    // 1pl: audiamus
      forms.add(mainStem + 'iatis');    // 2pl: audiatis
      forms.add(mainStem + 'iant');     // 3pl: audiant
      
      // Imperative
      forms.add(mainStem + 'i');        // 2sg: audi
      forms.add(mainStem + 'ite');      // 2pl: audite
      
    } else if (declension.startsWith('6')) {
      // Special case for malo (prefer)
      if (mainStem === 'mal' && declension.includes('6') && declension.includes('2')) {
        forms.add('malo');              // 1sg: malo (I prefer)
        forms.add('mavis');             // 2sg: mavis (you prefer)  
        forms.add('mavult');            // 3sg: mavult (he/she/it prefers) ⭐ TARGET
        forms.add('malumus');           // 1pl: malumus (we prefer)
        forms.add('mavultis');          // 2pl: mavultis (you all prefer)
        forms.add('malunt');            // 3pl: malunt (they prefer)
        forms.add('malle');             // infinitive: malle (to prefer)
        
        // Also add stem forms for recognition
        forms.add('mal');               // stem form
        forms.add('malu');              // perfect stem
      } else {
        // 6th conjugation irregular verbs like eo, odeo, etc.
        if (mainStem === 'e') {
          // Special case for eo (go): eo, ire, ivi/ii, itum - highly irregular forms
          forms.add('eo');                  // 1sg: eo (I go)
          forms.add('is');                  // 2sg: is (you go) - not "eis"!
          forms.add('it');                  // 3sg: it (he/she/it goes) - not "eit"!
          forms.add('imus');                // 1pl: imus (we go) - not "eimus"!
          forms.add('itis');                // 2pl: itis (you all go) - not "eitis"!
          forms.add('eunt');                // 3pl: eunt (they go)
        } else {
          // Other 6th conjugation verbs like odeo: use stem + o pattern
          forms.add(mainStem + 'o');        // 1sg: odeo (I hate)
          forms.add(mainStem + 's');        // 2sg: odes (you hate)  
          forms.add(mainStem + 't');        // 3sg: odet (he/she/it hates)
          forms.add(mainStem + 'mus');      // 1pl: odemus (we hate)
          forms.add(mainStem + 'tis');      // 2pl: odetis (you all hate)
          forms.add(mainStem + 'nt');       // 3pl: odent (they hate)
          
          // Also add forms with 'i' for some 6th conjugation patterns
          forms.add(mainStem + 'is');       // 2sg alt: odis
          forms.add(mainStem + 'it');       // 3sg alt: odit  
          forms.add(mainStem + 'imus');     // 1pl alt: odimus
          forms.add(mainStem + 'itis');     // 2pl alt: oditis
          forms.add(mainStem + 'unt');      // 3pl alt: odunt
        }
        
        // Infinitive - use second stem if available
        if (stems.length >= 2 && stems[1]) {
          forms.add(stems[1] + 're');     // ire
        } else {
          forms.add(mainStem + 'ire');    // fallback
        }
        
        // Imperfect (uses i- stem)
        forms.add('ibam');                // 1sg: ibam
        forms.add('ibas');                // 2sg: ibas
        forms.add('ibat');                // 3sg: ibat
        forms.add('ibamus');              // 1pl: ibamus
        forms.add('ibatis');              // 2pl: ibatis
        forms.add('ibant');               // 3pl: ibant
        
        // Future (uses i- stem)
        forms.add('ibo');                 // 1sg: ibo
        forms.add('ibis');                // 2sg: ibis
        forms.add('ibit');                // 3sg: ibit
        forms.add('ibimus');              // 1pl: ibimus
        forms.add('ibitis');              // 2pl: ibitis
        forms.add('ibunt');               // 3pl: ibunt
        
        // Present subjunctive
        forms.add(mainStem + 'am');       // 1sg: eam
        forms.add(mainStem + 'as');       // 2sg: eas
        forms.add(mainStem + 'at');       // 3sg: eat
        forms.add(mainStem + 'amus');     // 1pl: eamus
        forms.add(mainStem + 'atis');     // 2pl: eatis
        forms.add(mainStem + 'ant');      // 3pl: eant
        
        // Imperative
        forms.add(mainStem);              // 2sg: i
        forms.add(mainStem + 'te');       // 2pl: ite
      }
      
    } else if (declension.startsWith('7')) {
      // Seventh conjugation: defective verbs like aio (say)
      // These verbs only have certain forms, often just 3rd person
      
      // Special case for aio (say)
      if (mainStem === 'ai') {
        forms.add('aio');                 // 1sg: aio (I say)
        forms.add('ais');                 // 2sg: ais (you say)
        forms.add('ait');                 // 3sg: ait (he/she/it says) ⭐ COMMON
        forms.add('aiunt');               // 3pl: aiunt (they say) ⭐ COMMON
        
        // Also use second stem 'a' for some forms
        if (stems.length > 1 && stems[1] === 'a') {
          forms.add('a');                 // imperative: a! (say!)
        }
      } else {
        // Generic 7th conjugation defective verb patterns
        forms.add(mainStem + 'o');        // 1sg: mainStem + o
        forms.add(mainStem + 's');        // 2sg: mainStem + s  
        forms.add(mainStem + 't');        // 3sg: mainStem + t
        forms.add(mainStem + 'unt');      // 3pl: mainStem + unt
      }
      
    } else {
      // Default patterns for unknown conjugations
      forms.add(mainStem + 'are');
      forms.add(mainStem + 'ere');
      forms.add(mainStem + 'ire');
    }
    
    // === PERFECT SYSTEM === (if perfect stem available)
    if (stems.length >= 3 && stems[2]) {
      const perfectStem = stems[2];
      
      // Special handling for PERFDEF verbs (perfect forms with present meaning)
      if (declension.includes('PERFDEF')) {
        // PERFDEF verbs like memini - perfect forms function as present
        forms.add(perfectStem + 'i');         // 1sg: memini (I remember)
        forms.add(perfectStem + 'isti');      // 2sg: meministi (you remember)
        forms.add(perfectStem + 'it');        // 3sg: meminit (he/she/it remembers)
        forms.add(perfectStem + 'imus');      // 1pl: meminimus (we remember)
        forms.add(perfectStem + 'istis');     // 2pl: meministis (you all remember)
        forms.add(perfectStem + 'erunt');     // 3pl: meminerunt (they remember)
        
        // PERFDEF imperatives are very important
        // For memini: memin + to = memento (not meminento)
        const imperativeStem = perfectStem.endsWith('in') ? perfectStem.slice(0, -2) : perfectStem;
        forms.add(imperativeStem + 'ento');   // imperative: memento! (remember!) ⭐ TARGET
        forms.add(imperativeStem + 'entote'); // imperative pl: mementote! (remember!)
        
        // Also add root forms for recognition
        forms.add(perfectStem);               // stem form: memin
      } else {
        // Regular perfect system
        // Perfect Active Indicative
        forms.add(perfectStem + 'i');         // 1sg: amavi
        forms.add(perfectStem + 'isti');      // 2sg: amavisti
        forms.add(perfectStem + 'it');        // 3sg: amavit
        forms.add(perfectStem + 'imus');      // 1pl: amavimus
        forms.add(perfectStem + 'istis');     // 2pl: amavistis
        forms.add(perfectStem + 'erunt');     // 3pl: amaverunt
        forms.add(perfectStem + 'ere');       // 3pl alt: amavere
        
        // Pluperfect
        forms.add(perfectStem + 'eram');      // 1sg: amaveram
        forms.add(perfectStem + 'eras');      // 2sg: amaveras
        forms.add(perfectStem + 'erat');      // 3sg: amaverat
        forms.add(perfectStem + 'eramus');    // 1pl: amaveramus
        forms.add(perfectStem + 'eratis');    // 2pl: amaveratis
        forms.add(perfectStem + 'erant');     // 3pl: amaverant
        
        // Future Perfect
        forms.add(perfectStem + 'ero');       // 1sg: amavero
        forms.add(perfectStem + 'eris');      // 2sg: amaveris
        forms.add(perfectStem + 'erit');      // 3sg: amaverit
        forms.add(perfectStem + 'erimus');    // 1pl: amaverimus
        forms.add(perfectStem + 'eritis');    // 2pl: amaveritis
        forms.add(perfectStem + 'erint');     // 3pl: amaverint
        
        // Perfect Subjunctive
        forms.add(perfectStem + 'erim');      // 1sg: amaverim
        forms.add(perfectStem + 'eris');      // 2sg: amaveris
        forms.add(perfectStem + 'erit');      // 3sg: amaverit
        forms.add(perfectStem + 'erimus');    // 1pl: amaverimus
        forms.add(perfectStem + 'eritis');    // 2pl: amaveritis
        forms.add(perfectStem + 'erint');     // 3pl: amaverint
        
        // Perfect infinitives
        forms.add(perfectStem + 'isse');      // Perfect active infinitive: amavisse
      }
    }
    
    // === PARTICIPLES AND VERBAL NOUNS ===
    if (stems.length >= 4 && stems[3]) {
      const participleStem = stems[3];
      
      // Perfect Passive Participle (all genders and cases)
      forms.add(participleStem + 'us');     // Nom sg masc: amatus
      forms.add(participleStem + 'a');      // Nom sg fem: amata
      forms.add(participleStem + 'um');     // Nom sg neut: amatum
      forms.add(participleStem + 'i');      // Gen sg masc: amati
      forms.add(participleStem + 'ae');     // Gen sg fem: amatae
      forms.add(participleStem + 'o');      // Dat sg masc: amato
      forms.add(participleStem + 'am');     // Acc sg fem: amatam
      forms.add(participleStem + 'is');     // Dat/Abl pl: amatis
      forms.add(participleStem + 'os');     // Acc pl masc: amatos
      forms.add(participleStem + 'as');     // Acc pl fem: amatas
      
      // Supine and Gerund forms
      forms.add(participleStem + 'um');     // Supine: amatum
      forms.add(participleStem + 'u');      // Supine ablative: amatu
    }
    
    // Present Participle (if we can form it)
    forms.add(mainStem + 'ans');           // Nom sg: amans
    forms.add(mainStem + 'antis');         // Gen sg: amantis
    forms.add(mainStem + 'anti');          // Dat sg: amanti
    forms.add(mainStem + 'antem');         // Acc sg: amantem
    forms.add(mainStem + 'ante');          // Abl sg: amante
    forms.add(mainStem + 'antes');         // Nom/Acc pl: amantes
    forms.add(mainStem + 'antium');        // Gen pl: amantium
    forms.add(mainStem + 'antibus');       // Dat/Abl pl: amantibus
  } else if (partOfSpeech === 'ADJ') {
    if ((declension.includes('1') && declension.includes('2')) || declension === '1 1') {
      // First/Second declension adjectives: bonus, bona, bonum
      
      // Masculine forms (2nd declension)
      forms.add(mainStem + 'us');       // Nom sg: bonus
      forms.add(mainStem + 'i');        // Gen sg: boni
      forms.add(mainStem + 'o');        // Dat/Abl sg: bono
      forms.add(mainStem + 'um');       // Acc sg: bonum
      forms.add(mainStem + 'i');        // Nom/Voc pl: boni
      forms.add(mainStem + 'orum');     // Gen pl: bonorum
      forms.add(mainStem + 'is');       // Dat/Abl pl: bonis
      forms.add(mainStem + 'os');       // Acc pl: bonos
      
      // Feminine forms (1st declension)
      forms.add(mainStem + 'a');        // Nom sg: bona
      forms.add(mainStem + 'ae');       // Gen/Dat sg, Nom/Voc pl: bonae
      forms.add(mainStem + 'am');       // Acc sg: bonam
      forms.add(mainStem + 'as');       // Acc pl: bonas
      forms.add(mainStem + 'arum');     // Gen pl: bonarum
      
      // Neuter forms (2nd declension)
      forms.add(mainStem + 'um');       // Nom/Acc/Voc sg: bonum
      forms.add(mainStem + 'a');        // Nom/Acc/Voc pl: bona
      
    } else if (declension.startsWith('3')) {
      // Third declension adjectives: fortis, forte
      
      // Masculine/Feminine forms
      forms.add(mainStem + 'is');       // Nom sg m/f: fortis
      forms.add(mainStem + 'is');       // Gen sg: fortis
      forms.add(mainStem + 'i');        // Dat sg: forti
      forms.add(mainStem + 'em');       // Acc sg: fortem
      forms.add(mainStem + 'i');        // Abl sg: forti
      forms.add(mainStem + 'es');       // Nom/Acc pl m/f: fortes
      forms.add(mainStem + 'ium');      // Gen pl: fortium
      forms.add(mainStem + 'ibus');     // Dat/Abl pl: fortibus
      
      // Neuter forms
      forms.add(mainStem + 'e');        // Nom/Acc/Voc sg neut: forte
      forms.add(mainStem + 'ia');       // Nom/Acc/Voc pl neut: fortia
      
    } else {
      // Default adjective forms
      forms.add(mainStem + 'us');
      forms.add(mainStem + 'a');
      forms.add(mainStem + 'um');
      forms.add(mainStem + 'i');
      forms.add(mainStem + 'is');
      forms.add(mainStem + 'e');
    }
  }
  
  return Array.from(forms);
}

function processOptimized() {
  console.log('🔄 Creating optimized morphological index...');
  
  if (!fs.existsSync(DICTLINE_FILE)) {
    console.error(`❌ Dictionary file not found: ${DICTLINE_FILE}`);
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(DICTLINE_FILE, 'utf8');
  const lines = rawData.split('\n');
  
  // Add missing critical entries that should be in Whitaker's Words - PROCESS FIRST FOR PRIORITY
  const missingEntries = [
    'im                 im                 ima                imum               ADJ    1 1 SUPER        X X X A O          lowest, deepest, bottommost; last, extreme; most humble/ignoble;',
    'con                con                conav              conat              V      1 1 DEP          X X X B O          attempt/try/endeavor, make an effort; exert oneself; try to go/rise/speak;',
    // Essential irregular verbs that were being filtered
    'poss               pot                potu               zzz                V      5 2 TO_BEING     X X X A O          be able, can; [multum posse => have much/more/most influence/power];',
    'vol                vel                volu               zzz                V      6 2 X            X X X A O          wish, want, prefer; be willing, will;',
    'fi                 f                  zzz                fact               V      3 3 SEMIDEP      X X X A O          be made/become; (facio PASS); [fiat => so be it, very well; it is being done];',
    'e                  i                  iv                 it                 V      6 1 X            X X X A O          go, walk; march, advance; pass; flow; pass (time); ride; sail;',
    // Most critical missing verb: sum, esse (to be)
    'su                 es                 fu                 fut                V      5 1 TO_BEING     X X X A O          be; exist; (archaic INF esse, FUT INFINITIVE fore);',
    // Missing inquam (I say) - defective verb
    'inqu               inqu               zzz                zzz                V      7 1 X            X X X A O          say (defective), assert; say yes/so, affirm, assent; [inquam, inquis, inquit];',
    // Missing edo (to eat) forms that are being confused with esse
    'ed                 ed                 ed                 es                 V      3 1 TRANS        X X X A O          eat/consume/devour; eat away (fire/water/disease); destroy; spend money on food;',
    'ed                 ed                 ed                 ess                V      3 1 TRANS        X X X A O          eat/consume/devour; eat away (fire/water/disease); destroy; spend money on food;',
    // Add missing fero, ferre (to carry) with correct irregular forms
    'fer                fer                tul                lat                V      3 2 TRANS        X X X A O          bear, carry, bring; suffer, endure, tolerate; say, speak; obtain;',
    // Add missing nolo, nolle (to not want)
    'nol                nol                nolu               zzz                V      6 2 X            X X X A O          be unwilling; wish not to; refuse;',
    // Add essential pronouns
    'ego                mei                                                       PRON   5 1 X            X X X A O          I, me, myself; (personal pronoun)',
    'tu                 tui                                                       PRON   5 1 X            X X X A O          you (singular); (personal pronoun)',
    'hic                haec               hoc                                    PRON   3 1 X            X X X A O          this (near speaker); he, she, it; these, those; the latter',
    'ille               illa               illud                                  PRON   9 8 X            X X X A O          that (over there); he, she, it; those; the former',
    'qui                quae               quod                                   PRON   1 0 X            X X X A O          who, which, that; whoever, whatever, whichever',
    // Add essential numbers
    'du                 du                 du                 du                 NUM    2 2 X            X X X A O          two; II (Roman numeral)',
    'tre                tre                tre                tre                NUM    3 3 X            X X X A O          three; III (Roman numeral)',
    // Add common adverbs that are missing
    'iam                                                                          ADV    POS              X X X C O          now, already, by this time; soon, at length; at last'
  ];
  
  // Process custom entries FIRST to give them priority in morphological index
  const allLines = [...missingEntries, ...lines];
  
  const morphIndex = {};
  const dictEntries = [];
  let processed = 0;
  let included = 0;
  const entryDeduplication = new Map(); // Track entries by stems + meaning for deduplication
  
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    if (!line || line.length < 110) continue;
    
    const stems = line.substring(0, 75).trim();
    const posInfo = line.substring(76, 100).trim();
    const meaning = line.substring(110).trim();
    
    if (!stems || !meaning) continue;
    
    const stemArray = stems.split(/\s+/).filter(s => s.length > 0);
    const posParts = posInfo.split(/\s+/).filter(s => s.length > 0);
    const partOfSpeech = posParts[0] || '';
    
    // Filter out invalid entries first
    if (!isValidEntry(stemArray, meaning)) {
      processed++;
      continue;
    }
    
    // User wants EVERYTHING - include ALL valid entries without priority filtering
    // Only filter out truly invalid entries (errors, test data, etc.)
    const isInvalidEntry = meaning.includes('(error for') ||
                          meaning.includes('unknown meaning') ||
                          meaning.includes('misspelling of') ||
                          meaning.includes('zzz') ||
                          meaning.includes('test entry');
    
    if (isInvalidEntry) {
      processed++;
      continue;
    }
    // Include everything else - comprehensive coverage
    
    const posDisplay = POS_MAPPING[partOfSpeech] || partOfSpeech;
    
    let declension = '';
    let gender = '';
    if (posParts.length > 1) {
      if (partOfSpeech === 'N') {
        declension = posParts[1] + (posParts[2] ? ` ${posParts[2]}` : '');
        gender = posParts[3] || '';
      } else if (partOfSpeech === 'V') {
        declension = posParts[1] + (posParts[2] ? ` ${posParts[2]}` : '');
        // Include additional verb type info (DEP, TO_BEING, SEMIDEP, PERFDEF, etc.)
        if (posParts.length > 3) {
          for (let i = 3; i < posParts.length; i++) {
            if (posParts[i] && ['DEP', 'TO_BEING', 'SEMIDEP', 'PERFDEF', 'IMPERS', 'INTRANS', 'TRANS'].includes(posParts[i])) {
              declension += ` ${posParts[i]}`;
            }
          }
        }
      } else if (partOfSpeech === 'ADJ') {
        declension = posParts[1] + (posParts[2] ? ` ${posParts[2]}` : '');
      }
    }
    
    let cleanMeaning = meaning
      .replace(/\|/g, '; ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[;\s]+/, '')
      .replace(/[;\s]+$/, '');
    
    const entry = {
      id: included,
      stems: stemArray,
      mainStem: stemArray[0],
      partOfSpeech: partOfSpeech,
      partOfSpeechDisplay: posDisplay,
      declension: declension,
      gender: gender,
      meaning: cleanMeaning,
      dictionaryForm: ''
    };
    
    entry.dictionaryForm = createDictionaryForm(entry);
    
    // Check for duplicates based on stems + meaning + part of speech
    const deduplicationKey = `${stemArray.join('|')}::${partOfSpeech}::${cleanMeaning}`;
    const existingEntry = entryDeduplication.get(deduplicationKey);
    
    if (existingEntry) {
      // Count zzz placeholders in both entries
      const currentZzzCount = stemArray.filter(s => s === 'zzz' || s === 'xxx').length;
      const existingZzzCount = existingEntry.stems.filter(s => s === 'zzz' || s === 'xxx').length;
      
      // If current entry has fewer placeholders, replace the existing one
      if (currentZzzCount < existingZzzCount) {
        // Remove old entry from morphIndex
        const oldInflections = generateBasicInflections(existingEntry);
        for (const form of oldInflections) {
          const normalizedForm = form.toLowerCase();
          if (morphIndex[normalizedForm]) {
            morphIndex[normalizedForm] = morphIndex[normalizedForm].filter(id => id !== existingEntry.id);
            if (morphIndex[normalizedForm].length === 0) {
              delete morphIndex[normalizedForm];
            }
          }
        }
        
        // Replace in dictEntries array
        dictEntries[existingEntry.id] = entry;
        entry.id = existingEntry.id;
        entryDeduplication.set(deduplicationKey, entry);
        
        // Add new inflections
        const inflectedForms = generateBasicInflections(entry);
        for (const form of inflectedForms) {
          const normalizedForm = form.toLowerCase();
          if (!morphIndex[normalizedForm]) {
            morphIndex[normalizedForm] = [];
          }
          morphIndex[normalizedForm].push(entry.id);
        }
      }
      // If existing entry is better or equal, skip current entry
      processed++;
      continue;
    } else {
      // New entry - add normally
      entry.id = included;
      entryDeduplication.set(deduplicationKey, entry);
      dictEntries.push(entry);
      
      // Generate inflections and add to index
      const inflectedForms = generateBasicInflections(entry);
      
      for (const form of inflectedForms) {
        const normalizedForm = form.toLowerCase();
        if (!morphIndex[normalizedForm]) {
          morphIndex[normalizedForm] = [];
        }
        morphIndex[normalizedForm].push(included);
      }
      
      included++;
    }
    
    processed++;
    
    if (processed % 5000 === 0) {
      console.log(`⏳ Processed ${processed} entries, included ${included}...`);
    }
  }
  
  console.log(`✅ Created optimized index with ${included} entries`);
  console.log(`📊 Index covers ${Object.keys(morphIndex).length} word forms`);
  console.log(`🎯 Filtered from ${processed} total entries`);
  
  const outputData = {
    metadata: {
      source: 'Whitaker\'s Words Optimized Index',
      processed: new Date().toISOString(),
      totalEntries: included,
      totalForms: Object.keys(morphIndex).length,
      version: '2.1.0-optimized'
    },
    entries: dictEntries,
    morphIndex: morphIndex
  };
  
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
  console.log(`💾 Saved optimized index to: ${OUTPUT_FILE}`);
  
  // Test lookups
  console.log('\\n🔍 Testing optimized lookups:');
  const testWords = ['amo', 'aqua', 'bonus', 'terra', 'vir'];
  for (const word of testWords) {
    const results = morphIndex[word.toLowerCase()];
    if (results && results.length > 0) {
      const entry = dictEntries[results[0]];
      console.log(`${word} → ${entry.dictionaryForm} (${entry.partOfSpeechDisplay})`);
    } else {
      console.log(`${word} → Not found`);
    }
  }
}

if (require.main === module) {
  processOptimized();
}
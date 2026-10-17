/*
 * Auto-staging: turns a plain story draft into a full, playable story.json — no AI needed for this part.
 *   draft = { title, world: 'toon'|'people', hero, cast: [{ id, preset, label }],
 *             scenes: [{ title, place, narration, characters: [ids], objects: [names], mood, weather, talking }] }
 *   stage(draft, catalog, { toonPresets, peoplePresets }) → { story, report }
 * Everything it decides (positions, actions, expressions, props, camera shots, counter, rain…) is just JSON,
 * so the studio editor can change any of it afterwards. report.missing lists things the catalog doesn't have,
 * each with substitutes, so the Build step can ask: build it / use a substitute / skip.
 * Works in the browser (import) and in Node (tools/server.mjs).
 */

// ---------- places ----------
export const PLACE_IDS = ['home', 'shop', 'ground', 'classroom', 'bank', 'kitchen', 'bedroom', 'park', 'supermarket', 'street', 'party', 'festival', 'library', 'night_ground', 'beach', 'market', 'village', 'camp', 'sports', 'cave'];
const PLACE_WORDS = {   // checked in order: specific places first
  cave: ['cave', 'cavern', 'crystals', 'tunnel'],
  beach: ['beach', 'sea', 'waves', 'sand', 'shore', 'ocean', 'sunrise', 'sunset'],
  camp: ['camp', 'camping', 'campfire', 'tent', 'tents'],
  market: ['market', 'bazaar', 'stall', 'stalls', 'dosa', 'chai', 'biryani'],
  village: ['village', 'hut', 'huts', 'farm'],
  sports: ['football', 'cricket', 'basketball', 'badminton', 'gym', 'match', 'goal', 'pitch'],
  night_ground: ['night', 'stars', 'moon', 'dark'],
  bank: ['bank', 'atm', 'teller', 'passbook', 'deposit', 'vault', 'cashier'],
  kitchen: ['kitchen', 'cook', 'cooking', 'stove', 'fridge', 'cooker'],
  bedroom: ['bedroom', 'bed', 'sleep', 'woke', 'pillow'],
  park: ['park', 'swing', 'swings', 'slide', 'seesaw', 'picnic'],
  supermarket: ['supermarket', 'mart', 'mall', 'trolley', 'checkout', 'aisle', 'grocery'],
  street: ['street', 'road', 'bus', 'traffic', 'crossing', 'auto', 'rickshaw'],
  party: ['party', 'birthday', 'cake', 'balloons', 'gift', 'celebrate'],
  festival: ['diwali', 'festival', 'diya', 'diyas', 'rangoli', 'temple', 'lamps', 'crackers'],
  library: ['library', 'books', 'librarian', 'reading'],
  home: ['home', 'house', 'room', 'living', 'kitchen', 'bedroom', 'flat', 'apartment', 'family', 'sofa'],
  shop: ['shop', 'store', 'market', 'stall', 'counter', 'canteen', 'bakery', 'mall', 'supermarket'],
  ground: ['ground', 'playground', 'outside', 'outdoor', 'outdoors', 'garden', 'field', 'yard', 'bench', 'court', 'tree', 'rain', 'walk', 'path', 'forest', 'beach'],
  classroom: ['classroom', 'class', 'school', 'lesson', 'exam', 'test', 'teacher', 'desk'],
};
export function matchPlace(name = '', narration = '') {
  narration = String(narration).replace(/piggy[\s-]*bank/gi, 'piggy');   // a piggy bank is not a bank
  const words = tokens(name);
  const order = Object.keys(PLACE_WORDS);
  if (PLACE_IDS.includes(String(name).trim())) return { id: String(name).trim(), exact: true };
  for (const id of PLACE_IDS) if (words.includes(id)) return { id, exact: true };
  for (const id of order) if (PLACE_WORDS[id].some((w) => words.includes(w))) return { id, exact: !!name };
  const nw = tokens(narration);
  for (const id of order) if (PLACE_WORDS[id].some((w) => nw.includes(w))) return { id, exact: false };
  return { id: 'home', exact: false };
}

// where people stand in each place (relative to the place's origin) — taken from the hand-made stories
const SLOTS = {
  home: [[0.1, 0, 0.45], [-0.65, 0, 0.2], [0.85, 0, 0.25], [-1.25, 0, -0.1], [1.35, 0, -0.05], [-0.2, 0, -0.35]],
  shop: [[0.15, 0, 0.75], [-0.55, 0, 0.9], [0.85, 0, 0.95], [-1.1, 0, 1.2], [1.4, 0, 1.25]],
  ground: [[0, 0, 1.2], [0.8, 0, 1.35], [-0.8, 0, 1.35], [0.4, 0, 2.0], [-0.45, 0, 2.05], [1.4, 0, 1.9]],
  classroom: [[0.15, 0, 1.2], [-0.75, 0, 1.2], [0.9, 0, 1.05], [-0.8, 0, 2.0], [-0.35, 0, 2.7], [0.6, 0, 2.3]],
  bank: [[0.1, 0, -0.6], [-0.7, 0, -0.4], [0.9, 0, -0.3], [-1.4, 0, 0.3], [1.5, 0, 0.4], [0, 0, 0.8]],
  kitchen: [[0.1, 0, 0.3], [-0.7, 0, 0.1], [0.9, 0, 0.2], [-1.2, 0, 0.8], [1.3, 0, 0.9], [0, 0, 1.2]],
  bedroom: [[0.1, 0, 0.5], [-0.7, 0, 0.3], [0.9, 0, 0.4], [-1.2, 0, 1.0], [1.3, 0, 1.0], [0, 0, 1.4]],
  park: [[0, 0, 0.9], [0.8, 0, 1.05], [-0.8, 0, 1.05], [0.4, 0, 1.8], [-0.45, 0, 1.85], [1.5, 0, 1.6]],
  supermarket: [[0.1, 0, 0.6], [-0.7, 0, 0.5], [0.9, 0, 0.6], [-1.3, 0, 1.2], [1.4, 0, 1.3], [0, 0, 1.6]],
  street: [[0, 0, 1.2], [0.8, 0, 1.35], [-0.8, 0, 1.35], [0.4, 0, 2.0], [-0.45, 0, 2.05], [1.4, 0, 1.9]],
  party: [[0.1, 0, 0.1], [-0.8, 0, 0.0], [0.9, 0, 0.1], [-1.4, 0, 0.7], [1.5, 0, 0.8], [0, 0, 1.1]],
  festival: [[0.3, 0, 2.35], [-0.6, 0, 2.3], [1.2, 0, 2.3], [-1.5, 0, 2.1], [2.0, 0, 2.0], [0.3, 0, 3.0]],   // a row in front of the rangoli, facing the camera
  library: [[0.1, 0, 0.6], [-0.7, 0, 0.5], [0.9, 0, 0.5], [-1.2, 0, 1.1], [1.0, 0, 1.2], [0, 0, 1.6]],
  night_ground: [[0, 0, 1.2], [0.8, 0, 1.35], [-0.8, 0, 1.35], [0.4, 0, 2.0], [-0.45, 0, 2.05], [1.4, 0, 1.9]],
  beach: [[0, 0, 2.2], [0.8, 0, 2.35], [-0.8, 0, 2.35], [0.4, 0, 3.0], [-0.45, 0, 3.05], [1.4, 0, 2.9]],
  market: [[0, 0, 0.8], [0.8, 0, 0.95], [-0.8, 0, 0.95], [0.4, 0, 1.6], [-0.45, 0, 1.65], [1.4, 0, 1.5]],
  village: [[0, 0, 1.0], [0.8, 0, 1.15], [-0.8, 0, 1.15], [0.4, 0, 1.8], [-0.45, 0, 1.85], [1.4, 0, 1.7]],
  camp: [[0.6, 0, 0.3], [-0.6, 0, 0.3], [1.2, 0, -0.5], [-1.2, 0, -0.5], [0, 0, 0.6], [1.6, 0, 0.4]],
  sports: [[0, 0, 1.0], [0.8, 0, 1.15], [-0.8, 0, 1.15], [0.4, 0, 1.8], [-0.45, 0, 1.85], [1.4, 0, 1.7]],
  cave: [[0, 0, 0.8], [0.8, 0, 0.95], [-0.8, 0, 0.95], [0.4, 0, 1.6], [-0.45, 0, 1.65], [1.4, 0, 1.5]],
};
const STAFF = { bank: [0, 0, -2.3] };   // bank staff stand behind the counter, like the shopkeeper
const DESK_SEATS = [[1.3, 0, 0.93], [0.7, 0, 0.93], [-1.3, 0, -0.42], [-1.9, 0, 0.93], [1.3, 0, -0.42], [0.7, 0, -0.42], [-0.7, 0, 0.93]];
const BENCH = [[0, 0, 0.08], [0.5, 0, 0.1], [-0.5, 0, 0.1]];
const SHOPKEEPER_AT = [0, 0, -0.55], TEACHER_AT = [-0.7, 0, -2.55];
// a spot to show a mentioned object in each place (surfaces the sets really have)
const SURFACE = {
  shop: (k) => [-0.3 + k * 0.28, 1.04, 0.12],          // on the counter
  classroom: (k) => [0.75 + k * 0.18, 0.8, 0.47],      // on rio's desk
  home: (k) => [0.1 + k * 0.3, 0, 1.05],               // on the rug in front of the hero
  ground: (k) => [-0.25 + k * 0.35, 0, 1.9],           // on the grass in front of the hero
  bank: (k) => [-0.3 + k * 0.28, 1.06, -1.6],           // on the bank counter
  kitchen: (k) => [-0.2 + k * 0.3, 0.91, -2.15],        // on the kitchen counter
  bedroom: (k) => [0.1 + k * 0.3, 0, 1.05],
  park: (k) => [-0.25 + k * 0.35, 0, 1.7],
  supermarket: (k) => [0.1 + k * 0.3, 0, 1.3],
  street: (k) => [-0.25 + k * 0.35, 0, 2.0],
  party: (k) => [-0.45 + k * 0.3, 0.77, -1.55],         // on the party table, beside the cake
  festival: (k) => [-0.25 + k * 0.35, 0, 2.9],
  library: (k) => [1.8 + k * 0.3, 0.79, 1.6],           // on the reading table
  night_ground: (k) => [-0.25 + k * 0.35, 0, 1.9],
  beach: (k) => [-0.25 + k * 0.35, 0, 2.9], market: (k) => [-0.25 + k * 0.35, 0, 1.6], village: (k) => [-0.25 + k * 0.35, 0, 1.8], camp: (k) => [-0.5 + k * 0.35, 0, 0.9], sports: (k) => [-0.25 + k * 0.35, 0, 1.8], cave: (k) => [-0.25 + k * 0.35, 0, 1.6],
};

// ---------- words ----------
const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000 };
export function tokens(t = '') { return String(t).toLowerCase().replace(/₹/g, ' ₹').match(/[a-z0-9₹']+/g) || []; }
const stem = (w) => w.replace(/'s$/, '').replace(/(ies)$/, 'y').replace(/(es|s)$/, '');
function words(narration) { return String(narration).split(/\s+/).map((w) => w.replace(/[^A-Za-z0-9'₹]/g, '')).filter(Boolean); }
// "chips" → the word as spoken in the line (keeps the line's spelling, adds #2 for a second mention)
function cueWord(narration, want) {
  const ws = words(narration), w = stem(want.toLowerCase());
  const i = ws.findIndex((x) => stem(x.toLowerCase()) === w || x.toLowerCase() === want.toLowerCase());
  return i < 0 ? null : ws[i].replace(/^₹/, '');
}
// money amounts said in a line: "₹100", "100 rupees", "one hundred and fifty rupees", "thirty rupees"
export function amounts(narration) {
  const out = [], tk = tokens(narration);
  for (let i = 0; i < tk.length; i++) {
    let t = tk[i], v = null, start = i, end = i;
    const balanceCue = /^(become|became|only|left|now|with|had|have)$/.test(tk[i - 1] || '');
    if (/^₹\d+$/.test(t)) v = +t.slice(1);
    else if (/^\d+$/.test(t) && (/^rupee/.test(tk[i + 1] || '') || balanceCue)) { v = +t; end = /^rupee/.test(tk[i + 1] || '') ? i + 1 : i; }
    else if (NUM_WORDS[t] != null) {   // spoken numbers, up to "one hundred and fifty"
      let n = 0, cur = 0, j = i;
      for (; j < tk.length; j++) {
        const x = tk[j]; if (x === 'and' && NUM_WORDS[tk[j + 1]] != null) continue;
        if (NUM_WORDS[x] == null) break;
        const k = NUM_WORDS[x]; if (k === 100 || k === 1000) cur = (cur || 1) * k; else cur += k;
      }
      n = cur;
      if (/^rupee/.test(tk[j] || '') || /^₹/.test(tk[i - 1] || '') || balanceCue) { v = n; end = /^rupee/.test(tk[j] || '') ? j : j - 1; i = end; }
    }
    if (v != null) {
      const after = tk[end + 1] || '', before = tk.slice(Math.max(0, start - 3), start);
      const role = after === 'each' || /^(of|for|costs?|cost|price|worth)$/.test(tk[start - 1] || '') ? 'price' : before.includes('my') || before.includes('our') || balanceCue ? 'balance' : 'other';
      out.push({ value: v, word: tk[start].replace(/^₹/, ''), role });
    }
  }
  return out;
}

const EMOTIONS = [
  ['sad', ['sad', 'gone', 'cry', 'cried', 'lost', 'alone', 'nothing', 'empty', 'upset', 'hurt', 'missed', 'broke', 'broken', 'sorry']],
  ['worried', ['worried', 'scared', 'afraid', 'nervous', 'panic', 'forgot', 'late', 'trouble', 'problem']],
  ['idea', ['idea', 'realised', 'realized', 'suddenly', 'understood', 'figured', 'plan']],
  ['big_smile', ['happy', 'yay', 'finally', 'love', 'best', 'won', 'smiled', 'laughed', 'excited', 'great', 'wonderful', 'proud']],
  ['surprised', ['wow', 'surprise', 'surprised', 'shocked', 'whoa', 'unbelievable']],
  ['thinking', ['think', 'thought', 'wonder', 'wondered', 'maybe', 'why', 'how', 'what']],
  ['angry', ['angry', 'mad', 'shouted', 'unfair']],
];
export function emotionOf(text) {
  const tk = tokens(text);
  for (const [e, ws] of EMOTIONS) if (ws.some((w) => tk.includes(w))) return e;
  return /\?\s*$/.test(text) ? 'thinking' : 'smile';
}
// actions said in the line → an animation on that word
const ACTION_WORDS = [
  ['give', ['gave', 'give', 'gives', 'paid', 'pay', 'handed', 'bought', 'sold', 'shared']],
  ['think', ['think', 'thought', 'wondered', 'remember', 'remembered']],
  ['cheer', ['yay', 'cheered', 'won', 'finally', 'hooray', 'jumped']],
  ['count', ['count', 'counted', 'counting', 'saved', 'saving']],
  ['wave', ['hi', 'hello', 'bye', 'goodbye', 'waved']],
  ['point', ['look', 'there', 'see', 'this', 'that']],
  ['arms_crossed', ['refused', 'no', 'never']],
];

// ---------- props ----------
// catalog prop → the words that mean it ("₹100 note" ← hundred / 100 / note; "chips" ← chips, crisps, snack)
const EXTRA = { chips: ['crisps', 'snack', 'snacks'], juice: ['drink', 'juice'], football: ['ball', 'football'], pencil: ['pencil'], pencils_10: ['pencils'],
  question_papers: ['paper', 'papers', 'test', 'exam'], lightbulb: ['idea'], coin_box: ['tin', 'savings tin'], coin_5: ['coin', 'coins'], bench: ['bench'],
  pencil_box_empty: ['box', 'geometry'], plant_pot: ['plant'], flowers: ['flower', 'flowers'], tree_oak: ['tree', 'trees'], rock: ['rock', 'stone'] };
const OLD_PROPS = new Set(Object.keys(EXTRA));
Object.assign(EXTRA, {   // the big asset pack: words in a line that bring the prop in (specific words only)
  money_bunch: ['bunch', 'wad'], money_pile: ['pile', 'heap', 'treasure'], bundle_1lakh: ['lakh', 'bundle'], money_brick: ['lakhs', 'crore', 'bundles'], zungga_coin: ['zungga coin'], coin_stack: ['stack', 'tower'],
  wallet: ['wallet', 'purse'], money_bag: ['sack', 'moneybag'],
  bank_counter: ['counter', 'cashier', 'teller'], piggy_bank: ['piggy'], atm_machine: ['atm'], vault_door: ['vault'], passbook: ['passbook'], debit_card: ['card', 'debit'], token_machine: ['token', 'queue'], cheque_book: ['cheque', 'check'], locker_box: ['locker', 'safe'], counting_machine: ['counting'],
  lunch_box: ['lunch', 'lunchbox'], water_bottle: ['bottle', 'water'], samosa_plate: ['samosa', 'samosas'], ice_cream: ['ice-cream', 'icecream', 'cone'], apple: ['apple', 'apples'], banana: ['banana', 'bananas'], mango: ['mango', 'mangoes'], birthday_cake: ['cake'], tiffin_carrier: ['tiffin'], lemonade: ['lemonade', 'nimbu'], biscuit_packet: ['biscuit', 'biscuits', 'cookies'], chocolate_bar: ['chocolate', 'chocolates'],
  kite: ['kite', 'patang'], cricket_bat: ['bat', 'cricket'], cricket_ball: ['ball'], toy_car: ['car'], teddy_bear: ['teddy'], spinning_top: ['top', 'lattu'], blocks: ['blocks'], skipping_rope: ['skipping', 'rope'], toy_drone: ['drone'], board_game: ['ladders', 'boardgame'], yoyo: ['yoyo', 'yo-yo'],
  school_bag: ['bag', 'backpack', 'schoolbag'], notebook: ['notebook', 'homework'], geometry_box: ['geometry', 'compass'], crayons: ['crayons', 'colours', 'drawing'], globe: ['globe', 'world'], report_card: ['report', 'marks', 'grades'], trophy: ['trophy', 'won'], medal: ['medal'], calculator: ['calculator', 'calculate'], eraser_sharpener: ['eraser', 'sharpener'], school_bell: ['bell'],
  bed: ['bed'], study_table: ['study', 'lamp'], dining_set: ['dinner', 'dining'], tv_stand: ['tv', 'television', 'cartoon'], wardrobe: ['wardrobe', 'almirah', 'cupboard'], ceiling_fan: ['fan'], fridge: ['fridge'], shoe_rack: ['shoes', 'slippers'], wall_clock: ['clock', "o'clock"], stove_cooker: ['cooker', 'stove', 'cooking'],
  grocery_shelf: ['shelf', 'shelves', 'groceries'], cash_register: ['register', 'billing'], weighing_scale: ['weigh', 'kilo', 'kg', 'scale'], shopping_basket: ['basket'], sale_sign: ['sale', 'discount', 'offer'], vegetable_cart: ['vegetables', 'tomatoes', 'onions', 'potatoes'], toy_shop_window: ['toyshop'], candy_jars: ['candy', 'candies', 'sweets', 'toffee'], paper_bag: ['bag'], qr_stand: ['scan', 'upi', 'qr'],
  zungga_trophy: ['trophy'], zungga_flag: ['flag'], zungga_balloons: ['balloon', 'balloons'], zungga_gift: ['gift', 'present', 'surprise'], zungga_stickers: ['stickers', 'sticker'], zungga_plush: ['plush', 'soft toy'], zungga_signboard: ['signboard', 'sign'], zungga_cap: ['cap', 'hat'], zungga_phone_app: ['app'], zungga_banner: ['banner'],
  palm_tree: ['palm', 'coconut'], banyan_tree: ['banyan'], grass_patch: ['grass'], pond: ['pond', 'lake'], clouds: ['clouds', 'cloud', 'sky'], sun_rainbow: ['rainbow', 'sunshine'], butterflies: ['butterfly', 'butterflies'], birds_wire: ['birds', 'bird'], fallen_leaves: ['leaves', 'autumn'], mountains: ['mountain', 'mountains', 'hills'],
  bicycle: ['bicycle', 'cycle', 'bike'], school_bus: ['bus'], auto_rickshaw: ['auto', 'rickshaw'], car: ['car'], scooter: ['scooter', 'scooty'], bus_stop: ['stop'], traffic_light: ['signal', 'traffic'], train: ['train', 'railway'], aeroplane: ['aeroplane', 'plane', 'flight'], road_crossing: ['crossing', 'zebra'],
  phone: ['phone', 'mobile'], laptop: ['laptop', 'computer'], tablet: ['tablet'], headphones: ['headphones', 'music'], smartwatch: ['watch'], savings_app_screen: ['goal', 'savings app'], tv_remote: ['remote'], camera: ['camera', 'photo'], charger_powerbank: ['charger', 'charge', 'battery'], robot_toy: ['robot'],
});
// props that only make sense in certain places (so "car" in a bedroom shows the toy, not a real car)
const ONLY_IN = { car: ['street'], school_bus: ['street'], auto_rickshaw: ['street'], scooter: ['street'], train: ['street'], aeroplane: ['street', 'park', 'ground'], bus_stop: ['street'], traffic_light: ['street'], road_crossing: ['street'], toy_car: ['home', 'bedroom', 'party', 'classroom', 'park', 'ground'],
  palm_tree: ['park', 'ground', 'street'], banyan_tree: ['park', 'ground'], pond: ['park', 'ground'], mountains: ['park', 'ground'], clouds: ['park', 'ground', 'street'], sun_rainbow: ['park', 'ground', 'street'], grass_patch: ['park', 'ground'], birds_wire: ['street', 'ground', 'park'],
  bank_counter: ['bank'], vault_door: ['bank'], atm_machine: ['bank', 'street'], token_machine: ['bank'], counting_machine: ['bank'], grocery_shelf: ['supermarket', 'shop'], cash_register: ['supermarket', 'shop'], vegetable_cart: ['street', 'supermarket'], toy_shop_window: ['street', 'shop'],
  bed: ['bedroom', 'home'], wardrobe: ['bedroom', 'home'], fridge: ['kitchen', 'home'], stove_cooker: ['kitchen', 'home'], dining_set: ['kitchen', 'home'], ceiling_fan: [], tv_stand: ['home', 'bedroom'], study_table: ['bedroom', 'home'], shoe_rack: ['bedroom', 'home'], zungga_signboard: ['street', 'shop', 'supermarket'], zungga_banner: ['party', 'classroom', 'park', 'ground', 'supermarket'] };
// things each place's set already has (no second copy is added when a line mentions them)
const SET_HAS = { bank: ['bank_counter', 'vault_door', 'atm_machine', 'token_machine'], kitchen: ['stove_cooker', 'fridge', 'wall_clock', 'dining_set', 'apple', 'banana', 'mango'],
  bedroom: ['bed', 'study_table', 'wardrobe', 'teddy_bear', 'blocks', 'toy_car', 'shoe_rack', 'school_bag'], park: ['banyan_tree', 'palm_tree', 'bench', 'pond', 'grass_patch', 'flowers', 'butterflies', 'clouds'],
  supermarket: ['grocery_shelf', 'cash_register', 'qr_stand', 'candy_jars', 'shopping_basket', 'sale_sign'], street: ['bus_stop', 'traffic_light', 'auto_rickshaw', 'car', 'scooter', 'bicycle', 'birds_wire', 'school_bus', 'road_crossing'],
  party: ['birthday_cake', 'zungga_gift', 'zungga_balloons'], library: ['globe'], night_ground: ['bench'], ground: ['bench'] };
const SET_ONLY_CATS = ['street', 'village', 'park', 'camping', 'beach', 'landmarks', 'cave', 'sky', 'seasons', 'sports', 'weather', 'people'];
const SKIP_PROPS = new Set(['note_500', 'note_200', 'coin_1', 'coin_2', 'coin_10', 'debit_card', 'classroom', 'school_ground', 'home_room', 'shop_counter', 'desk', 'teacher_table', 'blackboard', 'classroom_door', 'zungga_logo', 'bench', 'note_100', 'note_50', 'note_20', 'note_10', 'notes_30', 'coin_5']);
function propWords(p) {
  if (p.words && p.words.length && !EXTRA[p.id]) return [...new Set(p.words.map(stem))];   // catalog trigger words (ported props)
  const base = EXTRA[p.id] && !OLD_PROPS.has(p.id) ? EXTRA[p.id].slice() : (EXTRA[p.id] || []).concat(tokens(p.label).filter((w) => w.length > 2 && !/^\d/.test(w) && !['and', 'the'].includes(w)));   // new props: only their chosen words
  return [...new Set(base.map(stem))];
}
const MONEY = { 100: 'note_100', 50: 'note_50', 20: 'note_20', 10: 'note_10', 30: 'notes_30', 5: 'coin_5' };
export function suggest(name, catalog, n = 4) {   // closest catalog props for a missing thing
  const w = tokens(name).map(stem);
  return catalog.map((p) => ({ id: p.id, label: p.label, s: propWords(p).concat((p.tags || []).map(stem), [p.category]).filter((x) => w.includes(x)).length }))
    .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n).map(({ id, label }) => ({ id, label }));
}

// ---------- characters ----------
const HELPER = { cat: 'helper_cat', planet: 'idea_planet' };
export function castKind(c) { return c.preset === 'helper_cat' ? 'cat' : c.preset === 'idea_planet' ? 'planet' : /^bank_(teller|manager)$/.test(c.preset || '') ? 'bankstaff' : /shop|grocer/.test(c.preset || '') ? 'shopkeeper' : /teacher/.test(c.preset || '') ? 'teacher' : 'person'; }

const r2 = (v) => Math.round(v * 100) / 100;
function faceToward(from, to, bias = 0.55) {   // turn toward someone, but keep the face open to the camera (+z)
  const a = Math.atan2(to[0] - from[0], to[2] - from[2]);
  return r2(Math.atan2(Math.sin(a) * bias, Math.cos(a) * bias + (1 - bias)));
}

// ---------- the stager ----------
export function stageScene(sd, i, ctx) {
  const { draft, catalog, castById, report } = ctx, n = draft.scenes.length;
  const narration = String(sd.narration || '').trim();
  const pm = matchPlace(sd.place, narration); if (sd.place && !pm.exact) report.missing.push({ scene: i + 1, kind: 'place', name: sd.place, chosen: pm.id, suggestions: PLACE_IDS.map((id) => ({ id, label: id })) });
  const clauses = narration.split(/(?<=[,.?!;])\s+/).filter(Boolean);
  const place = pm.id, lineMood = sd.mood || emotionOf(narration), mood = sd.mood || emotionOf(clauses[0] || narration), sad = lineMood === 'sad' || lineMood === 'worried';
  const heroId = draft.hero || draft.cast[0]?.id;
  let ids = (sd.characters && sd.characters.length ? sd.characters : [heroId]).filter((id) => { if (castById[id]) return true; report.missing.push({ scene: i + 1, kind: 'character', name: id, suggestions: [] }); return false; });
  if (!ids.includes(heroId) && castById[heroId] && !sd.noHero) ids.unshift(heroId);
  ids = [...new Set(ids)];
  const sc = { id: sd.id ?? i + 1, title: sd.title || `Scene ${i + 1}`, place, narration, actors: {}, beats: [], props: [], camera: [], auto: true };
  if (sd.mood && ['soft'].includes(sd.mood)) sc.mood = 'soft';
  if (sd.talking && castById[sd.talking]) sc.talking = sd.talking;

  // --- positions
  const people = ids.filter((id) => ['person', 'shopkeeper', 'teacher', 'bankstaff'].includes(castKind(castById[id])));
  const helpers = ids.filter((id) => !people.includes(id));
  const sitting = ((place === 'ground' || place === 'night_ground') && sad) || (place === 'classroom' && !/stood|stand|walked|ran|recess|break/.test(narration.toLowerCase()) && people.length >= 2);
  let slot = 0, bench = 0, desk = 0;
  for (const id of people) {
    const kind = castKind(castById[id]), a = { at: null, face: 0, anim: 'idle', expr: id === heroId ? mood : 'smile' };
    if (kind === 'shopkeeper' && place === 'shop') a.at = SHOPKEEPER_AT.slice();
    else if (kind === 'bankstaff' && STAFF[place]) a.at = STAFF[place].slice();
    else if (kind === 'teacher' && place === 'classroom') a.at = TEACHER_AT.slice();
    else if (sitting && (place === 'ground' || place === 'night_ground') && bench < BENCH.length) { a.at = BENCH[bench++].slice(); a.anim = sad ? 'sit_sad' : 'sit'; }
    else if (sitting && place === 'classroom' && desk < DESK_SEATS.length) { a.at = DESK_SEATS[desk++].slice(); a.anim = 'sit'; a.seat = true; a.face = 3.14; }
    else { const s = SLOTS[place]; a.at = s[slot++ % s.length].slice(); }
    if (['sad', 'worried'].includes(a.expr) && id !== heroId) a.expr = 'worried';
    if (!['neutral', 'smile', 'big_smile', 'sad', 'surprised', 'thinking', 'worried', 'determined', 'idea', 'stern', 'confused', 'angry'].includes(a.expr)) a.expr = 'smile';
    sc.actors[id] = a;
  }
  // helpers stay next to the hero: the cat at their side, the planet floating at shoulder height
  const hero = sc.actors[heroId] || Object.values(sc.actors)[0];
  for (const id of helpers) {
    const kind = castKind(castById[id]), base = hero ? hero.at : [0, 0, 0.5];
    const a = kind === 'planet' ? { at: [r2(base[0] - 0.6), 0.2, r2(base[2] + 0.3)], face: 0.4, anim: 'idle', expr: sad ? 'thinking' : 'big_smile' }
      : { at: [r2(base[0] + 0.55), 0, r2(base[2] + 0.25)], face: -0.4, anim: sad && hero && /sit/.test(hero.anim) ? 'sit_sad' : 'idle', expr: sad ? 'sad' : 'smile' };
    if (kind === 'cat' && a.anim === 'sit_sad') a.seat = 0.45;
    sc.actors[id] = a;
  }
  // turn standing people toward each other (keeping faces open to the camera)
  const standing = Object.entries(sc.actors).filter(([, a]) => a.face === 0 && !a.seat && !/sit/.test(a.anim));
  if (standing.length > 1) { const cx = standing.reduce((s, [, a]) => s + a.at[0], 0) / standing.length, cz = standing.reduce((s, [, a]) => s + a.at[2], 0) / standing.length; for (const [, a] of standing) a.face = faceToward(a.at, [cx, 0, cz]); }
  if (place === 'shop') for (const [id, a] of Object.entries(sc.actors)) if (castKind(castById[id]) !== 'shopkeeper' && castKind(castById[id]) !== 'planet' && castKind(castById[id]) !== 'cat') a.face = 3.14;

  // --- actions on words (hero, or whoever talks)
  const doer = sc.talking || heroId;
  if (sc.actors[doer]) {
    const done = new Set();
    for (const [anim, ws] of ACTION_WORDS) {
      for (const w of ws) {
        const cw = cueWord(narration, w); if (!cw || done.has(cw.toLowerCase())) continue;
        const wi = wordIndex(narration, cw), prev = words(narration).slice(Math.max(0, wi - 3), wi).map((x) => x.toLowerCase());
        if (['give', 'think', 'count', 'cheer', 'arms_crossed'].includes(anim) && !prev.some((x) => ['i', 'we', doer, (castById[doer]?.label || '').toLowerCase()].includes(x))) continue;
        if (/sit/.test(sc.actors[doer].anim) && !['think', 'count'].includes(anim)) continue;
        done.add(cw.toLowerCase()); sc.beats.push({ word: cw, offset: -0.2, actor: doer, anim, auto: true });
        if (!['think', 'count'].includes(anim)) sc.beats.push({ word: cw, offset: 1.4, actor: doer, anim: /sit/.test(sc.actors[doer].anim) ? sc.actors[doer].anim : 'idle', auto: true });
        break;
      }
    }
    // expression follows the line: each clause that changes the feeling changes the face on its first word
    let curE = mood;
    clauses.forEach((cl, ci) => {
      if (!ci) return; const e2 = emotionOf(cl); if (e2 === curE || (e2 === 'smile' && !/[!]/.test(cl))) return;
      const fw = words(cl)[0]; if (!fw) return; const nth = countBefore(narration, fw, clauses.slice(0, ci + 1));
      sc.beats.push({ word: fw.replace(/^₹/, '') + (nth > 0 ? '#' + (nth + 1) : ''), actor: doer, expr: e2, auto: true }); curE = e2;
    });
  }
  if (sc.talking && sc.actors[sc.talking] && !/sit/.test(sc.actors[sc.talking].anim)) sc.actors[sc.talking].anim = 'talk';

  // --- props mentioned in the line (or listed in the draft)
  const tk = tokens(narration).map(stem), shown = [];
  let k = 0;
  for (const p of catalog) {
    if (SKIP_PROPS.has(p.id) || p.category === 'sets') continue;
    if (SET_ONLY_CATS.includes(p.category) && !(p.category === 'sports' && /ball|racket|shuttle|dumbbell|stumps/.test(p.id))) continue;   // big set pieces come with their place
    const pw = propWords(p), hit = pw.find((w) => tk.includes(w));
    if (!hit) continue;
    if (p.category === 'nature' && !['ground', 'park', 'street', 'night_ground'].includes(place) && !ONLY_IN[p.id]) continue;
    if (ONLY_IN[p.id] && !ONLY_IN[p.id].includes(place)) continue;
    if ((SET_HAS[place] || []).includes(p.id)) continue;
    if (shown.some((s) => propWords(catalog.find((c) => c.id === s)).includes(hit))) continue;   // one prop per word
    const cw = cueWord(narration, hit) || cueWord(narration, hit + 's');
    if (p.id === 'lightbulb') { if (sc.actors[doer]) sc.props.push({ id: 'lightbulb', attach: doer + '.head', at: [0, 0.27, 0], ...(cw ? { showWord: cw, onWord: cw, onOffset: 0.1 } : { show: 0.12, on: 0.15 }), auto: true }); shown.push(p.id); continue; }
    if (p.id === 'coin_box') {
      const coinsW = cueWord(narration, 'coins') || cueWord(narration, 'saved') || cw;
      sc.props.push({ id: 'coin_box', at: SURFACE[place](k++), ...(coinsW ? { coins: { count: 8, startWord: coinsW, startOffset: 0.2, endWord: coinsW, endOffset: 2.2, sound: 'coin-register.mp3', vol: 0.3 } } : {}), auto: true });
      shown.push(p.id); continue;
    }
    sc.props.push({ id: p.id, at: SURFACE[place](k++), ...(cw ? { showWord: cw, showOffset: -0.35 } : {}), auto: true });
    shown.push(p.id);
  }
  // money said in the line: the hero shows it in their hand right then, and a small counter tracks it
  const money = amounts(narration);
  const bal = money.filter((m) => m.role === 'balance'), price = money.find((m) => m.role === 'price' && !/each/.test(narration.toLowerCase().split(m.word)[1]?.slice(0, 14) || ''));
  if (bal.length && sc.actors[doer]) {
    const m0 = bal[0], note = MONEY[m0.value], nth = (w) => { const k = words(narration).slice(0, wordIndex(narration, w) + 1).filter((x) => x.toLowerCase() === w.toLowerCase()).length; return k > 1 ? `${w}#${k}` : w; };
    if (note && !/sit/.test(sc.actors[doer].anim)) sc.beats.push({ word: m0.word, offset: -0.2, actor: doer, hold: { R: note }, auto: true });
    else if (note) sc.actors[doer].hold = { R: note };
    sc.counter = { from: m0.value, to: bal[bal.length - 1].value, label: draft.counterLabel || 'Money', steps: bal.slice(1).map((m) => ({ word: nth(m.word), v: m.value })), auto: true };
    money.splice(0, money.length, ...bal);
  } else money.length = 0;
  if (price) sc.caption = { text: '₹' + price.value, atWord: price.word, auto: true };
  for (const name of sd.objects || []) {   // things the writer asked for that the catalog doesn't have
    const nm = String(name).toLowerCase().trim(); if (!nm) continue;
    const mm = nm.match(/₹\s?(\d+)|(\d+)\s*rupee/);
    if (mm) {   // money: the nearest note / coin the library has (₹1, ₹2, ₹5 → a coin; others → the closest note), amounts alone are just numbers
      const v = +(mm[1] || mm[2]), id = /coin/.test(nm) || v < 10 ? 'coin_5' : MONEY[v] || null;
      if (id && !shown.includes(id) && id !== 'coin_5') { const cw = cueWord(narration, String(v)) || cueWord(narration, 'rupees'); sc.props.push({ id, at: SURFACE[place](k++), ...(cw ? { showWord: cw, showOffset: -0.35 } : {}), auto: true }); shown.push(id); }
      continue;
    }
    const nt = tokens(nm).map(stem);
    const found = catalog.find((p) => p.id === nm || tokens(p.label).join(' ') === tokens(nm).join(' ') || propWords(p).includes(stem(nm))) || catalog.find((p) => !SKIP_PROPS.has(p.id) && nt.length && nt.every((w) => propWords(p).includes(w) || (p.tags || []).map(stem).includes(w)));
    if (found) { if (!shown.includes(found.id) && !SKIP_PROPS.has(found.id)) { const cw = cueWord(narration, nm); sc.props.push({ id: found.id, at: SURFACE[place](k++), ...(cw ? { showWord: cw, showOffset: -0.35 } : {}), auto: true }); shown.push(found.id); } }
    else report.missing.push({ scene: i + 1, kind: 'prop', name: nm, suggestions: suggest(nm, catalog) });
  }

  // --- weather: sad outdoor scenes get rain (quiet, background) and a thunder flash on the sad word
  const outdoor = ['ground', 'park', 'street', 'night_ground', 'beach', 'market', 'village', 'camp', 'sports'].includes(place);
  if ((sd.weather === 'rain') || (sd.weather == null && sad && outdoor && mood === 'sad')) {
    const sw = EMOTIONS[0][1].map((w) => cueWord(narration, w)).find(Boolean) || words(narration)[1];
    sc.weather = { type: 'rain', thunder: sw ? [{ word: sw, offset: 0.2 }] : [0.2] }; sc.ambience = { file: 'rain-loop.wav', vol: 0.12 };
  }

  if (place === 'beach' && !sc.ambience) sc.ambience = { file: 'beach-waves.mp3', vol: 0.22, auto: true };   // the island's waves, softly
  // --- seasons: winter / snow, autumn leaves, spring, summer
  const nl = narration.toLowerCase();
  if (/\b(snow|snowing|snowman|winter|freezing)\b/.test(nl)) { sc.season = 'winter'; if (!sc.weather) sc.weather = { type: 'snow' }; }
  else if (/\b(autumn|fall leaves|falling leaves)\b/.test(nl)) sc.season = 'autumn';
  else if (/\b(spring|blossom|blossoms)\b/.test(nl)) sc.season = 'spring';
  else if (/\b(summer|hot day|heat)\b/.test(nl)) sc.season = 'summer';
  if (sd.season) sc.season = sd.season;
  // --- camera: open on the people, cut close to every object exactly when it's said, end on the hero's face
  const heroFocus = sc.actors[heroId] ? heroId : Object.keys(sc.actors)[0];
  const group = Object.keys(sc.actors);
  const shots = [];
  const propCues = sc.props.filter((p) => p.showWord || p.coins).map((p) => ({ word: p.showWord || p.coins.startWord, focus: p.attach ? p.attach.replace('.head', ':head') : p.id, coins: !!p.coins }));
  const moneyCue = money.length && sc.actors[doer] ? [{ word: money[0].word, focus: doer + '.R', money: true }] : [];
  const cuesList = [...propCues, ...moneyCue].sort((a, b) => wordIndex(narration, a.word) - wordIndex(narration, b.word));
  const ang = [25, -20, 30, -30, 15][i % 5];
  shots.push(group.length > 1 ? { move: i === 0 ? 'push_in' : 'hold', focus: group, from: 'wide', to: 'mid', distance: 'mid', angle: ang, elevation: 10 } : { move: 'push_in', focus: [heroFocus], from: 'wide', to: 'mid', angle: ang, elevation: 8 });
  for (const c of cuesList.slice(0, 3)) {
    shots[shots.length - 1].untilWord = c.word; shots[shots.length - 1].untilOffset = -0.4;
    shots.push(c.coins ? { move: 'push_in', focus: [c.focus], from: 'mid', to: 'close', zoom: 1.0, angle: 20, elevation: 55 }
      : c.money ? { move: 'hold', focus: [c.focus], distance: 'close', zoom: 1.3, minSize: 0.3, angle: 25, elevation: 12 }
      : { move: 'push_in', focus: [c.focus], from: 'mid', to: 'close', zoom: 0.9, angle: 15, elevation: 22 });
    shots.push({ move: 'hold', focus: [heroFocus + ':upper'], distance: 'mid', angle: -ang, elevation: 8 });
    shots[shots.length - 2].untilWord = c.word; shots[shots.length - 2].untilOffset = 1.6;
  }
  const last = shots[shots.length - 1];
  if (last.move === 'hold' && last.focus[0].endsWith(':upper')) Object.assign(last, { move: 'push_in', focus: [heroFocus + ':head'], from: 'mid', to: 'close', angle: last.angle, elevation: 5 });
  else shots.push({ move: 'push_in', focus: [heroFocus + ':head'], from: 'mid', to: 'close', angle: -ang, elevation: 5 });
  if (shots.length > 1 && !shots[shots.length - 2].untilWord) shots[shots.length - 2].until = 0.65;
  sc.camera = shots.map((s) => ({ ...s, auto: true }));

  // --- last scene: the Zungga end card
  if (i === n - 1) {
    sc.props.push({ id: 'zungga_logo', at: [0, 0, 1.6], show: 0.82, endCard: true, auto: true });
    sc.camera[sc.camera.length - 1].until = 0.8; sc.camera.push({ move: 'hold', focus: ['zungga_logo'], angle: 0, elevation: 4, distance: 'close', auto: true });
    if (/\?/.test(narration) && sc.actors[doer]) sc.caption = { text: narration.split(/(?<=[.!])\s+/).filter((t) => t.includes('?')).pop() || narration, at: 0.45, big: true, auto: true };
  }
  if (!sc.beats.length) delete sc.beats;
  if (!sc.props.length) delete sc.props;
  return sc;
}
function wordIndex(narration, w) { const [b, nth] = String(w).split('#'); const ws = words(narration).map((x) => x.toLowerCase()); let k = 0; const i = ws.findIndex((x) => x === b.toLowerCase() && ++k === +(nth || 1)); return i < 0 ? 999 : i; }
function countBefore(narration, fw, parts) { const before = parts.slice(0, -1).join(' '); return words(before).filter((x) => x.toLowerCase() === fw.toLowerCase()).length; }

export function stage(draft, catalog, presets = {}) {
  const report = { missing: [], warnings: [] };
  const world = draft.world || 'toon', castById = {}, cast = {};
  for (const c of draft.cast || []) {
    castById[c.id] = c;
    if (world === 'toon') { if (presets.toonPresets && !presets.toonPresets.includes(c.preset)) report.missing.push({ kind: 'character', name: c.id, preset: c.preset, suggestions: (presets.toonPresets || []).slice(0, 6).map((id) => ({ id, label: id })) }); cast[c.id] = { cast: c.preset, ...(c.look ? { look: c.look } : {}), ...(c.colors ? { colors: c.colors } : {}) }; }
    else { if (presets.peoplePresets && !presets.peoplePresets.includes(c.preset)) report.missing.push({ kind: 'character', name: c.id, preset: c.preset, suggestions: (presets.peoplePresets || []).slice(0, 6).map((id) => ({ id, label: id })) }); cast[c.id] = { preset: c.preset, ...(c.wear ? { wear: c.wear } : {}) }; }
  }
  const ctx = { draft, catalog, castById, report };
  const scenes = (draft.scenes || []).map((sd, i) => (sd.locked && sd.staged ? sd.staged : stageScene(sd, i, ctx)));
  const story = {
    title: draft.title || 'Untitled story', format: { width: 1080, height: 1920, fps: 30 },
    voice: { engine: 'qwen3-tts-local', voice: draft.voice || 'boy-calm', pauseAfter: 0.7 },
    hero: draft.hero || draft.cast?.[0]?.id, world, cast, scenes,
  };
  return { story, report: check(story, catalog, report) };
}

// ---------- checker: everything a story points at must exist ----------
export function check(story, catalog, report = { missing: [], warnings: [] }) {
  const ids = new Set(catalog.map((p) => p.id)), cast = story.cast || {};
  for (const [i, sc] of (story.scenes || []).entries()) {
    if (!PLACE_IDS.includes(sc.place)) report.warnings.push({ scene: i + 1, text: `Unknown place "${sc.place}"` });
    if (!String(sc.narration || '').trim()) report.warnings.push({ scene: i + 1, text: 'This scene has no narration' });
    for (const id of Object.keys(sc.actors || {})) if (!cast[id]) report.warnings.push({ scene: i + 1, text: `"${id}" is in the scene but not in the cast` });
    for (const p of sc.props || []) if (!ids.has(p.id)) report.warnings.push({ scene: i + 1, text: `Prop "${p.id}" is not in the library` });
    for (const b of sc.beats || []) if (b.word && wordIndex(sc.narration || '', b.word) === 999) report.warnings.push({ scene: i + 1, text: `Action timed to "${b.word}", which isn't in the line` });
  }
  return report;
}

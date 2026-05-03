import type { Category, ScoringMode, Question, CategorySettings } from '@/types'

// ─── Predefined topic tags ───────────────────────────────────────────────────
// These are suggestions shown in the UI. Users can type any tag they want.
// Stored as { tag, label, emoji } for display purposes.

export interface PredefinedTopic {
  tag: string
  label: string
  emoji: string
}

export const PREDEFINED_TOPICS: PredefinedTopic[] = [
  { tag: 'bible',       label: 'Bible',        emoji: '✝️'  },
  { tag: 'science',     label: 'Science',       emoji: '🔬' },
  { tag: 'nature',      label: 'Nature',        emoji: '🌿' },
  { tag: 'technology',  label: 'Technology',    emoji: '💻' },
  { tag: 'history',     label: 'History',       emoji: '📜' },
  { tag: 'geography',   label: 'Geography',     emoji: '🌍' },
  { tag: 'sport',       label: 'Sport',         emoji: '⚽' },
  { tag: 'music',       label: 'Music',         emoji: '🎵' },
  { tag: 'film',        label: 'Film & TV',     emoji: '🎬' },
  { tag: 'literature',  label: 'Literature',    emoji: '📚' },
  { tag: 'maths',       label: 'Mathematics',   emoji: '➕' },
  { tag: 'food',        label: 'Food & Drink',  emoji: '🍽️' },
  { tag: 'general',     label: 'General',       emoji: '🧠' },
]

export const ALL_TOPICS_TAG = '__all__' // sentinel meaning "no topic filter"

export const TEAM_COLORS = [
  '#E74C3C','#3498DB','#2ECC71','#9B59B6',
  '#F39C12','#1ABC9C','#E67E22','#E91E63',
]

export const CATEGORIES: Category[] = [
  {
    id: 'quote', name: 'Quote / Verse Completion', icon: '📖',
    scoringModeId: 'sm_quote', turnMode: 'per-question-rotation',
    description: 'Teams hear a partial verse and must complete the missing words from memory.',
    addHint: 'Enter the verse reference, the prompt shown to teams, and the correct completion.',
    rules: [
      'Admin reads the partial verse aloud.',
      'The active team has the answer timer to respond.',
      'If time runs out without an answer, opponents may steal during the steal window.',
      'A steal attempt scores steal points; an incorrect steal scores nothing (no penalty).',
      'Passing moves the turn without penalty.',
    ],
  },
  {
    id: 'general', name: 'General Knowledge', icon: '🧠',
    scoringModeId: 'sm_general', turnMode: 'per-question-rotation',
    description: 'Open-ended Bible knowledge questions on any topic.',
    addHint: 'Write a clear question and the correct answer.',
    rules: [
      'Admin reads the question aloud.',
      'The active team has the answer timer to respond.',
      'Incorrect or timed-out answers allow opponents to steal.',
      'A wrong guess by the active team deducts points and forfeits the question.',
      'Passing moves the turn without scoring or penalty.',
    ],
  },
  {
    id: 'character', name: 'Identify the Described Character', icon: '👤',
    scoringModeId: 'sm_general', turnMode: 'per-question-rotation',
    description: 'Clues are read aloud; teams name the Bible character being described.',
    addHint: 'Describe the character without naming them. The answer is their name.',
    rules: [
      'Admin reads the clues in first person ("I was…").',
      'The active team has the answer timer to name the character.',
      'Teams must give the exact or commonly accepted name.',
      'Timed-out questions open a steal window for opponents.',
      'Passing moves the turn without penalty.',
    ],
  },
  {
    id: 'hotseat', name: 'Hot Seat', icon: '🔥',
    scoringModeId: 'sm_hotseat', turnMode: 'continuous',
    description: 'One team answers as many questions as they can within a single countdown — not per question.',
    addHint: 'Write the listing challenge and pre-load acceptable answers for reference.',
    rules: [
      'One team occupies the Hot Seat for the entire hot-seat duration.',
      'Admin reads questions back-to-back; the timer does NOT reset per question.',
      'Points are awarded per correct answer during the session.',
      'No deductions for wrong answers.',
      'No steal mechanic — Hot Seat is a solo endurance round.',
      'When the timer hits zero the round ends immediately.',
    ],
  },
  {
    id: 'openverse', name: 'Open the Verse', icon: '📜',
    scoringModeId: 'sm_openverse', turnMode: 'per-question-rotation',
    description: 'A Bible reference is given; teams open their Bibles and read the verse aloud accurately.',
    addHint: 'Enter the book, chapter and verse. The verse text is your answer key.',
    rules: [
      'Admin announces the book, chapter and verse.',
      'The active team has the answer timer to find and read the verse.',
      'The admin judges accuracy — key words must be correct.',
      'If the team cannot find or read the verse in time, opponents may steal.',
      'Steal points are awarded for a correct steal reading.',
      'No pass allowed — find it or lose the steal opportunity.',
    ],
  },
  {
    id: 'truefalse', name: 'True or False', icon: '⚖️',
    scoringModeId: 'sm_tf', turnMode: 'per-question-rotation',
    description: 'A statement is read aloud; teams must declare whether it is True or False.',
    addHint: 'Write the statement, mark it True or False, and add a brief explanation.',
    rules: [
      'Admin reads the statement aloud.',
      'The active team has the answer timer to respond "True" or "False".',
      'A wrong answer deducts points.',
      'No steal mechanic — True/False is direct scoring only.',
      'No pass allowed.',
    ],
  },
]

// Default scoring modes — overridden at runtime by CategorySettings in store
export const SCORING_MODES: Record<string, ScoringMode> = {
  sm_quote:     { id:'sm_quote',     name:'Verse Completion', pointsCorrect:15, pointsWrong:-5,  allowPass:true,  allowSteal:true,  stealPoints:10 },
  sm_general:   { id:'sm_general',   name:'General',          pointsCorrect:10, pointsWrong:-3,  allowPass:true,  allowSteal:true,  stealPoints:7  },
  sm_hotseat:   { id:'sm_hotseat',   name:'Hot Seat',         pointsCorrect:5,  pointsWrong:0,   allowPass:false, allowSteal:false, stealPoints:0  },
  sm_openverse: { id:'sm_openverse', name:'Open the Verse',   pointsCorrect:20, pointsWrong:-10, allowPass:false, allowSteal:true,  stealPoints:15 },
  sm_tf:        { id:'sm_tf',        name:'True or False',    pointsCorrect:8,  pointsWrong:-4,  allowPass:false, allowSteal:false, stealPoints:0  },
}

// Default CategorySettings — stored in Zustand and editable by admin
export const DEFAULT_CATEGORY_SETTINGS: Record<string, CategorySettings> = {
  quote:     { id:'cs_quote',     categoryId:'quote',     pointsCorrect:15, pointsWrong:-5,  stealPoints:10, answerTimeSecs:30, stealTimeSecs:10, hotSeatTimeSecs:60, createdAt:0, updatedAt:0, synced:true },
  general:   { id:'cs_general',   categoryId:'general',   pointsCorrect:10, pointsWrong:-3,  stealPoints:7,  answerTimeSecs:30, stealTimeSecs:10, hotSeatTimeSecs:60, createdAt:0, updatedAt:0, synced:true },
  character: { id:'cs_character', categoryId:'character', pointsCorrect:10, pointsWrong:-3,  stealPoints:7,  answerTimeSecs:30, stealTimeSecs:10, hotSeatTimeSecs:60, createdAt:0, updatedAt:0, synced:true },
  hotseat:   { id:'cs_hotseat',   categoryId:'hotseat',   pointsCorrect:5,  pointsWrong:0,   stealPoints:0,  answerTimeSecs:30, stealTimeSecs:10, hotSeatTimeSecs:60, createdAt:0, updatedAt:0, synced:true },
  openverse: { id:'cs_openverse', categoryId:'openverse', pointsCorrect:20, pointsWrong:-10, stealPoints:15, answerTimeSecs:45, stealTimeSecs:15, hotSeatTimeSecs:60, createdAt:0, updatedAt:0, synced:true },
  truefalse: { id:'cs_truefalse', categoryId:'truefalse', pointsCorrect:8,  pointsWrong:-4,  stealPoints:0,  answerTimeSecs:20, stealTimeSecs:10, hotSeatTimeSecs:60, createdAt:0, updatedAt:0, synced:true },
}

export const SEED_QUESTIONS: Question[] = [
  { id:'q_qt_e1', categoryId:'quote', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Complete: "For God so loved the world that He gave His only begotten Son, that whoever believes in Him shall not perish but..."', answer:'have eternal life (John 3:16)', quoteFields:{verseRef:'John 3:16',partialVerse:'For God so loved the world that He gave His only begotten Son, that whoever believes in Him shall not perish but...',completion:'have eternal life'} },
  { id:'q_qt_e2', categoryId:'quote', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Complete: "The LORD is my shepherd; I shall not..."', answer:'want (Psalm 23:1)', quoteFields:{verseRef:'Psalm 23:1',partialVerse:'The LORD is my shepherd; I shall not...',completion:'want'} },
  { id:'q_qt_e3', categoryId:'quote', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Complete: "Be still and know that I am..."', answer:'God (Psalm 46:10)', quoteFields:{verseRef:'Psalm 46:10',partialVerse:'Be still and know that I am...',completion:'God'} },
  { id:'q_qt_m1', categoryId:'quote', difficulty:'medium', source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Complete: "Trust in the LORD with all your heart and lean not on your own..."', answer:'understanding (Proverbs 3:5)', quoteFields:{verseRef:'Proverbs 3:5',partialVerse:'Trust in the LORD with all your heart and lean not on your own...',completion:'understanding'} },
  { id:'q_qt_m2', categoryId:'quote', difficulty:'medium', source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Complete: "I can do all things through Christ who..."', answer:'strengthens me (Philippians 4:13)', quoteFields:{verseRef:'Philippians 4:13',partialVerse:'I can do all things through Christ who...',completion:'strengthens me'} },
  { id:'q_qt_h1', categoryId:'quote', difficulty:'hard',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Complete: "But seek first the kingdom of God and His righteousness, and all these things shall be..."', answer:'added to you (Matthew 6:33)', quoteFields:{verseRef:'Matthew 6:33',partialVerse:'But seek first the kingdom of God and His righteousness, and all these things shall be...',completion:'added to you'} },
  { id:'q_qt_h2', categoryId:'quote', difficulty:'hard',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Complete: "For the wages of sin is death, but the gift of God is..."', answer:'eternal life in Christ Jesus our Lord (Romans 6:23)', quoteFields:{verseRef:'Romans 6:23',partialVerse:'For the wages of sin is death, but the gift of God is...',completion:'eternal life in Christ Jesus our Lord'} },

  { id:'q_gk_e1', categoryId:'general', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'How many books are in the Bible?', answer:'66 books (39 Old Testament, 27 New Testament)' },
  { id:'q_gk_e2', categoryId:'general', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Who built the ark?', answer:'Noah' },
  { id:'q_gk_e3', categoryId:'general', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'What is the first book of the Bible?', answer:'Genesis' },
  { id:'q_gk_m1', categoryId:'general', difficulty:'medium', source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'What are the first five books of the Bible called?', answer:'The Pentateuch / Torah' },
  { id:'q_gk_m2', categoryId:'general', difficulty:'medium', source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Who was swallowed by a great fish?', answer:'Jonah' },
  { id:'q_gk_m3', categoryId:'general', difficulty:'medium', source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'How many plagues were sent upon Egypt?', answer:'10 plagues' },
  { id:'q_gk_h1', categoryId:'general', difficulty:'hard',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'What is the last book of the Old Testament?', answer:'Malachi' },
  { id:'q_gk_h2', categoryId:'general', difficulty:'hard',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Who was the first Christian martyr mentioned in the New Testament?', answer:'Stephen (Acts 7)' },
  { id:'q_gk_h3', categoryId:'general', difficulty:'hard',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Which river was Jesus baptised in?', answer:'The Jordan River' },

  { id:'q_ch_e1', categoryId:'character', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'I was a shepherd boy who defeated a giant named Goliath with a sling and a stone. Who am I?', answer:'David' },
  { id:'q_ch_e2', categoryId:'character', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'I was placed in a basket and floated down the Nile River as a baby. Who am I?', answer:'Moses' },
  { id:'q_ch_e3', categoryId:'character', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'I betrayed Jesus for 30 pieces of silver. Who am I?', answer:'Judas Iscariot' },
  { id:'q_ch_m1', categoryId:'character', difficulty:'medium', source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'I was a tax collector who climbed a sycamore tree to see Jesus. Who am I?', answer:'Zacchaeus' },
  { id:'q_ch_m2', categoryId:'character', difficulty:'medium', source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'I interpreted Pharaoh\'s dream and became second in command of Egypt. Who am I?', answer:'Joseph' },
  { id:'q_ch_m3', categoryId:'character', difficulty:'medium', source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'I denied Jesus three times before the rooster crowed. Who am I?', answer:'Peter (Simon Peter)' },
  { id:'q_ch_h1', categoryId:'character', difficulty:'hard',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'I was a judge of Israel whose great strength came from my uncut hair. Who am I?', answer:'Samson' },
  { id:'q_ch_h2', categoryId:'character', difficulty:'hard',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'I was struck blind on the road to Damascus and later became a great apostle. Who am I?', answer:'Paul (Saul of Tarsus)' },

  { id:'q_hs_e1', categoryId:'hotseat', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Name as many of the 12 disciples of Jesus as you can!', answer:'Peter, Andrew, James, John, Philip, Bartholomew, Matthew, Thomas, James (Alphaeus), Thaddaeus, Simon the Zealot, Judas Iscariot', hotSeatFields:{challenge:'Name as many of the 12 disciples of Jesus as you can!',acceptableAnswers:['Peter','Andrew','James','John','Philip','Bartholomew','Matthew','Thomas','Thaddaeus','Simon','Judas']} },
  { id:'q_hs_e2', categoryId:'hotseat', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Name as many books of the New Testament as you can!', answer:'Matthew, Mark, Luke, John, Acts, Romans, 1&2 Corinthians, Galatians... (27 total)', hotSeatFields:{challenge:'Name as many books of the New Testament as you can!',acceptableAnswers:['Matthew','Mark','Luke','John','Acts','Romans','Galatians','Ephesians','Philippians','Colossians','Revelation']} },
  { id:'q_hs_m1', categoryId:'hotseat', difficulty:'medium', source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Name as many miracles of Jesus as you can!', answer:'Water to wine, feeding 5,000, walking on water, healing blind man, raising Lazarus, calming storm...', hotSeatFields:{challenge:'Name as many miracles of Jesus as you can!',acceptableAnswers:['water to wine','feeding 5000','walking on water','healing blind','raising Lazarus','calming storm']} },
  { id:'q_hs_h1', categoryId:'hotseat', difficulty:'hard',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Name as many of the Ten Commandments as you can!', answer:'No other gods, no idols, no misuse of name, Sabbath, honour parents, no murder, no adultery, no stealing, no false witness, no coveting', hotSeatFields:{challenge:'Name as many of the Ten Commandments as you can!',acceptableAnswers:['no other gods','no idols','sabbath','honour parents','no murder','no adultery','no stealing','no false witness','no coveting']} },
  { id:'q_hs_h2', categoryId:'hotseat', difficulty:'hard',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Name as many Fruits of the Spirit as you can!', answer:'Love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control (Galatians 5:22-23)', hotSeatFields:{challenge:'Name as many Fruits of the Spirit as you can!',acceptableAnswers:['love','joy','peace','patience','kindness','goodness','faithfulness','gentleness','self-control']} },

  { id:'q_ov_e1', categoryId:'openverse', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Open your Bible to John 11:35. What does this verse say?', answer:'"Jesus wept." — shortest verse in the Bible', openVerseFields:{book:'John',chapter:11,verse:35,verseText:'Jesus wept.'} },
  { id:'q_ov_e2', categoryId:'openverse', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Open your Bible to Genesis 1:1. What does this verse say?', answer:'"In the beginning God created the heavens and the earth."', openVerseFields:{book:'Genesis',chapter:1,verse:1,verseText:'In the beginning God created the heavens and the earth.'} },
  { id:'q_ov_m1', categoryId:'openverse', difficulty:'medium', source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Open your Bible to Romans 8:28. What does this verse say?', answer:'"And we know that in all things God works for the good of those who love him..."', openVerseFields:{book:'Romans',chapter:8,verse:28,verseText:'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.'} },
  { id:'q_ov_h1', categoryId:'openverse', difficulty:'hard',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'Open your Bible to Jeremiah 29:11. What does this verse say?', answer:'"For I know the plans I have for you," declares the LORD...', openVerseFields:{book:'Jeremiah',chapter:29,verse:11,verseText:'"For I know the plans I have for you," declares the LORD, "plans to prosper you and not to harm you, plans to give you hope and a future."'} },

  { id:'q_tf_e1', categoryId:'truefalse', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'True or False: Jesus had 12 disciples.', answer:'TRUE — the 12 apostles', trueFalseFields:{statement:'Jesus had 12 disciples.',isTrue:true,explanation:'The 12 apostles are listed in Matthew 10:2-4.'} },
  { id:'q_tf_e2', categoryId:'truefalse', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'True or False: The Bible says money is the root of all evil.', answer:'FALSE — "the LOVE of money" is the root of all evil (1 Timothy 6:10)', trueFalseFields:{statement:'The Bible says money is the root of all evil.',isTrue:false,explanation:'1 Timothy 6:10 says "the LOVE of money" is the root of all evil.'} },
  { id:'q_tf_e3', categoryId:'truefalse', difficulty:'easy',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'True or False: Noah had three sons.', answer:'TRUE — Shem, Ham and Japheth', trueFalseFields:{statement:'Noah had three sons.',isTrue:true,explanation:'Shem, Ham, and Japheth (Genesis 6:10).'} },
  { id:'q_tf_m1', categoryId:'truefalse', difficulty:'medium', source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'True or False: Paul wrote more books of the NT than any other author.', answer:'TRUE — Paul wrote 13–14 books', trueFalseFields:{statement:'Paul wrote more books of the New Testament than any other author.',isTrue:true,explanation:'Paul authored 13–14 epistles.'} },
  { id:'q_tf_m2', categoryId:'truefalse', difficulty:'medium', source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'True or False: Goliath was from the Philistines.', answer:'TRUE — 1 Samuel 17', trueFalseFields:{statement:'Goliath was from the Philistines.',isTrue:true,explanation:'He was the Philistine champion (1 Samuel 17:4).'} },
  { id:'q_tf_h1', categoryId:'truefalse', difficulty:'hard',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'True or False: Methuselah lived 969 years.', answer:'TRUE — Genesis 5:27', trueFalseFields:{statement:'Methuselah lived 969 years, making him the oldest person in the Bible.',isTrue:true,explanation:'Genesis 5:27 confirms 969 years.'} },
  { id:'q_tf_h2', categoryId:'truefalse', difficulty:'hard',   source:'seed', topicTag:'bible', createdAt:0, updatedAt:0, question:'True or False: The book of Psalms has exactly 100 chapters.', answer:'FALSE — it has 150 Psalms', trueFalseFields:{statement:'The book of Psalms has exactly 100 chapters.',isTrue:false,explanation:'Psalms has 150 chapters, not 100.'} },
]

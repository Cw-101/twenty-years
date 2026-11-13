/**
 * Topics written by the local model, keyed by scene id.
 *
 * Kept in its own file so the 8B never has to edit src/story.js: it appends one
 * object here, a validator checks the shape, and story.js merges whatever passes.
 * Anything malformed is dropped at load rather than breaking the game.
 */
export const EXTRA_TOPICS = {
"debut": [
    {
      "id": "askAboutTheShirt",
      "label": "Ask about the shirt on the wall.",
      "text": "He points at the faded blue jersey hanging by the door, the number 13 stitched above the chest. She frowns, runs a hand over the collar. 'That was the manager's. He retired it after the 2012 final.'"
    }
  ],
"match-day": [
    {
      "id": "askAboutTheStripes",
      "label": "Ask about the stripes on the back of his socks.",
      "text": "He points at the faded yellow and blue stripes on the man\u2019s socks. \"Why those?\" he says. The man shrugs. \"My brother wore them. He was in the reserves.\""
    }
  ],
"first-drink": [
    {
      "id": "askAboutTheStitch",
      "label": "Ask about the stitch in his sock.",
      "text": "He notices a small stitch near the ankle, neat and pale. \"That's from a scrape in the third match of the season,\" he says, avoiding eye contact. \"You were playing right back, weren't you?\""
    }
  ],
"the-interview": [
    {
      "id": "askAboutTheTrophy",
      "label": "Ask about the trophy on the shelf.",
      "text": "He points to the silver cup, dusted but still gleaming. It bears the year 2012 and the name of a team that no longer exists. She sighs, rubbing her temples. 'That was the last time we actually won something.'"
    }
  ],
"training-block": [
    {
      "id": "askAboutTheKneePad",
      "label": "Ask why the knee pad is still there.",
      "text": "He pauses by the equipment rack, eyeing the faded blue pad wedged between the weights. \"Why's that still here?\" he says, voice flat. She looks up from tying her laces, fingers brushing the pad's edge. \"It's for the new guy,\" she says. \"He's got a bad knee.\""
    }
  ],
"the-pills": [
    {
      "id": "askAboutThePills",
      "label": "Ask what the pills are for.",
      "text": "He stares at the white tablets on the windowsill, three of them in a row. She flicks a match against the stone and says, 'They\u2019re for the pain. Not the kind you feel in your leg, the kind that comes after.'"
    }
  ],
"the-mirror": [
    {
      "id": "askAboutTheKnee",
      "label": "Ask about the knee.",
      "text": "He leans closer, eyes on the scar above the knee. \"That\u2019s from the 2012 final,\" she says. \"You were limping for weeks after.\" He says nothing, but the silence stretches like the gap between the two of them."
    }
  ],
"the-brother-returns": [
    {
      "id": "askAboutTheTicket",
      "label": "Ask about the ticket stub in his pocket.",
      "text": "He fiddles with the stub, the ink smudged, the date 23rd April 2012. 'That was the last game he came to,' she says, eyes on the floor. 'You remember, the one after the transfer window.'"
    }
  ],
"the-clause": [
    {
      "id": "askAboutTheLoan",
      "label": "Ask about the loan duration.",
      "text": "He leans back in the chair, fingers steepled. \"Two years,\" she says, avoiding his gaze. \"But the terms are strict. You can't sign with anyone else.\" He nods, eyes on the ceiling, as if the answer is already written there."
    }
  ],
"the-kid": [
    {
      "id": "askAboutTheSocks",
      "label": "Ask why the socks are still on the chair.",
      "text": "He notices the pair of white socks folded neatly on the chair, untouched by the rest of the pile. 'You never take 'em off?' he asks. She shrugs, eyes on the floor. 'They\u2019re lucky socks.'"
    }
  ],
"the-last-match": [
    {
      "id": "askAboutTheScarf",
      "label": "Ask about the scarf in the corner.",
      "text": "He notices a red scarf draped over a chair, frayed at the edges. He nods towards it. \"That's from the 2008 final,\" she says, voice flat. \"I still wear it sometimes. When I think about it.\""
    }
  ],
"the-garden": [
    {
      "id": "askAboutTheClock",
      "label": "Ask about the clock on the wall.",
      "text": "He tilts his head at the old brass timepiece, its hands frozen at half-past seven. She sighs and runs a finger along the cracked glass. 'It stopped the day he left. Never wound it again.'"
    }
  ],
"the-mirror": [
    {
      "id": "askAboutTheKneeBandage",
      "label": "Ask about the knee bandage.",
      "text": "He notices the white strip wrapped around the lower leg, the edges frayed and uneven. He says nothing. She leans forward, fingers tracing the crease. 'It's from the match at Hillsborough in ninety-one. You were nine then, playing in the park with the other lads.'"
    }
  ],
"the-clause": [
    {
      "id": "askAboutTheLeather",
      "label": "Ask about the leather on the desk.",
      "text": "He leans back, fingers tracing the grain of the desk. The leather is cracked, the stitching loose at the corners. 'It was my father's,' she says, voice low. 'He used to sit there, signing contracts. Doesn't feel right, does it?'"
    }
  ],
"the-scan": [
    {
      "id": "askAboutTheKnee",
      "label": "Ask about the knee.",
      "text": "He stares at the brace on the chair, the plastic cracked near the hinge. She runs a hand over the edge of the table, her nails clipped short. 'It's not the same,' she says. 'Not since the last one.'"
    }
  ],
"the-body": [
    {
      "id": "askAboutTheWires",
      "label": "Ask about the wires on the wall.",
      "text": "He runs his fingers along the frayed cables dangling from the ceiling. She sighs and leans against the doorframe. \"They were meant to be temporary. The electrician said they'd last a season.\" He says nothing and turns back to the pitch."
    }
  ],
"first-drink": [
    {
      "id": "askAboutTheBottle",
      "label": "Ask about the bottle on the windowsill.",
      "text": "He notices a bottle of something amber and thick, half-full, on the windowsill. It\u2019s labelled '2008' in faded ink. She doesn\u2019t look at it. 'That was for the match against Coventry. We had a bit of a night.'"
    }
  ],
"the-interview": [
    {
      "id": "askAboutTheStool",
      "label": "Ask who sat on the stool last night.",
      "text": "He gestures to the wooden chair by the window, its seat scuffed and stained. 'That one,' she says, pointing at the back of the player who just walked in. 'He sat there after the game. Said he needed a moment."
    }
  ],
"the-mirror": [
    {
      "id": "askAboutTheKneeBrace",
      "label": "Ask why the brace is still on the floor.",
      "text": "He bends to pick it up, the plastic cracked at the edges, the Velcro tabs frayed. \"It's not broken,\" she says, voice low. \"It's just not needed anymore.\" He holds it up to the light, the serial number faded, and doesn't say a word."
    }
  ],
"the-brother-returns": [
    {
      "id": "askAboutTheTrophy",
      "label": "Ask about the trophy on the shelf.",
      "text": "He runs his fingers over the silver plating, a small cup with a broken handle. \"That's from the 2012 league cup final,\" she says, avoiding his gaze. \"We won it on penalties.\""
    }
  ],
"the-clause": [
    {
      "id": "askAboutThePension",
      "label": "Ask about the pension details.",
      "text": "He fiddles with the pen behind his ear, the nib scratching against the paper. \"It's a deferred one,\" she says, eyes on the spreadsheet. \"Starts in 2030, but you'll get it all at once.\" He nods, not sure if that's better or worse."
    }
  ],
"the-garden": [
    {
      "id": "askAboutTheRug",
      "label": "Ask about the rug on the floor.",
      "text": "He leans closer, noting the frayed edges and the faint scent of lavender. \"That\u2019s from the house in Cornwall,\" she says, brushing a hand over the pattern. \"Your father used to sit there with his feet up after matches.\""
    }
  ],
"two-countries": [
    {
      "id": "askAboutTheTicket",
      "label": "Ask who bought the ticket for the match.",
      "text": "He glances at the folded programme by the window, the name in faded ink. She frowns, adjusting her scarf. 'My father. He said you'd be here.' He says nothing, but the corner of the ticket is torn, as though it had been ripped from a hand."
    }
  ],
"dropped": [
    {
      "id": "askAboutTheShinGuard",
      "label": "Ask about the shin guard on the bench.",
      "text": "He leans against the wall, eyeing the pair of shin guards resting on the old wooden bench. A faded logo peeks from the top. 'That one's still got the 2008 badge,' she says, brushing dust from the plastic. He notices the crack running from the toe to the heel."
    }
  ],
"debut": [
    {
      "id": "askAboutTheMug",
      "label": "Ask about the mug on the desk.",
      "text": "He points at the chipped white mug beside the manager's phone. \"That one?\" the manager says, not looking up. \"My dad's. He used to drink tea in it every morning.\" He pauses, then adds, \"It's got a crack in it from the last game.\""
    }
  ],
"match-day": [
    {
      "id": "askAboutTheShirt",
      "label": "Ask about the shirt on the chair.",
      "text": "He leans in, eyes on the faded number 10 by the door. \"That yours?\" he says, voice low. She glances at it, then back at him. \"It was. Before the loan.\""
    }
  ],
"first-drink": [
    {
      "id": "askAboutTheEmptyGlass",
      "label": "Ask about the empty glass on the table.",
      "text": "He notices the glass by the window, half-full of something amber. It\u2019s been there since the match. She leans back, fingers tracing the rim. 'It was my father\u2019s. He used to drink it every Friday after the team came home.'"
    }
  ],
"training-block": [
    {
      "id": "askAboutTheKneeSupport",
      "label": "Ask about the knee support in the kit.",
      "text": "He points at the brace strapped to her left knee, the plastic stiff with age. She adjusts it with a sigh. \"It's from the 2012 final,\" she says. \"Still holds up, I guess.\""
    }
  ],
"the-clause": [
    {
      "id": "askAboutTheMortgage",
      "label": "Ask about the mortgage on the house.",
      "text": "He leans back in the chair, fingers steepled. 'Still in your name?' he says. She stares at the ceiling, then at the floor. 'It's in the clause,' she says. 'The one you can't break.'"
    }
  ],
"the-garden": [
    {
      "id": "askAboutTheTea",
      "label": "Ask who made the tea.",
      "text": "He leans against the windowsill, watching the steam curl from the mugs on the side table. She sighs and runs a hand through her hair. \"It's your aunt's recipe,\" she says. \"She used to make it every Sunday.\""
    }
  ],
"debut": [
    {
      "id": "askAboutTheKitBag",
      "label": "Ask about the kit bag by the window.",
      "text": "He leans against the changing room door, eyeing the faded blue bag beside the window. \"That's the one from last season,\" says the physio, wiping his hands on a towel. \"Still got a couple of pairs of socks in there.\" He nods, not sure if he's supposed to say anything else."
    }
  ],
"match-day": [
    {
      "id": "askAboutTheMug",
      "label": "Ask about the mug on the desk.",
      "text": "He points at the chipped white mug beside the phone. \"That\u2019s from the 2008 final,\" she says, avoiding his eyes. \"You remember, the one with the broken handle.\" He frowns, trying to recall, but the date slips away like a lost ticket."
    }
  ],
"first-drink": [
    {
      "id": "askAboutTheCup",
      "label": "Ask about the cup on the windowsill.",
      "text": "He notices a white porcelain cup, half full of cold tea, perched on the windowsill. He points at it. 'That one,' she says, eyes down. 'My dad\u2019s. He used to drink it every morning before work. Still does, I suppose.'"
    }
  ],
"the-clause": [
    {
      "id": "askAboutTheLoan",
      "label": "Ask about the loan terms.",
      "text": "He leans back in the chair, fingers tapping the edge of the desk. The papers in front of him are thick with ink and red ticks. 'You said it was six months,' he says. She frowns, looking down at the documents. 'It was. But the fee's still pending.'"
    }
  ],
"the-kid": [
    {
      "id": "askAboutTheShirt",
      "label": "Ask who the shirt belongs to.",
      "text": "He eyes the singed number 13 on the back of the shirt hanging by the door. \"That's from the 2008 League Cup final,\" says the older player, brushing a smudge of sweat from his collar. \"Burned through the washing.\""
    }
  ],
"the-garden": [
    {
      "id": "askAboutThePhotograph",
      "label": "Ask about the photograph on the mantel.",
      "text": "He points at the framed image of a young man in a red shirt, arms raised, a crowd in the background. She folds her hands and says, 'That was his father. Played for Blackburn Rovers in the nineties.' He nods, looking at the faded edges, the way the light catches the glass."
    }
  ],
"debut": [
    {
      "id": "askAboutTheSocks",
      "label": "Ask about the socks on the bench.",
      "text": "He glances at the pair folded neatly by the substitutes\u2019 bench, the blue stripe faded to a ghost of itself. \"Those the manager\u2019s?\" he says, trying not to sound too eager. She shrugs, fingers brushing the fabric. \"They\u2019re his. He won\u2019t wear them unless it\u2019s a matchday.\""
    }
  ],
"the-scan": [
    {
      "id": "askAboutTheKneeScan",
      "label": "Ask about the knee scan results.",
      "text": "He leans closer, fingers brushing the edge of the scan report. \"It's a minor tear,\" the physio says, eyes fixed on the screen. \"Nothing that won't heal with rest.\" He nods, but the silence lingers, heavy with unspoken doubts."
    }
  ],
"training-block": [
    {
      "id": "askAboutTheKneePad",
      "label": "Ask about the knee pad on the bench.",
      "text": "He bends to adjust his own brace, brushing against a thick pad on the bench. \"Is that for a sprain?\" he says, voice low. She shrugs, fingers tracing the edge of it. \"It's just a pad,\" she says, but her eyes linger on the scar beneath it."
    }
  ],
"the-pills": [
    {
      "id": "askAboutTheKnee",
      "label": "Ask about the knee scar.",
      "text": "He stares at the scar above the knee, thin and pale, like a line of chalk. \"It's nothing,\" she says, avoiding his gaze. \"Just a scrape from a tackle in '07.\" He doesn't mention the doctor's note tucked behind the sofa."
    }
  ],
"the-clause": [
    {
      "id": "askAboutTheFee",
      "label": "Ask about the fee structure.",
      "text": "He leans back in the chair, fingers steepled. \"How's the fee split?\" he says, watching her closely. She fidgets with the pen in her hand, avoiding his gaze. \"It's not something we discuss here,\" she replies, voice clipped."
    }
  ],
"the-big-club": [
    {
      "id": "askAboutTheStadiumSeating",
      "label": "Ask about the stadium seating.",
      "text": "He eyes the row of seats behind the dugout, numbered 12 to 27. \"They\u2019re not used anymore,\" says the scout, eyes on his clipboard. \"The new owners wanted a modern look.\" He nods, the numbers feeling like a quiet rebellion."
    }
  ],
"debut": [
    {
      "id": "askAboutTheKit",
      "label": "Ask about the kit number on the back.",
      "text": "He points at the sleeveless top with a number three stitched on the back. \"That's the new academy kid,\" says the scout, leaning against the wall. \"Wears it every session.\""
    }
  ],
"training-block": [
    {
      "id": "askAboutTheKneeSupport",
      "label": "Ask about the knee support on the bench.",
      "text": "He leans against the bench, eyeing the crumpled black brace tucked beneath a training manual. \"Is that the one from the last game?\" he says, voice low. She glances at it, then back at him. \"It\u2019s been through worse.\""
    }
  ],
"the-mirror": [
    {
      "id": "askAboutTheKneePad",
      "label": "Ask about the knee pad on the chair.",
      "text": "He notices a thick black pad on the corner of the chair. It\u2019s cracked and stained. \"That\u2019s from the final,\" she says, avoiding his gaze. \"You used it in 2012.\" He says nothing, but the pad feels heavier than it should."
    }
  ],
"the-big-club": [
    {
      "id": "askAboutTheKitBag",
      "label": "Ask about the kit bag on the bench.",
      "text": "He eyes the faded blue bag slumped against the concrete edge. It bears the initials of a club he used to support. 'You still keep it?' he says, voice flat. She shrugs, fingers brushing the zip. 'It\u2019s all I\u2019ve got left from the last game at the old ground.'"
    }
  ],
"the-clause": [
    {
      "id": "askAboutTheFees",
      "label": "Ask about the fee structure.",
      "text": "He leans back in the chair, fingers steepled. The man at the desk clears his throat. \"It\u2019s a flat \u00a3250,000 for the first year, plus a 10% bonus if the team finishes in the top half of the league.\" He says it like it\u2019s a fact, not a promise."
    }
  ],
"dropped": [
    {
      "id": "askAboutTheStitch",
      "label": "Ask about the stitch in his ankle.",
      "text": "He leans closer, eyeing the white thread poking through the sock. \"That\u2019s from the last game,\" says the physio, avoiding his gaze. \"You tore it clean through.\""
    }
  ],
"the-garden": [
    {
      "id": "askAboutTheTie",
      "label": "Ask about the tie on the back of the chair.",
      "text": "He notices the red and white pattern, frayed at the edges, lying on the back of the chair. He leans forward slightly. \"That yours?\" he asks. She looks down at it, then back at him. \"No,\" she says. \"It was his.\""
    }
  ],
"match-day": [
    {
      "id": "askAboutTheTowel",
      "label": "Ask why the towel is folded like that.",
      "text": "He notices the towel draped over the back of the chair, folded with military precision. She looks at it, then at the floor. \"It was my dad's. He used to fold it like that before matches.\" She says it quickly, as if the words might vanish. He nods, but the shape of the fold still lingers in his mind."
    }
  ],
"the-clause": [
    {
      "id": "askAboutTheFee",
      "label": "Ask about the fee.",
      "text": "He leans against the desk, fingers tapping the edge of a contract dated 2012. \"That\u2019s a hefty sum,\" he says, glancing at the figure in the bottom right. She shifts in her chair, avoiding eye contact. \"It\u2019s standard,\" she replies, voice clipped. \"For a player of your profile.\""
    }
  ],
"the-kid": [
    {
      "id": "askAboutTheSocks",
      "label": "Ask why the socks are still on the floor.",
      "text": "He crouches to retrieve the pair, white cotton frayed at the toe. 'These were mine,' says the boy, voice low. 'I left them there last week.' He shrugs, not meeting the player's eye, and the player says nothing."
    }
  ],
"the-garden": [
    {
      "id": "askAboutTheMug",
      "label": "Ask about the mug on the windowsill.",
      "text": "He points at the chipped white mug, handle bent slightly to the left. She sighs, running a hand through her hair. \"That was my dad's. He used to drink tea at three in the morning.\""
    }
  ],
"hide-it": [
    {
      "id": "askAboutTheStretcher",
      "label": "Ask why there's a stretcher by the door.",
      "text": "He glances at the stretcher leaning against the wall, its metal frame dulled by years of use. She folds her hands in her lap and says, 'It's for the physio. He keeps it here for the lads to use when they're not in the gym.'"
    }
  ],
"match-day": [
    {
      "id": "askAboutTheShirt",
      "label": "Ask who the shirt belongs to.",
      "text": "He eyes the faded blue number 13 hanging by the window. \"That\u2019s from the 2009 final,\" says the man in the corner, adjusting his tie. He nods, thinking of the way the player had collapsed after scoring, the shirt torn down the back, the crowd roaring through the silence."
    }
  ],
"two-countries": [
    {
      "id": "askAboutTheMatchday",
      "label": "Ask about the matchday schedule.",
      "text": "He leans against the window, fingers tracing the glass. She flips through a yellowing notebook, the pages crisp with age. 'It\u2019s the 14th,' she says, not looking up. 'Southampton, 3pm. You\u2019re on the bench again.'"
    }
  ],
"hide-it": [
    {
      "id": "askAboutTheStraps",
      "label": "Ask about the straps on the boot.",
      "text": "He eyes the cracked leather straps still clinging to the boot. \"They were a present from the boss,\" she says, brushing dust from the toe. \"He said they'd hold up for a season or two.\""
    }
  ],
"the-big-club": [
    {
      "id": "askAboutTheChair",
      "label": "Ask who the chair belongs to.",
      "text": "He eyes the battered armchair by the window, its fabric frayed at the seams. She notices and says, 'That\u2019s from the old stadium. They moved it here when they redeveloped the pitch. It\u2019s got a number on the back, though\u2014number twelve."
    }
  ],
"the-brother-returns": [
    {
      "id": "askAboutTheTicket",
      "label": "Ask who bought the ticket for the match.",
      "text": "He leans back in the chair, fingers tapping the armrest. She fiddles with a programme from last season, the cover faded. 'It was your dad's,' she says. 'He said you'd want to see it.'"
    }
  ],
"the-clause": [
    {
      "id": "askAboutTheClause",
      "label": "Ask about the clause in the contract.",
      "text": "He leans back in the chair, fingers steepled. The lawyer clears his throat. 'It's a standard release clause, nothing unusual. Just a bit of insurance.' He says it like it's a weather report, and she stares at the ceiling as if it might hold the answer."
    }
  ],
"retirement": [
    {
      "id": "askAboutTheStallion",
      "label": "Ask about the stallion in the corner.",
      "text": "He eyes the old black stallion in the corner, its mane matted with dust. \"That was my dad\u2019s,\" she says, brushing a hand over its neck. He says nothing, but the way his fingers curl around the edge of the table suggests he\u2019s thinking of the last time he saw it run."
    }
  ],
"match-day": [
    {
      "id": "askAboutTheLaces",
      "label": "Ask about the laces on the boots.",
      "text": "He eyes the frayed laces on the old pair by the door. \"These are still holding together, aren't they?\" he says. She laughs, a sharp sound. \"They've been through a few matches. A few seasons too.\""
    }
  ],
};

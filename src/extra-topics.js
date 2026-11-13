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
};

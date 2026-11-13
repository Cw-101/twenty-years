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
};

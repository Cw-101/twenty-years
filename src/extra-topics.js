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
};

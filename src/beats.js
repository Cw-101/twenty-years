/**
 * Cinematic chapter openings.
 *
 * One short, concrete image per chapter, shown as a title card before the first
 * scene. Each names an object rather than a feeling — a boot bag, a scan
 * printout, a contract — because objects date and feelings do not.
 *
 * Kept separate from story.js so the prose can be rewritten without touching
 * scene logic.
 */
export const CHAPTER_OPENINGS = [
  'A pair of boots two sizes too big sit by the door of a house off Normanton Road, laced and re-laced by a boy who cannot sit still.',
  'The teamsheet goes up on the wall at ten past two, and his name is fourth from the bottom in a font that makes everyone look like a stranger.',
  'The scan printout is still warm from the printer when the consultant puts it on the light box and says the word ligament.',
  'A contract runs to forty pages, and the number on page eleven is the one everybody in the room is pretending not to look at.',
  'The click-and-collect bay where his grandfather used to stand with a whistle now has a yellow line painted through the middle of it.',
  'The boots go into a bag in the hall and stay there for three weeks before anyone moves them.',
];

/** Opening for the chapter the game is currently in ('' when out of range). */
export function chapterOpening(game) {
  return CHAPTER_OPENINGS[game.chapter] || '';
}

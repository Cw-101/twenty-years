# Twenty Years — design

You are not his agent. You are the thing he hears when he is alone.

He is sixteen and he has just been told he might be good enough. You arrive then.
He never learns what you are — only that when you speak, he listens, and when you
stay quiet, something in him notices.

## Why this is not Football Manager

Football Manager simulates a league. This simulates **one person's inner life**,
and it is played like a Telltale episode: scenes, dialogue, small choices, and
consequences that return years later wearing a different face.

- **You move small things.** You cannot make him score. You can tell him to ring
  his mother, to say no to a drink, to hear the coach's insult as advice.
- **Speech is scarce.** You get **three whispers per chapter**. Every
  intervention costs one; silence is always free. Running out means watching him
  decide alone — which is sometimes the right call and sometimes the tragedy.
- **He remembers.** Choices set flags that change later scenes: the brother he
  snubbed at 19 is the one who takes his money at 31.
- **The output is prose.** At retirement you get his biography, including what he
  finally concluded about the voice.

## Loop

A chapter is a stretch of years (16, 19, 23, 27, 32, 36). Each chapter is a short
sequence of scenes:

```
scene text  →  2–4 choices (some cost a whisper, some are silence)
            →  trust / belief / conscience shift, flags set, memory written
            →  next scene; chapter ends → time jump, whispers refresh
```

At the end: biography + epilogue.

## State

- `trust` — how much he believes you. Low trust makes later whispers fail.
- `belief` — his own self-worth. A player with no belief stops hearing you.
- `conscience` — his integrity. The thing you are quietly responsible for.
- `influence` — whispers left this chapter.
- `flags` + `log` — what happened, and what you said when it did.

## Content model

```js
{
  id: 'first-drink',
  age: 19,
  if: (g) => g.flags.inFirstTeam,
  text: (g) => `…`,
  choices: [
    { label: 'Tell him to go home.', whisper: true, effects: { trust: +4, conscience: +3 },
      log: 'You told him to go home. He did.' },
    { label: 'Say nothing.', effects: { conscience: -2 }, log: 'He stayed out until four.' },
  ],
}
```

Silence is always an option and always free.

## Non-goals

No match engine, no league table, no tactics. His football is narrated, not
simulated — because the decisions worth making never happen on the pitch.

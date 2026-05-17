# TODO List

- [x] Disable locking the player deck in `DeckBuilderScreen.tsx`
- [x] Fix exactly 1 card from every faction's class (melee, ranged, siege) except neutral to be locked (and unlock all others by default) in `cardData.ts`
- [x] Fix animation speed bug (make `useAnimationMultiplier` reactive and apply it to AI delay and card effects)
- [x] Implement Proposal 1: Animated Interactive Mini-Visual Simulations (`TutorialVisual.tsx`) for all 7 Tutorial Slides:
  - **Slide 1:** Mystical spinning runic portal with floating glowing emerald dust.
  - **Slide 2:** Seqential glowing blue Mana crystals and a shining pile of gold coins.
  - **Slide 3:** Miniature high-fidelity Sigil card with pulsing target highlights pointing out Mana Cost, Attack, and Vitality.
  - **Slide 4:** Two mini-cards (Arcane and Nature) linked by a pulsating green synergy energy arc.
  - **Slide 5:** Card trapped in a blizzard (beautiful diagonal falling snow particles diorama confined in card art) with its Attack power debuffed to a pulsing red `1`.
  - **Slide 6:** Beautiful Deck Customization Simulator showing active card sliding into an overlapping deck stack with emerald badge feedback.
  - **Slide 7:** Combat sequence displaying a unit card advancing and slashing an enemy Hero card.

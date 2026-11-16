# Panright Studios: usage rules

1. **Accent** (`--color-accent`) marks one thing per viewport: the primary CTA, the live slate or timecode marker, or keyboard focus. Never headings, body copy, borders, fills, icons in bulk or gradients. Keyboard focus is exempt from the one-per-viewport count.
2. **Glass** is allowed in two places only: the sticky nav (`.glass-nav`) and cards sitting over footage, stills or the Home hero light (`.glass-card`). Never on flat `--color-bg`, never glass inside glass.
3. Footage under glass is graded to `#59626B` or darker first; use `--color-scrim` if it is brighter.
4. **Display type** (Archivo expanded caps, `--text-display`) appears once per page. Every other heading is sentence case at normal width.
5. **Mono labels** carry slate data only: scene numbers, timecode, phase indices, metadata. Uppercase, under 40 characters.
6. **Spacing** comes from the 8-point scale; sections use `--section-y`. When a layout feels unresolved, add space, not a divider or a box.
7. **Corners**: frames and media 0, controls 2px, glass cards 4px. No pills. `--shadow-glass` is the only shadow.
8. **Motion** is opacity plus horizontal travel, settling right to left. Never scale, bounce, parallax, scroll-jacking, loaders or loops.
9. **Colour**: the eight tokens only. Never purple, pink, neon, hue-to-hue gradients, pure `#000` or pure `#FFF`.
10. **Never**: robot, brain, sparkle or circuit imagery; emoji; centred paragraphs; `--color-text-subtle` on glass; any text below AA.

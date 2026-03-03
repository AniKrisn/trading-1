import type { WorldState, CharacterDef } from '../types/narrative';

/* ------------------------------------------------------------------ */
/*  buildDialogueContext                                                */
/* ------------------------------------------------------------------ */

export function buildDialogueContext(
  worldState: WorldState,
  characterDef: CharacterDef,
  recentTurns: { role: string; content: string }[],
  constitution: string,
): string {
  const charState = worldState.characters[characterDef.id];
  const townNarr = worldState.towns[characterDef.townId];

  // Relevant seeds — where this character is involved
  const relevantSeeds = worldState.seeds
    .filter(
      (s) =>
        s.status === 'active' &&
        s.involvedCharacters.includes(characterDef.id),
    )
    .map((s) => `- ${s.description}`)
    .join('\n');

  // Last 3 player memories
  const recentMemories = worldState.playerMemories
    .slice(-3)
    .map((m) => `- ${m}`)
    .join('\n');

  // Recent conversation summary
  const conversationSummary = recentTurns
    .slice(-6)
    .map((t) => `${t.role}: ${t.content}`)
    .join('\n');

  const parts: string[] = [
    `[CONSTITUTION]\n${constitution}`,
    '',
    `[CHARACTER]`,
    `Name: ${characterDef.name}`,
    `Role: ${characterDef.role}`,
    `Personality: ${characterDef.personality}`,
    `Speech pattern: ${characterDef.speechPattern}`,
    `Disposition toward player: ${charState?.disposition ?? characterDef.initialDisposition}/100`,
  ];

  if (townNarr?.atmosphere) {
    parts.push('', `[TOWN ATMOSPHERE]`, townNarr.atmosphere);
  }

  if (relevantSeeds) {
    parts.push('', `[ACTIVE STORYLINES]`, relevantSeeds);
  }

  if (charState?.memories.length) {
    parts.push(
      '',
      `[CHARACTER MEMORIES]`,
      charState.memories.slice(-3).map((m) => `- ${m}`).join('\n'),
    );
  }

  if (recentMemories) {
    parts.push('', `[PLAYER CONTEXT]`, recentMemories);
  }

  if (conversationSummary) {
    parts.push('', `[RECENT CONVERSATION]`, conversationSummary);
  }

  parts.push(
    '',
    `[INSTRUCTIONS]`,
    `Respond as ${characterDef.name}. 2-3 sentences max. Stay in character.`,
  );

  return parts.join('\n');
}

/* ------------------------------------------------------------------ */
/*  buildDevelopmentContext                                             */
/* ------------------------------------------------------------------ */

export function buildDevelopmentContext(
  worldState: WorldState,
  characterDefs: CharacterDef[],
  constitution: string,
): string {
  // Active seeds
  const activeSeeds = worldState.seeds
    .filter((s) => s.status === 'active')
    .map((s) => `- [${s.id}] ${s.description} (characters: ${s.involvedCharacters.join(', ')})`)
    .join('\n');

  // Character states — one line each
  const charLines = characterDefs
    .map((def) => {
      const st = worldState.characters[def.id];
      return `- ${def.name} (${def.role}, ${def.townId}): disposition ${st?.disposition ?? def.initialDisposition}/100`;
    })
    .join('\n');

  // Town atmospheres
  const townLines = Object.values(worldState.towns)
    .map((t) => `- ${t.townId}: ${t.atmosphere || '(no atmosphere set)'}`)
    .join('\n');

  // Player activity summary
  const activityLines: string[] = [];
  if (worldState.activity.townVisits.length > 0) {
    const recent = worldState.activity.townVisits.slice(-3);
    activityLines.push(`Recent visits: ${recent.map((v) => v.townId).join(', ')}`);
  }
  if (worldState.activity.trades.length > 0) {
    const recent = worldState.activity.trades.slice(-3);
    activityLines.push(
      `Recent trades: ${recent.map((t) => `${t.action} ${t.goodId} at ${t.townId}`).join('; ')}`,
    );
  }
  if (worldState.activity.dialogues.length > 0) {
    const recent = worldState.activity.dialogues.slice(-3);
    activityLines.push(`Recent dialogues: ${recent.map((d) => d.characterId).join(', ')}`);
  }
  const activitySummary =
    activityLines.length > 0 ? activityLines.join('\n') : '(no recent activity)';

  const parts: string[] = [
    `[CONSTITUTION]\n${constitution}`,
    '',
    `[ACTIVE SEEDS]`,
    activeSeeds || '(none)',
    '',
    `[CHARACTERS]`,
    charLines,
    '',
    `[TOWN ATMOSPHERES]`,
    townLines,
    '',
    `[PLAYER ACTIVITY]`,
    activitySummary,
    '',
    `[INSTRUCTIONS]`,
    `You are the world development engine. Advance the world by returning a JSON object matching the DevelopmentResult schema.`,
    `Fields (all optional):`,
    `- updatedAtmospheres: [{ townId, atmosphere }] — new atmosphere descriptions`,
    `- newRumors: [{ townId, rumor }] — rumors circulating in towns`,
    `- newEvents: [{ townId, event }] — notable events that occurred`,
    `- newSeeds: [{ id, description, status, involvedCharacters }] — new narrative threads`,
    `- resolvedSeedIds: string[] — seed ids that have concluded`,
    `- characterUpdates: [{ characterId, disposition?, memory? }] — character changes`,
    `- newFacts: string[] — new established world facts`,
    '',
    `Return ONLY valid JSON. No commentary outside the JSON object.`,
  ];

  return parts.join('\n');
}

/* ------------------------------------------------------------------ */
/*  buildEntropyContext                                                 */
/* ------------------------------------------------------------------ */

export function buildEntropyContext(
  worldState: WorldState,
  constitution: string,
): string {
  // Full seed dump
  const seedDump = worldState.seeds
    .map(
      (s) =>
        `- [${s.id}] status=${s.status} created=tick${s.tickCreated}: ${s.description}`,
    )
    .join('\n');

  // Full facts dump
  const factsDump = worldState.facts
    .map((f, i) => `- [${i}] ${f}`)
    .join('\n');

  const parts: string[] = [
    `[CONSTITUTION]\n${constitution}`,
    '',
    `[ALL SEEDS]`,
    seedDump || '(none)',
    '',
    `[ALL FACTS]`,
    factsDump || '(none)',
    '',
    `[PLAYER MEMORIES]`,
    worldState.playerMemories.map((m) => `- ${m}`).join('\n') || '(none)',
    '',
    `[INSTRUCTIONS]`,
    `You are the entropy cleanup engine. Review all seeds and facts above.`,
    `Identify stale seeds (active but no longer relevant), contradictory facts, and redundant content.`,
    `Return a JSON object matching DevelopmentResult with:`,
    `- resolvedSeedIds: seed ids to expire/resolve`,
    `- newFacts: corrected or consolidated facts (if needed)`,
    `- characterUpdates: any disposition corrections`,
    '',
    `Return ONLY valid JSON. No commentary outside the JSON object.`,
  ];

  return parts.join('\n');
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { useWorldStore } from '@/store/worldStore';
import { processDialogue } from '@/narrative/dialogue';
import { getLLMClient } from '@/narrative/llmClient';
import { CHARACTER_BY_TOWN } from '@/data/characters';
import { CONSTITUTION } from '@/data/constitution';
import type { TownId } from '@/types';

export function DialoguePanel({ townId, onClose }: { townId: TownId; onClose?: () => void }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dialogue = useWorldStore(s => s.dialogue);
  const addDialogueTurn = useWorldStore(s => s.addDialogueTurn);
  const endDialogue = useWorldStore(s => s.endDialogue);
  const addPlayerMemory = useWorldStore(s => s.addPlayerMemory);
  const updateCharacter = useWorldStore(s => s.updateCharacter);

  const characterDef = CHARACTER_BY_TOWN[townId];

  const handleSend = useCallback(async () => {
    if (!characterDef || !dialogue) return;
    const message = input.trim();
    if (!message || loading) return;

    setInput('');
    addDialogueTurn({ role: 'player', content: message });
    setLoading(true);

    try {
      const client = getLLMClient();
      const freshState = useWorldStore.getState();
      const result = await processDialogue(freshState, characterDef, message, client, CONSTITUTION);

      addDialogueTurn({ role: 'npc', content: result.npcReply });

      if (result.memoryEntry) {
        addPlayerMemory(result.memoryEntry);
        updateCharacter(characterDef.id, { memory: `Player discussed: ${message.slice(0, 40)}` });
      }
    } catch (err) {
      addDialogueTurn({ role: 'npc', content: '...' });
      console.error('Dialogue error:', err);
    } finally {
      setLoading(false);
    }
  }, [input, loading, characterDef, dialogue, addDialogueTurn, addPlayerMemory, updateCharacter]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && dialogue) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [dialogue?.turns]);

  if (!characterDef || !dialogue) return null;

  // Split NPC text into action (*...*) and speech (rest), strip quotes
  function parseNpcText(text: string): { action?: string; speech: string } {
    const strip = (s: string) => s.replace(/^[""\u201c]+|[""\u201d]+$/g, '').trim();
    const actionMatch = text.match(/^\s*\*([^*]+)\*\s*/);
    if (actionMatch) {
      return {
        action: actionMatch[1].trim(),
        speech: strip(text.slice(actionMatch[0].length)),
      };
    }
    return { speech: strip(text) };
  }

  return (
    <div className="dialogue-panel">
      <div className="dialogue-header">
        <div className="dialogue-header-left">
          <span className="dialogue-name">{characterDef.name}</span>
          <span className="dialogue-role">{characterDef.role}</span>
        </div>
        <button className="dialogue-close" onClick={onClose || endDialogue}>&times;</button>
      </div>
      <div className="dialogue-turns" ref={scrollRef}>
        {dialogue.turns.map((turn, i) => {
          if (turn.role === 'npc') {
            const { action, speech } = parseNpcText(turn.content);
            return (
              <div key={i} className="dialogue-turn dialogue-npc">
                {action && <span className="dialogue-action">{action}</span>}
                <span className="dialogue-speaker">{characterDef.name}:</span>{' '}
                {speech}
              </div>
            );
          }
          return (
            <div key={i} className="dialogue-turn dialogue-player">
              <span className="dialogue-speaker">You:</span>{' '}
              {turn.content}
            </div>
          );
        })}
        {loading && (
          <div className="dialogue-turn dialogue-npc">
            <span className="dialogue-speaker">{characterDef.name}:</span> ...
          </div>
        )}
      </div>
      <div className="dialogue-input-row">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Say something..."
          className="dialogue-field"
          disabled={loading}
          autoFocus
        />
      </div>
    </div>
  );
}

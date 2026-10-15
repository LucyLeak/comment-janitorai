// components/Reactions.js
//
// useReactions(): loads the reaction counts for a list of comments / status posts.
// ReactionBar:    the row of emote chips plus the "+" button and emote picker.
import { useState, useEffect, useCallback } from 'react';
import { getVisitorId } from '../lib/visitor';

const MAX_PER_VISITOR = 5;

export function useReactions(targetType, ids) {
  const [byTarget, setByTarget] = useState({});
  const idsKey = ids.join(',');

  useEffect(() => {
    if (!idsKey) {
      setByTarget({});
      return undefined;
    }
    let cancelled = false;
    fetch(`/api/reactions?type=${targetType}&ids=${encodeURIComponent(idsKey)}`, {
      headers: { 'x-visitor-id': getVisitorId() },
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : { reactions: {} }))
      .then((data) => {
        if (!cancelled) setByTarget(data.reactions || {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [targetType, idsKey]);

  const update = useCallback((id, list) => {
    setByTarget((current) => ({ ...current, [id]: list }));
  }, []);

  return { byTarget, update };
}

export function ReactionBar({
  targetType,
  targetId,
  reactions = [],
  emojiMap = {},
  emojiList = [],
  canReact = true,
  lockedMessage = '',
  onChange,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const noun = targetType === 'status' ? 'post' : 'comment';
  const mineCount = reactions.filter((r) => r.mine).length;
  const addTip = canReact
    ? `Add a reaction! Pick up to ${MAX_PER_VISITOR} emotes per ${noun}. Click a reaction again to remove it.`
    : lockedMessage || 'Reactions are locked here.';

  const showNote = (text) => {
    setNote(text);
    setTimeout(() => setNote(''), 4000);
  };

  const toggle = async (emojiName) => {
    if (busy || !canReact) return;
    setPickerOpen(false);
    const active = reactions.some((r) => r.emoji === emojiName && r.mine);
    if (!active && mineCount >= MAX_PER_VISITOR) {
      showNote(`You can add up to ${MAX_PER_VISITOR} reactions per ${noun}.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-visitor-id': getVisitorId(),
        },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          emoji: emojiName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showNote(data.error || 'Could not save your reaction.');
        return;
      }
      if (onChange) onChange(data.reactions || []);
    } catch (err) {
      showNote('Could not save your reaction.');
    } finally {
      setBusy(false);
    }
  };

  const visible = reactions.filter((r) => r.count > 0);

  return (
    <div className="rx-row">
      {visible.map((r) => {
        const url = emojiMap[r.emoji];
        const content = (
          <>
            {url ? <img src={url} alt={r.emoji} /> : <span>:{r.emoji}:</span>}
            <span className="rx-count">{r.count}</span>
          </>
        );
        return canReact ? (
          <button
            key={r.emoji}
            type="button"
            className={`rx-chip${r.mine ? ' mine' : ''}`}
            onClick={() => toggle(r.emoji)}
            disabled={busy}
            aria-pressed={r.mine}
            title={`:${r.emoji}:`}
          >
            {content}
          </button>
        ) : (
          <span key={r.emoji} className={`rx-chip static${r.mine ? ' mine' : ''}`} title={`:${r.emoji}:`}>
            {content}
          </span>
        );
      })}

      {emojiList.length > 0 && (
        <button
          type="button"
          className="rx-add"
          data-tip={addTip}
          aria-label={addTip}
          aria-disabled={!canReact}
          onClick={() => {
            if (canReact) setPickerOpen((current) => !current);
            else showNote(addTip);
          }}
        >
          +
        </button>
      )}

      {note && (
        <span className="rx-note" role="status">
          {note}
        </span>
      )}

      {pickerOpen && canReact && (
        <div className="rx-picker">
          <div className="rx-hint">
            Pick an emote to react. Up to {MAX_PER_VISITOR} per {noun}; click a reaction again to remove it.
          </div>
          <div className="rx-grid">
            {emojiList.map((emoji) => (
              <button
                key={emoji.name}
                type="button"
                className={`rx-pick${reactions.some((r) => r.emoji === emoji.name && r.mine) ? ' mine' : ''}`}
                title={`:${emoji.name}:`}
                onClick={() => toggle(emoji.name)}
              >
                <img src={emoji.url} alt={emoji.name} />
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .rx-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
          margin: 6px 0 2px;
          position: relative;
        }
        .rx-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 1px 6px;
          font-size: 12px;
          line-height: 18px;
          background: #f2f2f2;
          border: 1px solid #9a9a9a;
          color: #000;
          box-shadow: none;
        }
        .rx-chip.mine {
          background: #dde4ff;
          border-color: #0400ff;
        }
        .rx-chip.static {
          cursor: default;
        }
        .rx-chip img {
          width: 16px;
          height: 16px;
          display: block;
        }
        .rx-count {
          font-weight: 700;
        }
        .rx-add {
          position: relative;
          padding: 0 8px;
          font-size: 14px;
          line-height: 20px;
          min-width: 26px;
        }
        .rx-add[aria-disabled='true'] {
          opacity: 0.6;
          cursor: help;
        }
        .rx-add::after {
          content: attr(data-tip);
          display: none;
          position: absolute;
          left: 0;
          bottom: calc(100% + 6px);
          width: max-content;
          max-width: 230px;
          padding: 5px 8px;
          background: #303030;
          color: #fff;
          font-size: 12px;
          line-height: 1.3;
          font-weight: 400;
          text-align: left;
          white-space: normal;
          z-index: 10000;
          pointer-events: none;
        }
        .rx-add:hover::after,
        .rx-add:focus-visible::after {
          display: block;
        }
        .rx-note {
          font-size: 12px;
          color: #8a1c1c;
        }
        .rx-picker {
          flex-basis: 100%;
          border: 1px solid #5e5e5e;
          background: #f2f2f2;
          padding: 6px;
          margin-top: 2px;
        }
        .rx-hint {
          font-size: 12px;
          color: #4a4a4a;
          margin-bottom: 6px;
        }
        .rx-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: 140px;
          overflow-y: auto;
        }
        .rx-pick {
          width: 22px;
          height: 22px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #9a9a9a;
          background: #fff;
          box-shadow: none;
        }
        .rx-pick.mine {
          border-color: #0400ff;
          background: #dde4ff;
        }
        .rx-pick img {
          width: 16px;
          height: 16px;
          display: block;
        }
      `}</style>
    </div>
  );
}
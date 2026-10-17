import { getStatus, getStatusReactions } from '../../../lib/status-db';
import fs from 'fs';
import path from 'path';

function escapeXML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'w', seconds: 604800 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
  ];
  for (const { label, seconds: sec } of intervals) {
    const count = Math.floor(seconds / sec);
    if (count >= 1) return `${count}${label}`;
  }
  return 'now';
}

function approximateTextWidth(text, fontSize = 12) {
  const wideCharRegex = /[^\u0000-\u00ff]/g;
  const wideChars = (text.match(wideCharRegex) || []).length;
  const narrowChars = text.length - wideChars;
  return (wideChars * fontSize) + (narrowChars * (fontSize * 0.55));
}

const SAFE_AVATAR_REGEX = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;

const ALLOWED_EXTS = new Set(['.png', '.gif', '.jpg', '.jpeg', '.webp']);

// Emote files are only read when this badge actually shows them, and are then
// kept in memory while the server stays warm, so the badge stays light.
const emojiDataCache = new Map();
let emojiFileIndex = null; // emote name -> file name

function getEmojiFileIndex() {
  if (emojiFileIndex) return emojiFileIndex;
  const index = new Map();
  try {
    const dir = path.join(process.cwd(), 'public', 'emojis');
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => {
        const ext = path.extname(file);
        if (ALLOWED_EXTS.has(ext.toLowerCase())) index.set(path.basename(file, ext), file);
      });
    }
  } catch (err) {
    // no emotes available: the badge just shows text
  }
  emojiFileIndex = index;
  return index;
}

function getEmojiMap(names) {
  const map = {};
  const index = getEmojiFileIndex();
  for (const name of names) {
    if (map[name] || !index.has(name)) continue;
    if (!emojiDataCache.has(name)) {
      try {
        const file = index.get(name);
        const ext = path.extname(file).toLowerCase();
        const data = fs.readFileSync(path.join(process.cwd(), 'public', 'emojis', file));
        const mime = ext === '.jpg' ? 'image/jpeg' : `image/${ext.replace('.', '')}`;
        emojiDataCache.set(name, `data:${mime};base64,${data.toString('base64')}`);
      } catch (err) {
        continue;
      }
    }
    map[name] = emojiDataCache.get(name);
  }
  return map;
}

function getBase64PublicImage(fileName) {
  try {
    const filePath = path.join(process.cwd(), 'public', fileName);
    const data = fs.readFileSync(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const mime = ext === '.jpg' ? 'image/jpeg' : `image/${ext.replace('.', '')}`;
    return `data:${mime};base64,${data.toString('base64')}`;
  } catch (err) {
    return '';
  }
}

function tokenizeWithEmojis(text, emojiMap) {
  const tokens = [];
  const regex = /:([a-zA-Z0-9_+\-]+):/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const name = match[1];
    const emoji = emojiMap[name];
    if (emoji) {
      tokens.push({ type: 'emoji', name, value: emoji });
    } else {
      tokens.push({ type: 'text', value: match[0] });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return tokens;
}

function splitTextToken(token) {
  return token.value.split(/(\s+)/).filter(Boolean).map(part => ({
    type: 'text',
    value: part,
  }));
}

function wrapTokens(tokens, maxWidth, fontSize, emojiSize) {
  const lines = [];
  let currentLine = [];
  let currentWidth = 0;

  const pushLine = () => {
    lines.push(currentLine);
    currentLine = [];
    currentWidth = 0;
  };

  tokens.forEach(token => {
    const parts = token.type === 'text' ? splitTextToken(token) : [token];

    parts.forEach(part => {
      const partWidth = part.type === 'emoji'
        ? emojiSize
        : approximateTextWidth(part.value, fontSize);

      if (currentWidth + partWidth > maxWidth && currentLine.length > 0) {
        pushLine();
      }
      currentLine.push(part);
      currentWidth += partWidth;
    });
  });

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

function renderLineTokens(tokens, x, y, fontSize, emojiSize) {
  let cursorX = x;
  let textBuffer = '';
  const textSegments = [];
  const emojiSegments = [];

  const flushText = () => {
    if (!textBuffer) return;
    const safe = escapeXML(textBuffer);
    textSegments.push({ x: cursorX, text: safe });
    cursorX += approximateTextWidth(textBuffer, fontSize);
    textBuffer = '';
  };

  tokens.forEach((token) => {
    if (token.type === 'emoji') {
      flushText();
      emojiSegments.push({ x: cursorX, href: token.value });
      cursorX += emojiSize;
    } else {
      textBuffer += token.value;
    }
  });

  flushText();

  let output = '';
  textSegments.forEach((seg) => {
    output += `<text x="${seg.x}" y="${y}" class="msg" style="font-size:${fontSize}px;">${seg.text}</text>`;
  });
  emojiSegments.forEach((seg) => {
    output += `<image href="${seg.href}" x="${seg.x}" y="${y - emojiSize + 2}" width="${emojiSize}" height="${emojiSize}" />`;
  });
  return output;
}

function renderInlineTokens(tokens, x, y, fontSize, emojiSize, textClass) {
  let cursorX = x;
  let textBuffer = '';
  const textSegments = [];
  const emojiSegments = [];

  const flushText = () => {
    if (!textBuffer) return;
    const safe = escapeXML(textBuffer);
    textSegments.push({ x: cursorX, text: safe });
    cursorX += approximateTextWidth(textBuffer, fontSize);
    textBuffer = '';
  };

  tokens.forEach((token) => {
    if (token.type === 'emoji') {
      flushText();
      emojiSegments.push({ x: cursorX, href: token.value });
      cursorX += emojiSize;
    } else {
      textBuffer += token.value;
    }
  });

  flushText();

  let output = '';
  textSegments.forEach((seg) => {
    output += `<text x="${seg.x}" y="${y}" class="${textClass}" style="font-size:${fontSize}px;">${seg.text}</text>`;
  });
  emojiSegments.forEach((seg) => {
    output += `<image href="${seg.href}" x="${seg.x}" y="${y - emojiSize + 2}" width="${emojiSize}" height="${emojiSize}" />`;
  });
  return output;
}

// Works out which reaction chips fit on one row. Anything that doesn't fit becomes "+N".
function layoutReactionChips(reactions, emojiMap, startX, maxRight) {
  const chipGap = 4;
  const moreWidth = 26; // room kept free for the "+N" label
  const usable = reactions.filter(r => emojiMap[r.emoji]); // skip emotes whose file was deleted
  const items = [];
  let cx = startX;
  for (let i = 0; i < usable.length; i++) {
    const label = usable[i].count > 99 ? '99+' : String(usable[i].count);
    const w = 4 + 12 + 3 + Math.ceil(approximateTextWidth(label, 10)) + 5;
    const reserve = i < usable.length - 1 ? moreWidth : 0;
    if (cx + w > maxRight - reserve) break;
    items.push({ emoji: usable[i].emoji, label, x: cx, w });
    cx += w + chipGap;
  }
  return { items, hidden: usable.length - items.length, nextX: cx };
}

export default async function handler(req, res) {
  let statusList = [];
  try {
    statusList = await getStatus(1) || [];
  } catch (err) {
    console.error('ERROR in status.svg:', err);
  }

  const status = statusList[0];

  // Reactions on the latest status. If this fails, the badge simply shows none.
  let reactions = [];
  if (status && status.id) {
    try {
      reactions = await getStatusReactions(status.id);
    } catch (err) {
      console.error('ERROR loading status reactions:', err);
    }
  }

  // Only the emotes this badge really shows (in the name, the text and the reactions).
  const neededEmotes = new Set(reactions.map(r => r.emoji));
  if (status) {
    for (const text of [status.name, status.message]) {
      for (const m of String(text || '').matchAll(/:([a-zA-Z0-9_+\-]+):/g)) neededEmotes.add(m[1]);
    }
  }
  const emojiMap = getEmojiMap(neededEmotes);

  const width = 392;
  const baseHeight = 76;
  let height = baseHeight; // grows only when the reactions row needs more room
  const padding = 8;
  const nameSize = 14;
  const msgSize = 13;
  const lineHeight = 16;
  const emojiSize = 12;
  const nameEmojiSize = 12;
  const avatarSize = 32; // same size as on the status page
  const avatarGap = 8;
  const backgroundUrl = '';

  const renderedLines = [];
  let defs = '';

  if (status) {
    const timeAgo = formatTimeAgo(status.created_at);
    const nameTokens = tokenizeWithEmojis(status.name || '', emojiMap);
    const messageTokens = tokenizeWithEmojis(status.message || '', emojiMap);

    // Only trust plain base64 image data; anything else could break out of the SVG attribute.
    const hasAvatar = SAFE_AVATAR_REGEX.test(String(status.avatar_url || ''));
    const textStartX = hasAvatar ? padding + avatarSize + avatarGap : padding;
    const maxTextWidth = width - (padding * 2) - (hasAvatar ? (avatarSize + avatarGap) : 0);
    const wrapped = wrapTokens(messageTokens, maxTextWidth, msgSize, emojiSize);
    const blockTop = padding;
    if (hasAvatar) {
      // A 32px square lined up with the name line and the first line of the status.
      // The picture fills the square (centered, extra edges cropped) and gets a thin frame.
      const avatarX = padding;
      const avatarY = blockTop + 2;
      defs = `<clipPath id="avatar-clip"><rect x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" rx="2" ry="2" /></clipPath>`;
      renderedLines.push(
        `<rect x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" rx="2" ry="2" fill="#ffffff" />`
      );
      renderedLines.push(
        `<image href="${status.avatar_url}" x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar-clip)" />`
      );
      renderedLines.push(
        `<rect x="${avatarX + 0.5}" y="${avatarY + 0.5}" width="${avatarSize - 1}" height="${avatarSize - 1}" rx="2" ry="2" fill="none" stroke="#777777" stroke-width="1" />`
      );
    }

    const nameY = blockTop + 14;
    renderedLines.push(renderInlineTokens(nameTokens, textStartX, nameY, nameSize, nameEmojiSize, 'name'));
    renderedLines.push(`<text x="${width - padding}" y="${nameY}" class="date" style="font-size:9px;" text-anchor="end">${timeAgo}</text>`);

    let y = nameY + lineHeight;
    let lastBaseline = nameY;
    wrapped.forEach((lineTokens) => {
      if (y > baseHeight - padding) return;
      renderedLines.push(renderLineTokens(lineTokens, textStartX, y, msgSize, emojiSize));
      lastBaseline = y;
      y += lineHeight;
    });

    // Reaction chips: one small row under the status text (emote + how many people used it).
    const chipHeight = 16;
    const chips = layoutReactionChips(reactions, emojiMap, textStartX, width - padding);
    if (chips.items.length > 0) {
      const rowTop = lastBaseline + 6;
      chips.items.forEach(({ emoji, label, x, w }) => {
        renderedLines.push(`<rect x="${x + 0.5}" y="${rowTop + 0.5}" width="${w - 1}" height="${chipHeight - 1}" rx="3" ry="3" fill="#f2f2f2" stroke="#9a9a9a" stroke-width="1" />`);
        renderedLines.push(`<image href="${emojiMap[emoji]}" x="${x + 4}" y="${rowTop + 2}" width="12" height="12" />`);
        renderedLines.push(`<text x="${x + 4 + 12 + 3}" y="${rowTop + 12}" class="count" style="font-size:10px;">${escapeXML(label)}</text>`);
      });
      if (chips.hidden > 0) {
        renderedLines.push(`<text x="${chips.nextX + 2}" y="${rowTop + 12}" class="count" style="font-size:10px;">+${chips.hidden}</text>`);
      }
      height = Math.max(baseHeight, rowTop + chipHeight + padding);
    }
  } else {
    renderedLines.push(`<text x="${padding}" y="${padding + 16}" class="msg" style="font-size:11px;">no status yet</text>`);
  }

  const defsBlock = defs ? `<defs>${defs}</defs>` : '';
  const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  ${defsBlock}
  <style>
    <![CDATA[
    .name { font-family: "MS UI Gothic", sans-serif; fill: #000000; font-weight: bold; }
    .date { font-family: monospace; fill: #000000; }
    .msg { font-family: "MS UI Gothic", sans-serif; fill: #000000; }
    .count { font-family: "MS UI Gothic", sans-serif; fill: #000000; font-weight: bold; }
    ]]>
  </style>
  ${renderedLines.join('\n')}
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.status(200).send(svg);
}
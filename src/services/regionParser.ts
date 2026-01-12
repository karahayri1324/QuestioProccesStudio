import type { ParsedRegion } from '../types';
import type { DatasetItem } from '../types';

export function parseRegions(gptValue: string): ParsedRegion[] {
  const regions: ParsedRegion[] = [];
  const regex = /<region>([\s\S]*?)<\/region>/g;
  let match: RegExpExecArray | null;
  let index = 1;

  while ((match = regex.exec(gptValue)) !== null) {
    const text = match[1].trim().replace(/^["']|["']$/g, '');

    if (text.toLowerCase().includes('beyaz')) {
      continue;
    }

    regions.push({
      id: `region-${index}`,
      index,
      text,
      startOffset: match.index,
      endOffset: match.index + match[0].length,
    });
    index++;
  }

  return regions;
}

export function getGptConversation(item: DatasetItem) {
  return item.conversations.find(c => c.from === 'gpt') ?? null;
}

export function getRegionsForItem(item: DatasetItem): ParsedRegion[] {
  const gptConversation = getGptConversation(item);
  if (!gptConversation) return [];
  return parseRegions(gptConversation.value);
}

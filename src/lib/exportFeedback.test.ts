import { describe, expect, it } from 'vitest';

import { formatExportSuccess } from './exportFeedback';

describe('formatExportSuccess', () => {
  it('confirms the exported filename', () => {
    expect(formatExportSuccess('midnight.toml')).toBe('Exported "midnight.toml".');
  });
});

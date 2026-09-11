/**
 * Export format type definitions and metadata.
 */

/**
 * Supported terminal emulator export formats.
 */
export type ExportFormat =
  | 'iterm'
  | 'alacritty'
  | 'kitty'
  | 'windows-terminal'
  | 'hyper'
  | 'terminal-app'
  | 'ghostty';

/**
 * Metadata for an export format.
 */
export interface ExportFormatInfo {
  /** Unique identifier for the format. */
  id: ExportFormat;
  /** Human-readable display name. */
  name: string;
  /** File extension (without leading dot). */
  extension: string;
  /** MIME type for download. */
  mimeType: string;
  /** Whether this format is experimental and may not work correctly. */
  experimental?: boolean;
}

/**
 * Registry of all supported export formats with their metadata.
 */
export const EXPORT_FORMATS: ExportFormatInfo[] = [
  { id: 'iterm', name: 'iTerm2', extension: 'itermcolors', mimeType: 'application/xml' },
  { id: 'alacritty', name: 'Alacritty', extension: 'toml', mimeType: 'text/plain' },
  { id: 'kitty', name: 'Kitty', extension: 'conf', mimeType: 'text/plain' },
  { id: 'windows-terminal', name: 'Windows Terminal', extension: 'json', mimeType: 'application/json' },
  { id: 'hyper', name: 'Hyper', extension: 'js', mimeType: 'text/javascript' },
  { id: 'terminal-app', name: 'Terminal.app', extension: 'terminal', mimeType: 'application/xml', experimental: true },
  { id: 'ghostty', name: 'Ghostty', extension: 'conf', mimeType: 'text/plain' },
];

/**
 * Retrieves format info by format ID.
 *
 * :param format: The export format identifier.
 * :returns: The format info, or undefined if not found.
 */
export function getFormatInfo(format: ExportFormat): ExportFormatInfo | undefined {
  return EXPORT_FORMATS.find((f) => f.id === format);
}

/**
 * Terminal color scheme exporters.
 *
 * This module provides export functionality for various terminal emulators.
 * It exposes a unified interface for generating color scheme configurations
 * across different formats.
 */

import type { ColorScheme } from '@/types/color';
import { generatePlist } from '../iterm/plist';
import { generateAlacrittyToml } from './alacritty';
import { generateKittyConf } from './kitty';
import { generateWindowsTerminalJson } from './windows-terminal';
import { generateHyperConfig } from './hyper';
import { generateTerminalApp } from './terminal-app';
import { generateGhosttyConf } from './ghostty';
import { type ExportFormat, getFormatInfo } from './types';

export {
  type ExportFormat,
  type ExportFormatInfo,
  EXPORT_FORMATS,
  getFormatInfo,
} from './types';

export { generateAlacrittyToml } from './alacritty';
export { generateKittyConf } from './kitty';
export { generateWindowsTerminalJson } from './windows-terminal';
export { generateHyperConfig } from './hyper';
export { generateTerminalApp } from './terminal-app';

/**
 * Generates export content for a color scheme in the specified format.
 *
 * :param scheme: The color scheme to export.
 * :param format: The target export format.
 * :param name: Optional name for the scheme (used by some formats in headers/metadata).
 * :returns: The generated configuration content as a string.
 * :raises Error: If the format is not supported.
 */
export function generateExport(
  scheme: ColorScheme,
  format: ExportFormat,
  name: string = 'ColorScheme'
): string {
  switch (format) {
    case 'iterm':
      return generatePlist(scheme);
    case 'alacritty':
      return generateAlacrittyToml(scheme);
    case 'kitty':
      return generateKittyConf(scheme, name);
    case 'windows-terminal':
      return generateWindowsTerminalJson(scheme, name);
    case 'hyper':
      return generateHyperConfig(scheme, name);
    case 'terminal-app':
      return generateTerminalApp(scheme, name);
    case 'ghostty':
      return generateGhosttyConf(scheme, name);
    default: {
      const exhaustiveCheck: never = format;
      throw new Error(`Unsupported export format: ${exhaustiveCheck}`);
    }
  }
}

/**
 * Creates a download for a color scheme in the specified format.
 *
 * :param scheme: The color scheme to download.
 * :param filename: Base filename (without extension).
 * :param format: The target export format.
 */
export function downloadExport(
  scheme: ColorScheme,
  filename: string,
  format: ExportFormat
): void {
  const formatInfo = getFormatInfo(format);
  if (!formatInfo) {
    throw new Error(`Unknown export format: ${format}`);
  }

  const content = generateExport(scheme, format, filename);
  const blob = new Blob([content], { type: formatInfo.mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${formatInfo.extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

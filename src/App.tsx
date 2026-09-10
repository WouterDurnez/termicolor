/**
 * Main application component.
 * Linear-style purple gradient aesthetic.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Container, Grid, Stack, Title, Text, Button, Group, TextInput, Modal, Tabs, Paper, Box, Menu, UnstyledButton, Tooltip, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconDeviceFloppy,
  IconPalette,
  IconHistory,
  IconTerminal2,
  IconMoon,
  IconSun,
  IconChevronDown,
  IconFileImport,
  IconBrandX,
  IconBrandReddit,
  IconCopy,
} from '@tabler/icons-react';
import type { FileWithPath } from '@mantine/dropzone';

import { AppShell } from './components/layout/AppShell';
import { ImageDropzone } from './components/image/ImageDropzone';
import { ImagePreview } from './components/image/ImagePreview';
import { ColorPaletteGrid } from './components/palette/ColorPaletteGrid';
import { ColorMapper } from './components/mapping/ColorMapper';
import { TerminalPreview } from './components/preview/TerminalPreview';
import { ProfileList } from './components/profiles/ProfileList';

import { useColorExtraction } from './hooks/useColorExtraction';
import { useColorMapping } from './hooks/useColorMapping';
import { useProfiles } from './hooks/useProfiles';
import { useExport } from './hooks/useExport';
import { useImport } from './hooks/useImport';
import { useShare } from './hooks/useShare';
import { getSchemeFromUrl, createShareUrl } from './lib/color/urlCodec';
import { ExportMenu } from './components/export/ExportMenu';
import type { ExportFormat } from './lib/exporters';
import { formatExportSuccess } from './lib/exportFeedback';

import type { Profile } from './types/profile';
import type { ExtractedColor } from './types/color';

/**
 * Main application component.
 */
export function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const [saveModalOpened, { open: openSaveModal, close: closeSaveModal }] = useDisclosure(false);

  // Hooks
  const { colors, thumbnail, isLoading: isExtracting, extractColors, clearColors } = useColorExtraction();
  const {
    scheme,
    isDarkMode,
    isGrayscale,
    minContrast,
    readabilityReport,
    vibrantSyntax,
    saturationLevel,
    generateScheme,
    toggleMode,
    setANSIColor,
    setUIColor,
    resetScheme,
    setScheme,
    setMinContrast,
    autoFixContrast,
    randomizeColors,
    randomizeUIColors,
    setVibrantSyntax,
    setSaturationLevel,
  } = useColorMapping();
  const { profiles, isLoading: isLoadingProfiles, create, remove } = useProfiles();
  const { downloadScheme, formats } = useExport();
  const { importFromFile, isImporting, importError } = useImport();
  const { shareToTwitter, shareToReddit, isSharing, trackShare } = useShare();

  // Generate scheme when colors are extracted (only on new colors, not mode toggle)
  // We track the colors reference to avoid regenerating when just toggling dark/light mode
  const colorsRef = useRef(colors);
  useEffect(() => {
    // Only regenerate if colors actually changed (new image uploaded)
    if (colors.length > 0 && colors !== colorsRef.current) {
      colorsRef.current = colors;
      generateScheme(colors);
    }
  }, [colors, generateScheme]);

  // Show warning when grayscale mode is triggered
  useEffect(() => {
    if (isGrayscale && colors.length > 0) {
      notifications.show({
        title: 'Low Color Image',
        message: 'This image has few saturated colors. A grayscale palette has been generated.',
        color: 'yellow',
        autoClose: 5000,
      });
    }
  }, [isGrayscale, colors.length]);

  // Load scheme from URL on mount (for shared links)
  useEffect(() => {
    const urlScheme = getSchemeFromUrl();
    if (urlScheme) {
      setScheme(urlScheme);
      notifications.show({
        title: 'Scheme Loaded',
        message: 'Color scheme loaded from shared link!',
        color: 'green',
      });
      // Clean up URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setScheme]);

  // Handle image drop
  const handleImageDrop = useCallback((files: FileWithPath[]) => {
    const file = files[0];
    if (file) {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setImageUrl(url);

      // Extract colors
      extractColors(file);
    }
  }, [extractColors]);

  // Handle clear
  const handleClear = useCallback(() => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
    clearColors();
    resetScheme();
  }, [imageUrl, clearColors, resetScheme]);

  // Handle regenerate
  const handleRegenerate = useCallback(() => {
    if (colors.length > 0) {
      generateScheme(colors);
      notifications.show({
        title: 'Regenerated',
        message: 'Color scheme has been regenerated from the palette',
        color: 'blue',
      });
    }
  }, [colors, generateScheme]);

  // Handle randomize colors
  const handleRandomize = useCallback(() => {
    randomizeColors();
    notifications.show({
      title: 'Randomized',
      message: 'ANSI colors have been randomized',
      color: 'violet',
    });
  }, [randomizeColors]);

  // Handle randomize UI colors
  const handleRandomizeUI = useCallback(() => {
    randomizeUIColors();
    notifications.show({
      title: 'Randomized',
      message: 'UI colors have been randomized',
      color: 'violet',
    });
  }, [randomizeUIColors]);

  // Handle save profile
  const handleSaveProfile = useCallback(async () => {
    if (!profileName.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a profile name',
        color: 'red',
      });
      return;
    }

    const profile = await create({
      name: profileName.trim(),
      scheme,
      thumbnail: thumbnail ?? undefined,
    });

    if (profile) {
      notifications.show({
        title: 'Saved',
        message: `Profile "${profile.name}" has been saved`,
        color: 'green',
      });
      setProfileName('');
      closeSaveModal();
    }
  }, [profileName, scheme, thumbnail, create, closeSaveModal]);

  // Handle load profile
  const handleLoadProfile = useCallback((profile: Profile) => {
    setScheme(profile.scheme);
    notifications.show({
      title: 'Loaded',
      message: `Loaded profile "${profile.name}"`,
      color: 'blue',
    });
  }, [setScheme]);

  // Handle delete profile
  const handleDeleteProfile = useCallback(async (profile: Profile) => {
    await remove(profile.id);
    notifications.show({
      title: 'Deleted',
      message: `Profile "${profile.name}" has been deleted`,
      color: 'red',
    });
  }, [remove]);

  // Handle export profile
  const handleExportProfile = useCallback((profile: Profile) => {
    downloadScheme(profile.scheme, profile.name);
    notifications.show({
      title: 'Downloaded',
      message: formatExportSuccess(`${profile.name}.itermcolors`),
      color: 'green',
      autoClose: 6000,
    });
  }, [downloadScheme]);

  // Handle export current with format selection
  const handleExportCurrent = useCallback((format: ExportFormat = 'iterm') => {
    const name = profileName.trim() || 'termicolor-scheme';
    const formatInfo = formats.find(f => f.id === format);
    downloadScheme(scheme, name, format);
    notifications.show({
      title: 'Downloaded',
      message: formatExportSuccess(`${name}.${formatInfo?.extension || 'itermcolors'}`),
      color: 'green',
      autoClose: 6000,
    });
  }, [scheme, profileName, downloadScheme, formats]);

  // Handle import .itermcolors file
  const handleImportFile = useCallback(async (file: File) => {
    const imported = await importFromFile(file);
    if (imported) {
      setScheme(imported);
      notifications.show({
        title: 'Imported',
        message: `Loaded color scheme from "${file.name}"`,
        color: 'green',
      });
    } else if (importError) {
      notifications.show({
        title: 'Import Failed',
        message: importError,
        color: 'red',
      });
    }
  }, [importFromFile, importError, setScheme]);

  // Handle share to Twitter
  const handleShareToTwitter = useCallback(async () => {
    try {
      await shareToTwitter(scheme);
    } catch (err) {
      if (err instanceof Error) {
        notifications.show({
          title: 'Share Failed',
          message: err.message,
          color: 'red',
        });
      }
    }
  }, [scheme, shareToTwitter]);

  // Handle share to Reddit
  const handleShareToReddit = useCallback(async () => {
    try {
      await shareToReddit(scheme);
    } catch (err) {
      if (err instanceof Error) {
        notifications.show({
          title: 'Share Failed',
          message: err.message,
          color: 'red',
        });
      }
    }
  }, [scheme, shareToReddit]);

  // Handle copy URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    try {
      const shareUrl = createShareUrl(scheme);
      await navigator.clipboard.writeText(shareUrl);
      trackShare('copy');
      notifications.show({
        title: 'Copied!',
        message: 'Share URL copied to clipboard',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Copy Failed',
        message: 'Could not copy to clipboard',
        color: 'red',
      });
    }
  }, [scheme, trackShare]);

  // Handle color select from palette
  const [selectedColor, setSelectedColor] = useState<ExtractedColor | null>(null);

  // File input ref for import
  const importInputRef = useRef<HTMLInputElement>(null);

  // Handle import file input change
  const handleImportInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportFile(file);
      // Reset input so same file can be re-imported
      e.target.value = '';
    }
  }, [handleImportFile]);

  return (
    <AppShell>
      {/* Hero Header */}
      <Box
        style={{
          position: 'relative',
          borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
          marginBottom: 32,
          paddingTop: 32,
          paddingBottom: 32,
        }}
      >
        {/* Hero glow effect */}
        <Box
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60%',
            height: '200%',
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Container size="lg" style={{ position: 'relative', zIndex: 2 }}>
          <Stack align="center" gap="md">
            <Group gap="md" align="center">
              <Box
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)',
                }}
              >
                <IconTerminal2 size={28} stroke={2} color="#fff" />
              </Box>
              <Title
                order={1}
                className="hero-title"
                style={{
                  fontSize: '2.5rem',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Termicolor
              </Title>
            </Group>
            <Text
              size="lg"
              ta="center"
              maw={500}
              style={{
                color: 'var(--text-secondary)',
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              Create a{' '}
              <Menu
                position="bottom"
                withArrow
                shadow="lg"
                styles={{
                  dropdown: {
                    background: 'rgba(18, 19, 24, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  },
                  item: {
                    '&[data-hovered]': {
                      background: 'rgba(139, 92, 246, 0.15)',
                    },
                  },
                }}
              >
                <Menu.Target>
                  <UnstyledButton
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      color: '#8b5cf6',
                      fontWeight: 600,
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontSize: 'inherit',
                      boxShadow: '0 0 10px rgba(139, 92, 246, 0.15)',
                      transition: 'all 0.2s ease',
                      verticalAlign: 'baseline',
                    }}
                  >
                    {isDarkMode ? 'dark' : 'light'}
                    <IconChevronDown size={12} style={{ marginLeft: 2 }} />
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconMoon size={14} style={{ color: '#8b5cf6' }} />}
                    onClick={() => !isDarkMode && toggleMode()}
                    style={{
                      color: isDarkMode ? '#8b5cf6' : 'var(--text-secondary)',
                      fontWeight: isDarkMode ? 600 : 400,
                    }}
                  >
                    Dark
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconSun size={14} style={{ color: '#ffaa00' }} />}
                    onClick={() => isDarkMode && toggleMode()}
                    style={{
                      color: !isDarkMode ? '#ffaa00' : 'var(--text-secondary)',
                      fontWeight: !isDarkMode ? 600 : 400,
                    }}
                  >
                    Light
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              {' '}terminal theme from any image.
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" style={{ position: 'relative', zIndex: 2 }}>
        <Grid gutter="xl">
          {/* Left column: Tabs with Image/Palette or Profiles */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Tabs defaultValue="create" variant="pills">
              <Tabs.List
                mb="lg"
                grow
                style={{
                  background: 'var(--bg-card)',
                  padding: 4,
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Tabs.Tab
                  value="create"
                  leftSection={<IconPalette size={14} />}
                  style={{
                    fontWeight: 600,
                    fontFamily: '"Space Grotesk", sans-serif',
                    transition: 'all 0.2s ease',
                    fontSize: 13,
                  }}
                >
                  Create
                </Tabs.Tab>
                <Tabs.Tab
                  value="profiles"
                  leftSection={<IconHistory size={14} />}
                  style={{
                    fontWeight: 600,
                    fontFamily: '"Space Grotesk", sans-serif',
                    transition: 'all 0.2s ease',
                    fontSize: 13,
                  }}
                >
                  Saved
                  {profiles.length > 0 && (
                    <Text span ml={4} size="xs" style={{ opacity: 0.6 }}>
                      ({profiles.length})
                    </Text>
                  )}
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="create">
                <Stack gap="lg">
                  {/* Hidden file input for import */}
                  <input
                    type="file"
                    ref={importInputRef}
                    onChange={handleImportInputChange}
                    accept=".itermcolors"
                    style={{ display: 'none' }}
                  />

                  {/* Image upload/preview */}
                  {imageUrl ? (
                    <ImagePreview src={imageUrl} onClear={handleClear} />
                  ) : (
                    <Stack gap="sm">
                      <ImageDropzone onDrop={handleImageDrop} loading={isExtracting} />
                      <Button
                        variant="subtle"
                        size="xs"
                        leftSection={<IconFileImport size={14} />}
                        onClick={() => importInputRef.current?.click()}
                        loading={isImporting}
                        style={{
                          color: 'var(--text-secondary)',
                          alignSelf: 'center',
                        }}
                      >
                        or import .itermcolors file
                      </Button>
                    </Stack>
                  )}

                  {/* Extracted palette */}
                  {colors.length > 0 && (
                    <ColorPaletteGrid
                      colors={colors}
                      selectedColor={selectedColor ?? undefined}
                      onColorSelect={setSelectedColor}
                    />
                  )}

                  {/* Actions */}
                  {colors.length > 0 && (
                    <Paper
                      p="md"
                      radius="lg"
                      className="glass-card"
                      style={{
                        border: '1px solid rgba(139, 92, 246, 0.15)',
                      }}
                    >
                      <Stack gap="sm">
                        <Group grow>
                          <Button
                            leftSection={<IconDeviceFloppy size={16} />}
                            onClick={openSaveModal}
                            size="sm"
                            className="accent-btn"
                            style={{
                              background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                              color: '#fff',
                              fontWeight: 600,
                            }}
                          >
                            Save
                          </Button>
                          <ExportMenu onExport={handleExportCurrent} />
                        </Group>
                        <Group gap="xs">
                          <Button
                            leftSection={<IconCopy size={16} />}
                            onClick={handleCopyUrl}
                            size="sm"
                            variant="subtle"
                            style={{
                              flex: 1,
                              background: 'rgba(139, 92, 246, 0.1)',
                              border: '1px solid rgba(139, 92, 246, 0.3)',
                              color: '#8b5cf6',
                              fontWeight: 500,
                            }}
                          >
                            Copy URL
                          </Button>
                          <Tooltip label="Post to X">
                            <ActionIcon
                              variant="subtle"
                              size="lg"
                              onClick={handleShareToTwitter}
                              loading={isSharing}
                              style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#fff',
                              }}
                            >
                              <IconBrandX size={18} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Post to Reddit">
                            <ActionIcon
                              variant="subtle"
                              size="lg"
                              onClick={handleShareToReddit}
                              loading={isSharing}
                              style={{
                                background: 'rgba(255, 69, 0, 0.2)',
                                border: '1px solid rgba(255, 69, 0, 0.3)',
                                color: '#ff4500',
                              }}
                            >
                              <IconBrandReddit size={18} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Stack>
                    </Paper>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="profiles">
                <ProfileList
                  profiles={profiles}
                  isLoading={isLoadingProfiles}
                  onLoad={handleLoadProfile}
                  onDelete={handleDeleteProfile}
                  onExport={handleExportProfile}
                />
              </Tabs.Panel>
            </Tabs>
          </Grid.Col>

          {/* Right column: Color Mapping and Preview (always visible) */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="lg">
              {/* Terminal Preview */}
              <TerminalPreview scheme={scheme} />

              {/* Color Mapper */}
              <ColorMapper
                scheme={scheme}
                extractedColors={colors}
                minContrast={minContrast}
                readabilityReport={readabilityReport}
                vibrantSyntax={vibrantSyntax}
                saturationLevel={saturationLevel}
                onANSIColorChange={setANSIColor}
                onUIColorChange={setUIColor}
                onRegenerate={handleRegenerate}
                onRandomize={handleRandomize}
                onRandomizeUI={handleRandomizeUI}
                onMinContrastChange={setMinContrast}
                onAutoFix={autoFixContrast}
                onVibrantSyntaxChange={setVibrantSyntax}
                onSaturationLevelChange={setSaturationLevel}
              />
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>

      {/* Footer - sticky bottom */}
      <Box
        component="footer"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          textAlign: 'center',
          padding: '2px 20px',
          background: 'linear-gradient(to top, var(--bg-deep) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      >
        <a
          href="https://www.rugvin.be"
          target="_blank"
          rel="noopener noreferrer"
          className="creator-credit"
          aria-label="Made by rugvin"
        >
          <span>made by <strong>rugvin</strong></span>
          <span className="creator-credit__fin" aria-hidden="true">
            <img src="/fin.svg" alt="" width="118" height="71" />
          </span>
        </a>
      </Box>

      {/* Save Profile Modal */}
      <Modal
        opened={saveModalOpened}
        onClose={closeSaveModal}
        title={
          <Group gap="xs">
            <IconDeviceFloppy size={20} style={{ color: '#8b5cf6' }} />
            <Text fw={600}>Save Profile</Text>
          </Group>
        }
        radius="lg"
        styles={{
          content: {
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-subtle)',
          },
          header: {
            background: 'transparent',
          },
        }}
      >
        <Stack gap="lg">
          <TextInput
            label="Profile Name"
            placeholder="My awesome color scheme"
            value={profileName}
            onChange={(e) => setProfileName(e.currentTarget.value)}
            data-autofocus
            size="md"
            styles={{
              label: {
                color: 'var(--text-secondary)',
              },
              input: {
                background: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
                '&::placeholder': {
                  color: 'var(--text-tertiary)',
                },
                '&:focus': {
                  borderColor: 'rgba(139, 92, 246, 0.5)',
                },
              },
            }}
          />
          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              onClick={closeSaveModal}
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              className="accent-btn"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              Save Profile
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AppShell>
  );
}

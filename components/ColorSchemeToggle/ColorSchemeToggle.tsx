'use client';

import { Button, Group, useMantineColorScheme } from '@mantine/core';
import strings from '@/localization';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();

  return (
    <Group justify="center" mt="xl">
      <Button onClick={() => setColorScheme('light')}>{strings.colorSchemeLight}</Button>
      <Button onClick={() => setColorScheme('dark')}>{strings.colorSchemeDark}</Button>
      <Button onClick={() => setColorScheme('auto')}>{strings.colorSchemeAuto}</Button>
    </Group>
  );
}

import { CopyButton as CopyButtonMantine, ActionIcon, Tooltip, rem } from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import strings from '@/localization';

export function CopyButton({ value }: { value: string }) {
  return (
    <CopyButtonMantine value={value} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? strings.copyCopiedTooltip : strings.copyTooltip} withArrow position="right">
          <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
            {copied ? (
              <IconCheck style={{ width: rem(16) }} />
            ) : (
              <IconCopy style={{ width: rem(16) }} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButtonMantine>
  );
}

import { ReactNode, useRef } from 'react';
import { Text, Group, Button, rem, useMantineTheme } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { IconCloudUpload, IconX, IconDownload } from '@tabler/icons-react';
import classes from './DropzoneButton.module.css';
import strings from '@/localization';

export function DropzoneButton({ onDrop, mimeTypes, name, children }: { onDrop: (files: File[]) => void, mimeTypes: string[], name: string, children?: ReactNode }) {
  const theme = useMantineTheme();
  const openRef = useRef<() => void>(null);

  return (
    <div className={classes.wrapper}>
      <Dropzone
        openRef={openRef}
        onDrop={onDrop}
        className={classes.dropzone}
        radius="md"
        accept={mimeTypes}
        maxSize={30 * 1024 ** 2}
      >
        <div style={{ pointerEvents: 'none' }}>
          <Group justify="center">
            <Dropzone.Accept>
              <IconDownload
                style={{ width: rem(50), height: rem(50) }}
                color={theme.colors.blue[6]}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                style={{ width: rem(50), height: rem(50) }}
                color={theme.colors.red[6]}
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconCloudUpload style={{ width: rem(50), height: rem(50) }} stroke={1.5} />
            </Dropzone.Idle>
          </Group>
          {children}
          <Text ta="center" fw={700} fz="lg" mt="xl">
            <Dropzone.Accept>{strings.dropFilesHere}</Dropzone.Accept>
            <Dropzone.Reject>{strings.fileLessThan30mb}</Dropzone.Reject>
            <Dropzone.Idle>{strings.formatString(strings.uploadFileProgress, name)}</Dropzone.Idle>
          </Text>
          <Text ta="center" fz="sm" mt="xs" c="dimmed">
            {strings.formatString(strings.dropAndDropFilesHere, name)}
          </Text>
          <Button className={classes.control} mt="md" size="md" radius="xl" onClick={() => openRef.current?.()}>
            {strings.selectFiles}
          </Button>
        </div>
      </Dropzone>

    </div>
  );
}

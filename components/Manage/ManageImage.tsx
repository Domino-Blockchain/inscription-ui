import { DasApiAsset } from '@metaplex-foundation/digital-asset-standard-api';
import { Box, Button, Center, Image, Loader, Text } from '@mantine/core';
import { MIME_TYPES } from '@mantine/dropzone';
import { useState } from 'react';
import { useNftInscription } from '../Inscribe/hooks';
import { DropzoneButton } from '../Dropzone/DropzoneButton';
import strings from '@/localization';

export function ManageImage({ nft, onUpdate }: { nft: DasApiAsset, onUpdate: (image: File) => void }) {
  const inscriptionInfo = useNftInscription(nft, { fetchImage: true, fetchMetadata: true, fetchJson: true });
  const [image, setImage] = useState<File | null>(null);

  return (
    <>
      {inscriptionInfo.isPending ? <Center h="20vh"><Loader /></Center> :
        <>
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">{strings.inscribedImageTitle}</Text>
          {inscriptionInfo.data?.image ? <Image src={URL.createObjectURL(inscriptionInfo.data?.image)} maw={320} /> :
            <Text fz="xs">{strings.noImageFound}</Text>}

          <Text mt="md" fz="xs" tt="uppercase" fw={700} c="dimmed">{strings.inscribeNewImage}</Text>
          <Box>
            <DropzoneButton
              mimeTypes={[MIME_TYPES.gif, MIME_TYPES.jpeg, MIME_TYPES.png]}
              name="image"
              onDrop={(files) => setImage(files[0])}
            >
              {image &&
                <Center mt="xl">
                <Image src={URL.createObjectURL(image)} maw={320} />
                </Center>
                }
            </DropzoneButton>
          </Box>
          <Button size="md" disabled={!image} onClick={() => onUpdate(image!)}>{strings.updateImageButton}</Button>

        </>}
    </>
  );
}

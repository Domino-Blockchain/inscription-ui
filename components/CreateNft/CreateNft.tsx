import { Button, FileInput, Group, Input, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createNft } from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, percentAmount } from '@metaplex-foundation/umi';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUmi } from '@/providers/useUmi';
import { sha256 } from '@/lib/sha256';
import strings from '@/localization';

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/storage', {
    method: 'POST',
    body: formData,
  });

  const responseJson = await response.json();
  return responseJson.fileUrl;
}

export function CreateNft() {
  const umi = useUmi();
  const router = useRouter();

  const [name, setName] = useState('TestNFT');
  const [description, setDescription] = useState(strings.thisIsATestNFT);
  const [symbol, setSymbol] = useState('TEST');
  const [files, setFiles] = useState<File[]>([]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (files.length <= 0) {
        return;
      }

      const images = await Promise.all(
        files.map(async (file) => ({
          url: await uploadFile(file),
          hash: await sha256(await file.arrayBuffer()),
        }))
      );

      const blob = new Blob(
        [
          JSON.stringify({
            name,
            description,
            images,
          }),
        ],
        {
          type: 'application/json',
        }
      );

      const metadataFile = new File([blob], 'metadata.json', { type: 'application/json' });
      const metadataUrl = await uploadFile(metadataFile);

      const mint = generateSigner(umi);
      const result = await createNft(umi, {
        mint,
        name,
        symbol,
        uri: metadataUrl,
        sellerFeeBasisPoints: percentAmount(0),
        authority: umi.identity,
        updateAuthority: umi.identity,
      }).sendAndConfirm(umi);

      console.log('create done! signature: ', base58.deserialize(result.signature));
      router.push(`/explorer/${mint.publicKey}`);
    },
    onSuccess: () =>
      notifications.show({
        title: strings.successNotificationTitle,
        message: strings.yourNFTHasBeenCreated,
        color: 'green',
      }),
    onError: (error) => console.error(error),
  });

  return (
    <Stack my="lg" gap="sm">
      <Input.Wrapper label={strings.nameLabel} required>
        <Input value={name} onChange={(event) => setName(event.currentTarget.value)} />
      </Input.Wrapper>
      <Input.Wrapper label={strings.descriptionLabel}>
        <Input
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
        />
      </Input.Wrapper>
      <Input.Wrapper label={strings.symbolLabel} required>
        <Input value={symbol} onChange={(event) => setSymbol(event.currentTarget.value)} />
      </Input.Wrapper>
      <FileInput
        label={strings.imageFilesLabel}
        required
        type="button"
        multiple
        accept="image/png,image/jpeg"
        onChange={setFiles}
      />
      <Group justify="flex-end" mt="md">
        <Button onClick={mutate as never} loading={isPending}>
          {strings.createNFTButton}
        </Button>
      </Group>
    </Stack>
  );
}

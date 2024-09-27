import { Button, FileInput, Group, Input, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createNft } from '@metaplex-foundation/mpl-token-metadata';
import {
  createGenericFileFromBrowserFile,
  generateSigner,
  percentAmount,
} from '@metaplex-foundation/umi';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUmi } from '@/providers/useUmi';
import strings from '@/localization';

export function CreateNft() {
  const umi = useUmi();
  const router = useRouter();

  const [name, setName] = useState('TestNFT');
  const [description, setDescription] = useState(strings.thisIsATestNFT);
  const [symbol, setSymbol] = useState('TEST');
  const [file, setFile] = useState<File | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!file) {
        return null;
      }

      const mint = generateSigner(umi);
      console.log('mint address: ', mint.publicKey);

      const genericFile = await createGenericFileFromBrowserFile(file);
      const [fileUri] = await umi.uploader.upload([genericFile]);

      const uri = await umi.uploader.uploadJson({
        name,
        description,
        image: fileUri,
      });

      const result = await createNft(umi, {
        mint,
        name,
        symbol,
        uri,
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
      <FileInput label={strings.imageFileLabel} required type="button" onChange={setFile} />
      <Group justify="flex-end" mt="md">
        <Button onClick={mutate as never} loading={isPending}>
          {strings.createNFTButton}
        </Button>
      </Group>
    </Stack>
  );
}

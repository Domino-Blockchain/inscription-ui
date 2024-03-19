import { Box, Button, Input, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createNft } from '@metaplex-foundation/mpl-token-metadata';
import {
  createGenericFileFromBrowserFile,
  generateSigner,
  percentAmount,
} from '@metaplex-foundation/umi';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUmi } from '@/providers/useUmi';

export function CreateNft() {
  const router = useRouter();
  const umi: any = useUmi();

  const [name, setName] = useState('TestNFT');
  const [description, setDescription] = useState('This is a test NFT');
  const [symbol, setSymbol] = useState('TEST');
  const [imageUri, setImageUri] = useState('');

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = await createGenericFileFromBrowserFile(event.target.files![0]);
    const [fileUri] = await umi.uploader.upload([file]);
    setImageUri(fileUri);
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const mint = generateSigner(umi);
      console.log('mint address: ', mint.publicKey);

      const uri = await umi.uploader.uploadJson({
        name,
        description,
        image: imageUri,
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
        title: 'Success',
        message: 'Your NFT has been created',
        color: 'green',
      }),
  });

  return (
    <Box mt="xl">
      <Text size="sm" my="sm">
        Name
      </Text>
      <Input value={name} onChange={(event) => setName(event.currentTarget.value)} />
      <Text size="sm" my="sm">
        Description
      </Text>
      <Input value={description} onChange={(event) => setDescription(event.currentTarget.value)} />
      <Text size="sm" my="sm">
        Symbol
      </Text>
      <Input value={symbol} onChange={(event) => setSymbol(event.currentTarget.value)} />
      <Text size="sm" my="sm">
        Image
      </Text>
      <Input type="file" onChange={uploadFile} />
      <Text>{imageUri}</Text>
      <Button my="lg" onClick={() => mutate()} loading={isPending}>
        Create NFT
      </Button>
    </Box>
  );
}

import { Button, Group, Input, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  createShard,
  findInscriptionMetadataPda,
  findInscriptionShardPda,
  findMintInscriptionPda,
  initializeFromMint,
  safeFetchInscriptionShard,
  setMint,
  writeData,
} from '@metaplex-foundation/mpl-inscription';
import { createFungible } from '@metaplex-foundation/mpl-token-metadata';
import { TransactionBuilder, generateSigner, percentAmount } from '@metaplex-foundation/umi';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUmi } from '@/providers/useUmi';

export function DeployDpl20() {
  const umi = useUmi();
  const router = useRouter();

  const [ticker, setTicker] = useState('DOMI');
  const [supply, setSupply] = useState('10');
  const [limit, setLimit] = useState('1');

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const mint = generateSigner(umi);
      console.log('mint address: ', mint.publicKey);

      await createFungible(umi, {
        mint,
        name: ticker,
        symbol: ticker,
        uri: '',
        decimals: 9,
        sellerFeeBasisPoints: percentAmount(0),
      }).sendAndConfirm(umi);

      const inscriptionAccount = await findMintInscriptionPda(umi, {
        mint: mint.publicKey,
      });
      const inscriptionMetadataAccount = await findInscriptionMetadataPda(umi, {
        inscriptionAccount: inscriptionAccount[0],
      });

      let builder = new TransactionBuilder();

      const shardNumber = Math.floor(Math.random() * 32);
      const inscriptionShardAccount = findInscriptionShardPda(umi, {
        shardNumber,
      });

      const shardData = await safeFetchInscriptionShard(umi, inscriptionShardAccount);
      if (!shardData) {
        builder = builder.add(
          createShard(umi, {
            shardAccount,
            shardNumber,
          })
        );
      }

      builder = builder
        .add(
          initializeFromMint(umi, {
            mintAccount: mint.publicKey,
            inscriptionShardAccount,
            shard: shardNumber,
          })
        )
        .add(
          setMint(umi, {
            mintInscriptionAccount: inscriptionAccount[0],
            inscriptionMetadataAccount,
            mintAccount: mint.publicKey,
          })
        )
        .add(
          writeData(umi, {
            inscriptionAccount: inscriptionAccount[0],
            inscriptionMetadataAccount,
            value: Buffer.from(
              JSON.stringify({
                p: 'brc-20',
                op: 'deploy',
                tick: ticker,
                max: supply,
                lim: limit,
              })
            ),
            associatedTag: null,
            offset: 0,
          })
        );

      const result = await builder.sendAndConfirm(umi, { confirm: { commitment: 'finalized' } });
      console.log('deploy done! signature: ', base58.deserialize(result.signature));
      router.push(`/explorer/${mint.publicKey}`);
    },
    onSuccess: () =>
      notifications.show({
        title: 'Success',
        message: 'Your BRC-20 token has been deployed',
        color: 'green',
      }),
    onError: (error) => console.error(error),
  });

  return (
    <Stack my="lg" gap="sm">
      <Input.Wrapper label="Name">
        <Input value={ticker} onChange={(event) => setTicker(event.currentTarget.value)} />
      </Input.Wrapper>
      <Input.Wrapper label="Supply">
        <Input value={supply} onChange={(event) => setSupply(event.currentTarget.value)} />
      </Input.Wrapper>
      <Input.Wrapper label="Limit">
        <Input value={limit} onChange={(event) => setLimit(event.currentTarget.value)} />
      </Input.Wrapper>
      <Group justify="flex-end" mt="md">
        <Button onClick={mutate as never} loading={isPending}>
          Deploy
        </Button>
      </Group>
    </Stack>
  );
}

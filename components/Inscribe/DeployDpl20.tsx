import { useUmi } from '@/providers/useUmi';
import { Box, Button, Input, Text } from '@mantine/core';
import {
  findInscriptionMetadataPda,
  findMintInscriptionPda,
  initializeFromMint,
  setMint,
  writeData,
} from '@metaplex-foundation/mpl-inscription';
import { createFungible } from '@metaplex-foundation/mpl-token-metadata';
import { TransactionBuilder, generateSigner, percentAmount } from '@metaplex-foundation/umi';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeployDpl20() {
  const router = useRouter();
  const umi: any = useUmi();

  const [ticker, setTicker] = useState('DOMI');
  const [supply, setSupply] = useState('10');
  const [limit, setLimit] = useState('1');

  async function deployToken() {
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

    const builder = new TransactionBuilder()
      .add(
        initializeFromMint(umi, {
          mintAccount: mint.publicKey,
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
              p: 'dpl-20',
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
    router.push(`/explorer/${inscriptionAccount[0]}`);
  }

  return (
    <Box mt="xl">
      <Text size="sm" my="sm">
        Ticker
      </Text>
      <Input value={ticker} onChange={(event) => setTicker(event.currentTarget.value)} />
      <Text size="sm" my="sm">
        Supply
      </Text>
      <Input value={supply} onChange={(event) => setSupply(event.currentTarget.value)} />
      <Text size="sm" my="sm">
        Limit
      </Text>
      <Input value={limit} onChange={(event) => setLimit(event.currentTarget.value)} />
      <Button my="lg" onClick={deployToken}>
        Deploy
      </Button>
    </Box>
  );
}

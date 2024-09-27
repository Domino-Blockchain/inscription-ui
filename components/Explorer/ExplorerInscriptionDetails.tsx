import { CodeHighlightTabs } from '@mantine/code-highlight';
import {
  Badge,
  Button,
  Center,
  Group,
  Image,
  Input,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  createShard,
  findInscriptionMetadataPda,
  findInscriptionShardPda,
  initialize,
  safeFetchInscriptionShard,
  writeData,
} from '@metaplex-foundation/mpl-inscription';
import { DigitalAsset, TokenStandard, mintV1 } from '@metaplex-foundation/mpl-token-metadata';
import { TransactionBuilder, generateSigner, isNone, publicKey } from '@metaplex-foundation/umi';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useUmi } from '@/providers/useUmi';
import { useNftInscription } from '../Inscribe/hooks';
import { ExplorerStat } from './ExplorerStat';
import RetainQueryLink from '@/components/RetainQueryLink';

export function ExplorerInscriptionDetails({ nft }: { nft: DigitalAsset }) {
  const umi = useUmi();
  const wallet = useWallet();
  const router = useRouter();

  const searchParams = useSearchParams();
  const inscriptionAccountParam = searchParams.get('inscription');

  const inscriptionInfo = useNftInscription(nft, {
    inscriptionAccount: inscriptionAccountParam ? publicKey(inscriptionAccountParam) : undefined,
    fetchImage: true,
    fetchMetadata: true,
    fetchJson: true,
  });

  const [mintAmount, setMintAmount] = useState('0');

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!inscriptionInfo.data) {
        return;
      }

      const mintAddress = inscriptionInfo.data.metadata?.mint;
      if (!mintAddress || isNone(mintAddress)) {
        return;
      }

      const amount = Number(mintAmount);
      const limit = Number(inscriptionInfo.data.json?.lim);

      if (amount > limit) {
        notifications.show({
          title: 'Error',
          message: `You can't mint more than ${limit} BRC-20 tokens at once`,
          color: 'red',
        });
        return;
      }

      await mintV1(umi, {
        mint: mintAddress.value,
        amount: amount * LAMPORTS_PER_SOL,
        tokenOwner: publicKey(wallet.publicKey!.toBase58()),
        tokenStandard: TokenStandard.Fungible,
      }).sendAndConfirm(umi);

      const inscriptionAccount = generateSigner(umi);
      const inscriptionMetadataAccount = findInscriptionMetadataPda(umi, {
        inscriptionAccount: inscriptionAccount.publicKey,
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
            shardAccount: inscriptionShardAccount,
            shardNumber,
          })
        );
      }

      builder = builder
        .add(
          initialize(umi, {
            inscriptionAccount,
            inscriptionShardAccount,
          })
        )
        .add(
          writeData(umi, {
            inscriptionAccount: inscriptionAccount.publicKey,
            inscriptionMetadataAccount,
            value: Buffer.from(
              JSON.stringify({
                p: 'brc-20',
                op: 'mint',
                tick: inscriptionInfo.data.json.tick,
                amt: mintAmount,
              })
            ),
            associatedTag: null,
            offset: 0,
          })
        );

      const result = await builder.sendAndConfirm(umi, { confirm: { commitment: 'finalized' } });
      console.log('minted! signature:', base58.deserialize(result.signature));
      router.push(`/explorer/${mintAddress.value}?inscription=${inscriptionAccount.publicKey}`);
    },
    onSuccess: () =>
      notifications.show({
        title: 'Success',
        message: 'BRC-20 has been successfully minted',
        color: 'green',
      }),
    onError: (error) => console.error(error),
  });

  return (
    <Stack>
      <Text fz="md" tt="uppercase" fw={700} c="dimmed">
        Inscription Details
      </Text>
      {inscriptionInfo.isPending ? (
        <Center h="20vh">
          <Loader />
        </Center>
      ) : inscriptionInfo.error || !inscriptionInfo?.data.metadataPdaExists ? (
        <Center h="20vh">
          <Stack align="center">
            <Text>NFT is not inscribed</Text>
            <RetainQueryLink href="/inscribe">
              <Button>Inscribe now</Button>
            </RetainQueryLink>
          </Stack>
        </Center>
      ) : (
        <>
          <Title>#{inscriptionInfo.data?.metadata?.inscriptionRank.toString()!}</Title>
          {inscriptionInfo.data?.image && (
            <>
              <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
                Inscribed Image
              </Text>
              <Image src={URL.createObjectURL(inscriptionInfo.data?.image)} maw={320} />
            </>
          )}
          <ExplorerStat
            label="Inscription address (JSON)"
            value={inscriptionInfo.data?.inscriptionPda[0]!}
            copyable
          />
          <ExplorerStat
            label="Inscription metadata address"
            value={inscriptionInfo.data?.inscriptionMetadataAccount[0]!}
            copyable
          />
          {inscriptionInfo.data?.imagePdaExists && (
            <ExplorerStat
              label="Inscription image address"
              value={inscriptionInfo.data?.imagePda[0]!}
              copyable
            />
          )}
          {inscriptionInfo.data?.metadata && (
            <>
              <Group gap="xs">
                <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
                  Inscribed JSON
                </Text>
                {!inscriptionInfo.data?.jsonValid && (
                  <Badge color="red" variant="light">
                    Invalid JSON
                  </Badge>
                )}
              </Group>
              <CodeHighlightTabs
                withExpandButton
                expandCodeLabel="Show full JSON"
                collapseCodeLabel="Show less"
                defaultExpanded={false}
                mb="lg"
                code={[
                  {
                    fileName: 'inscribed.json',
                    language: 'json',
                    code: JSON.stringify(inscriptionInfo.data?.json, null, 2),
                  },
                ]}
              />
            </>
          )}
          <Group gap="xs">
            <Input
              value={mintAmount}
              onChange={(event) => setMintAmount(event.target.value)}
              placeholder="Mint amount"
            />
            <Button onClick={() => mutate()} loading={isPending}>
              Mint
            </Button>
          </Group>
        </>
      )}
    </Stack>
  );
}

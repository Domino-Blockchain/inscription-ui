import { useUmi } from '@/providers/useUmi';
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
  findInscriptionMetadataPda,
  initialize,
  writeData,
} from '@metaplex-foundation/mpl-inscription';
import { MaybeRpcAccount, TransactionBuilder, generateSigner } from '@metaplex-foundation/umi';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useInscription } from '../Inscribe/hooks';
import { ExplorerStat } from './ExplorerStat';

export function ExplorerInscriptionDetails({
  inscriptionAccount,
}: {
  inscriptionAccount: MaybeRpcAccount;
}) {
  const umi = useUmi();
  const router = useRouter();
  const inscriptionInfo = useInscription(inscriptionAccount);

  const [mintAmount, setMintAmount] = useState('0');

  async function inscribeMint() {
    if (!inscriptionInfo.data) {
      return;
    }

    // await mintV1(umi, {
    //   mint: mintAddress,
    //   amount: Number(mintAmount),
    //   tokenOwner: publicKey(wallet.publicKey!.toBase58()),
    //   tokenStandard: TokenStandard.Fungible,
    // }).sendAndConfirm(umi);

    const newInscriptionAccount = generateSigner(umi);
    const inscriptionMetadataAccount = await findInscriptionMetadataPda(umi, {
      inscriptionAccount: newInscriptionAccount.publicKey,
    });

    const builder = new TransactionBuilder()
      .add(
        initialize(umi, {
          inscriptionAccount: newInscriptionAccount,
        })
      )
      .add(
        writeData(umi, {
          inscriptionAccount: newInscriptionAccount.publicKey,
          inscriptionMetadataAccount,
          value: Buffer.from(
            JSON.stringify({
              p: 'dpl-20',
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
    router.push(`/explorer/${newInscriptionAccount.publicKey}`);
  }

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
          <Text>NFT is not inscribed</Text>
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
            <Button onClick={inscribeMint}>Mint</Button>
          </Group>
        </>
      )}
    </Stack>
  );
}

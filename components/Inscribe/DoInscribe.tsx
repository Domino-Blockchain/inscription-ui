import {
  Button,
  Center,
  Container,
  Loader,
  Modal,
  Paper,
  Progress,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import pMap from 'p-map';
import { useQueryClient } from '@tanstack/react-query';
import {
  createShard,
  findAssociatedInscriptionAccountPda,
  findInscriptionMetadataPda,
  findInscriptionShardPda,
  findMintInscriptionPda,
  initializeAssociatedInscription,
  initializeFromMint,
  safeFetchInscriptionShard,
} from '@metaplex-foundation/mpl-inscription';
import Compressor from 'compressorjs';
import { useDisclosure } from '@mantine/hooks';
import { Pda, TransactionBuilder, Umi } from '@metaplex-foundation/umi';
import { DasApiAsset } from '@metaplex-foundation/digital-asset-standard-api';
import { notifications } from '@mantine/notifications';
import { useUmi } from '@/providers/useUmi';
import { InscriptionSettings } from './ConfigureInscribe';
import { useEnv } from '@/providers/useEnv';
import {
  buildAllocate,
  buildChunkedWriteData,
  prepareAndSignTxs,
  sendTxsWithRetries,
} from '@/lib/tx';
import { DigitalAsset } from '@metaplex-foundation/mpl-token-metadata';

const sizeOf = require('browser-image-size');

type Calculated = {
  json: any;
  jsonLength: number;
  newImage?: Blob | File;
  nft: DigitalAsset;
  quality: number;
  size: number;
  format: string;
  inscriptionPda: Pda;
  inscriptionMetadataAccount: Pda;
  imagePda: Pda;
  // pdaExists: boolean;
  // imagePdaExists: boolean;
};

export function DoInscribe({
  inscriptionSettings,
  onComplete,
}: {
  inscriptionSettings: InscriptionSettings[];
  onComplete: (txs: string[]) => void;
}) {
  const env = useEnv();
  const [summary, setSummary] = useState<{ calculated: Calculated[]; totalSize: number }>();
  const [progress, setProgress] = useState<number>(0);
  const [maxProgress, setMaxProgress] = useState<number>(0);
  const [opened, { open, close }] = useDisclosure(false);
  const [showRetry, setShowRetry] = useState(false);
  const client = useQueryClient();
  const umi = useUmi();

  useEffect(() => {
    const doIt = async () => {
      // we recalculate everything because of collation
      const calculated: Calculated[] = await pMap(
        inscriptionSettings,
        async (settings) => {
          const { nft, format, quality, size, imageType, jsonOverride, imageOverride } = settings;

          let json = jsonOverride;
          if (!json) {
            json = await client.fetchQuery({
              queryKey: ['fetch-nft-json', settings.nft.publicKey],
              queryFn: async () => {
                const j = await (await fetch(nft.metadata.uri)).json();
                return j;
              },
            });
          }

          let image = imageOverride;
          if (imageType === 'Raw' || imageType === 'Compress') {
            image = await client.fetchQuery({
              queryKey: ['fetch-uri-blob', json.image],
              queryFn: async () => {
                const blob = await (await fetch(json.image)).blob();
                return blob;
              },
            });
          }

          const inscriptionData = await client.fetchQuery({
            queryKey: ['fetch-nft-inscription', env, nft.publicKey],
            queryFn: async () => {
              const inscriptionPda = findMintInscriptionPda(umi, { mint: nft.mint.publicKey });
              const inscriptionMetadataAccount = findInscriptionMetadataPda(umi, {
                inscriptionAccount: inscriptionPda[0],
              });
              const imagePda = findAssociatedInscriptionAccountPda(umi, {
                associationTag: 'image',
                inscriptionMetadataAccount: inscriptionMetadataAccount[0],
              });

              // const pdaExists = await accountExists(umi, inscriptionPda[0]);
              // const imagePdaExists = await accountExists(umi, imagePda[0]);

              return {
                inscriptionPda,
                inscriptionMetadataAccount,
                imagePda,
                // pdaExists,
                // imagePdaExists,
              };
            },
          });

          if (image && imageType === 'Compress') {
            // TODO optimize, only download headers
            const { width, height } = await sizeOf(image);
            image = await new Promise((resolve, reject) => {
              // eslint-disable-next-line no-new
              new Compressor(image as Blob, {
                quality: quality / 100,
                width: width * (size / 100),
                height: height * (size / 100),
                mimeType: format,
                success(result) {
                  resolve(result);
                },
                error(err) {
                  reject(err);
                },
              });
            });
          }

          return {
            ...inscriptionData,
            json,
            jsonLength: JSON.stringify(json).length,
            newImage: image,
            quality,
            size,
            nft,
            format,
          };
        },
        {
          concurrency: 5,
        }
      );

      let size = 0;

      calculated.forEach((c) => {
        if (c.newImage) {
          size += c.newImage.size;
        }
        size += c.jsonLength;
      });

      setSummary({
        calculated,
        totalSize: size,
      });
    };
    doIt();
    setShowRetry(false);
  }, [inscriptionSettings]);

  const handleInscribe = useCallback(
    async (skipInit?: boolean) => {
      if (!summary) {
        return;
      }
      try {
        open();
        setProgress(0);

        let setupBuilder = new TransactionBuilder();
        let dataBuilder = new TransactionBuilder();
        const imageDatas = (
          await Promise.all(summary.calculated.map((c) => c.newImage?.arrayBuffer()))
        ).map((b) => (b ? new Uint8Array(b) : null));
        const enc = new TextEncoder();

        // TODO skip the inits if they already exist
        /* eslint-disable-next-line */
        for (const [index, c] of summary.calculated.entries()) {
          console.log('initializing', c.nft.publicKey);

          const shardNumber = Math.floor(Math.random() * 32);
          const shardAccount = findInscriptionShardPda(umi, { shardNumber });

          // Check if the account has already been created.
          // eslint-disable-next-line no-await-in-loop
          const shardData = await safeFetchInscriptionShard(umi, shardAccount);
          if (!shardData) {
            setupBuilder = setupBuilder.add(
              createShard(umi, {
                shardAccount,
                shardNumber,
              })
            );
          }

          setupBuilder = setupBuilder.add(
            initializeFromMint(umi, {
              mintAccount: c.nft.mint.publicKey,
              inscriptionShardAccount: shardAccount,
            })
          );

          setupBuilder = buildAllocate({
            builder: setupBuilder,
            umi,
            inscriptionAccount: c.inscriptionPda[0],
            inscriptionMetadataAccount: c.inscriptionMetadataAccount,
            associatedTag: null,
            targetSize: c.jsonLength,
          });

          if (c.newImage) {
            setupBuilder = setupBuilder.add(
              initializeAssociatedInscription(umi, {
                inscriptionAccount: c.inscriptionPda[0],
                associationTag: 'image',
                inscriptionMetadataAccount: c.inscriptionMetadataAccount,
              })
            );

            setupBuilder = buildAllocate({
              builder: setupBuilder,
              umi,
              inscriptionAccount: c.imagePda,
              inscriptionMetadataAccount: c.inscriptionMetadataAccount,
              associatedTag: 'image',
              targetSize: c.newImage.size,
            });

            dataBuilder = buildChunkedWriteData({
              builder: dataBuilder,
              umi,
              inscriptionAccount: c.imagePda,
              inscriptionMetadataAccount: c.inscriptionMetadataAccount,
              associatedTag: 'image',
              data: imageDatas[index] as Uint8Array,
            });
          }

          dataBuilder = buildChunkedWriteData({
            builder: dataBuilder,
            umi,
            inscriptionAccount: c.inscriptionPda[0],
            inscriptionMetadataAccount: c.inscriptionMetadataAccount,
            associatedTag: null,
            data: enc.encode(JSON.stringify(c.json)),
          });
        }

        console.log('data ix length', dataBuilder.getInstructions().length);

        const results: string[] = [];
        if (!skipInit) {
          const signedTx = await prepareAndSignTxs({
            umi,
            builder: setupBuilder,
          });

          setMaxProgress(signedTx.length);

          const setupRes = await sendTxsWithRetries({
            umi,
            txs: signedTx,
            concurrency: 2,
            onProgress: () => setProgress((p) => p + 1),
          });

          if (setupRes.errors.length) {
            throw new Error('Setup transactions failed to confirm successfully');
          }
          results.push(...setupRes.signatures);
        }

        const signedDataTxs = await prepareAndSignTxs({
          umi,
          builder: dataBuilder,
        });

        setMaxProgress((p) => p + signedDataTxs.length);

        const dataRes = await sendTxsWithRetries({
          umi,
          txs: signedDataTxs,
          concurrency: 2,
          onProgress: () => setProgress((p) => p + 1),
        });

        if (dataRes.errors.length) {
          throw new Error('Write data transactions failed to confirm successfully');
        }

        results.push(...dataRes.signatures);
        onComplete(results);
      } catch (e: any) {
        console.log(e);
        notifications.show({
          title: 'Error inscribing',
          message: e.message,
          color: 'red',
        });
        setShowRetry(true);
      } finally {
        close();
      }
    },
    [summary, inscriptionSettings, setProgress, setMaxProgress, open, close, umi, onComplete]
  );

  return (
    <>
      <Container size="sm" mt="lg">
        <Paper p="xl" radius="md">
          <Title order={2}>Summary</Title>
          {!summary ? (
            <Center h="20vh">
              <Loader />
            </Center>
          ) : (
            <Stack mt="md">
              <Text>
                Number of NFTs to inscribe: <b>{summary.calculated.length}</b>
              </Text>
              <Text>
                Total Domichain rent cost:{' '}
                <b>~{(summary.totalSize * 0.00000696).toFixed(4)} DOMI</b>
              </Text>
              <Center>
                <Button size="lg" onClick={() => handleInscribe()}>
                  Inscribe!
                </Button>
              </Center>
              {showRetry && (
                <Center mt="lg" ta="center">
                  <Stack>
                    <Button onClick={() => handleInscribe(true)} variant="default">
                      Retry inscribe data only
                    </Button>
                    <Text size="sm">
                      Inscribing data only assumes the initialization step was successful
                    </Text>
                  </Stack>
                </Center>
              )}
            </Stack>
          )}
        </Paper>
      </Container>
      <Modal opened={opened} onClose={() => {}} centered withCloseButton={false}>
        <Center my="xl">
          <Stack gap="md" align="center">
            <Title order={3}>Inscribing...</Title>
            <Text>Be prepared to approve many transactions...</Text>
            <Center w="100%">
              {summary && (
                <Stack w="100%">
                  <Progress value={(progress / maxProgress) * 100} animated />
                  <Text ta="center">
                    {progress} / {maxProgress}
                  </Text>
                </Stack>
              )}
            </Center>
          </Stack>
        </Center>
      </Modal>
    </>
  );
}

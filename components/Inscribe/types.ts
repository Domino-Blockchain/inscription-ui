import { InscriptionMetadata } from '@metaplex-foundation/mpl-inscription';
import { DigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { Pda } from '@metaplex-foundation/umi';

export interface InscriptionInfo {
  inscriptionPda: Pda;
  inscriptionMetadataAccount: Pda;
  imagePda: Pda;
  pdaExists: boolean;
  metadataPdaExists?: boolean;
  imagePdaExists: boolean;
  metadata?: InscriptionMetadata;
  image?: Blob;
  json?: any;
  jsonValid?: boolean;
}

export type AssetWithInscription = { asset: DigitalAsset } & InscriptionInfo;

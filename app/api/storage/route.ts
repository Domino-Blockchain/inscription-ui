/* eslint-disable no-console */
import { File as CessFile, Authorize, InitAPI, Territory } from 'cess-js-sdk-nodejs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

const Mnemonic = process.env.NEXT_CESS_MNEMONIC!;
const MyAddress = process.env.NEXT_CESS_ADDRESS!;
const TerritoryName = process.env.NEXT_CESS_TERRITORY_NAME!;

const config = {
  nodeURL: process.env.NEXT_CESS_NODE_URLS!.split(','),
  gatewayURL: process.env.NEXT_CESS_GATEWAY_URL!,
  gatewayAddr: process.env.NEXT_CESS_GATEWAY_ADDRESS!,
  keyringOption: { type: 'sr25519', ss58Format: 11330 },
};
console.log('CESS config loaded', config);

async function authorizeGateway(api: any, keyring: any) {
  console.debug('Authorizing Gateway...');

  const cessAuth = new Authorize(api, keyring);
  const listResult = await cessAuth.authorityList(MyAddress);

  if (listResult.msg !== 'ok') {
    throw new Error(listResult.error);
  }

  if (listResult.data.includes(config.gatewayAddr)) {
    return true;
  }

  console.log('Authorizing Gateway', config.gatewayAddr);

  const authorizeResult = await cessAuth.authorize(Mnemonic, config.gatewayAddr);
  if (authorizeResult.msg !== 'ok') {
    throw new Error(authorizeResult.error);
  }

  return true;
}

async function createTerritory(api: any, keyring: any) {
  const territory = new Territory(api, keyring, true);
  const queryResult = await territory.queryMyTerritorys(MyAddress);

  let territoryExists = false;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < queryResult.data.length; i++) {
    const element = queryResult.data[i];
    if (element.name === TerritoryName) {
      console.log('Territory Exists', element);
      territoryExists = true;
      break;
    }
  }

  if (!territoryExists) {
    console.log('Create territory:', config.gatewayAddr, TerritoryName);
    const result = await territory.createTerritory(Mnemonic, TerritoryName, 10, 30, console.log);
    console.log(result, '\n');
  }
}

async function uploadFile(api: any, keyring: any, file: File) {
  const fileBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(fileBuffer);

  // Save the file locally
  const tempFileName = crypto.randomBytes(16).toString('hex');
  const tempFilePath = path.join(os.tmpdir(), tempFileName);
  fs.writeFileSync(tempFilePath, fileBytes);

  const cessFile = new CessFile(api, keyring, config.gatewayURL, true);
  const result = await cessFile.uploadFile(Mnemonic, tempFilePath, TerritoryName, (status) =>
    console.log('Status: ', status)
  );

  console.log('File upload result:', result);

  // Delete the temporary file
  fs.unlinkSync(tempFilePath);

  if (result.msg !== 'ok') {
    throw new Error(result.error);
  }
  return result.data.fid;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as unknown as File;

  if (!file) {
    return Response.json(
      { error: 'Invalid file type. Please provide an image file.' },
      { status: 400 }
    );
  }

  const { api, keyring } = await InitAPI(config);

  await authorizeGateway(api, keyring);
  await createTerritory(api, keyring);

  const fileId = await uploadFile(api, keyring, file);
  const fileExtension = path.extname(file.name).toLowerCase();

  return Response.json({
    fileId,
    fileUrl: `${config.gatewayURL}/open/${fileId}${fileExtension}`,
  });
}

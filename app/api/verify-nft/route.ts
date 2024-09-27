import { sha256 } from '@/lib/sha256';

export async function POST(request: Request) {
  const { images } = await request.json();

  const hashes = await Promise.all<string>(
    images.map(async (image: any) => {
      const response = await fetch(image.url);
      const imageBlob = await response.blob();
      return sha256(await imageBlob.arrayBuffer());
    })
  );

  return Response.json({
    verified: hashes.every((hash, index) => hash === images[index].hash),
  });
}

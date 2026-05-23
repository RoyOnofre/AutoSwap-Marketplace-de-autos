import { useState, useEffect } from 'react';
import { usePublishStore } from '@/lib/store/usePublishStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PublishStep2() {
  const router = useRouter();
  const photos = usePublishStore(state => state.photos);
  const setPhotos = usePublishStore(state => state.setPhotos);
  const [preview, setPreview] = useState<string[]>(photos);

  // handle file selection
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPreviews: string[] = [];
    const readers = [] as Promise<string>[];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new Promise<string>((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.readAsDataURL(file);
      });
      readers.push(reader);
    }
    Promise.all(readers).then((urls) => {
      newPreviews.push(...urls);
      setPreview(prev => [...prev, ...urls]);
      setPhotos([...photos, ...urls]); // store as base64 URLs temporarily
    });
  };

  const handleNext = () => {
    router.push('/publish/step3');
  };

  return (
    <section className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Paso 2 – Subir fotos</h1>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="border p-2 rounded-md"
      />
      <div className="grid grid-cols-3 gap-4 mt-4">
        {preview.map((src, idx) => (
          <img key={idx} src={src} alt={`Foto ${idx + 1}`} className="object-cover w-full h-32 rounded" />
        ))}
      </div>
      <Button onClick={handleNext} disabled={preview.length === 0} className="bg-primary-600 hover:bg-primary-700">
        Siguiente
      </Button>
    </section>
  );
}

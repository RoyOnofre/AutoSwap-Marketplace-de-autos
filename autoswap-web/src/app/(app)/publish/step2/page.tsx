import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePublishStore } from '@/lib/store/usePublishStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Simple schema – we just require an array of files (max 5)
const schema = z.object({
  photos: z.array(z.instanceof(File)).min(1, 'Debe subir al menos una foto').max(5, 'Máximo 5 fotos'),
});

type FormValues = z.infer<typeof schema>;

export default function Step2() {
  const router = useRouter();
  const setPhotos = usePublishStore(state => state.setPhotos);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (data: FormValues) => {
    // Convert Files to temporary object URLs (client‑side only)
    const urls = data.photos.map(file => URL.createObjectURL(file));
    setPhotos(urls);
    router.push('/publish/step3');
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Paso 2 – Subir fotos del vehículo</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            {...register('photos')}
            ref={e => {
              register('photos').ref(e);
              fileInputRef.current = e as HTMLInputElement;
            }}
            className="hidden"
          />
          <Button type="button" onClick={triggerFileSelect}>Seleccionar fotos</Button>
          {errors.photos && (
            <p className="text-sm text-rose-500 mt-1">{errors.photos.message?.toString()}</p>
          )}
        </div>
        <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
          Continuar
        </Button>
      </form>
    </section>
  );
}

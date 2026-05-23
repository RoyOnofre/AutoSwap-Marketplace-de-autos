import { usePublishStore } from '@/lib/store/usePublishStore';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert'; // assume simple alert component exists

// Simple schema – only a boolean flag
const InspectionSchema = z.object({
  request: z.boolean(),
});

type FormValues = z.infer<typeof InspectionSchema>;

export default function PublishStep4() {
  const router = useRouter();
  const priceBs = usePublishStore((s) => s.priceBs);
  const setInspectionRequested = usePublishStore((s) => s.setInspectionRequested);
  const storedRequest = usePublishStore((s) => s.inspectionRequested);

  const mandatory = priceBs >= 140_000;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(InspectionSchema),
    defaultValues: { request: mandatory ? true : storedRequest },
  });

  const onSubmit = (data: FormValues) => {
    // If mandatory, force true regardless of checkbox state
    const finalValue = mandatory ? true : data.request;
    setInspectionRequested(finalValue);
    router.push('/publish/step5');
  };

  return (
    <section className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Paso 4 – Inspección Técnica</h1>

      {mandatory && (
        <Alert variant="warning" className="mb-4">
          Debido al precio del vehículo (≥ Bs. 140.000), la inspección es obligatoria.
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="request"
            {...register('request')}
            disabled={mandatory}
            defaultChecked={mandatory}
          />
          <label htmlFor="request" className="font-medium">
            Solicitar inspección técnica
          </label>
        </div>
        {errors.request && (
          <p className="text-sm text-rose-500">{errors.request.message}</p>
        )}

        <div className="flex justify-between">
          <Button type="button" onClick={() => router.back()}>
            Anterior
          </Button>
          <Button type="submit">{mandatory ? 'Continuar (obligatorio)' : 'Siguiente'}</Button>
        </div>
      </form>
    </section>
  );
}

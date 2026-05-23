import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePublishStore } from '@/lib/store/usePublishStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Zod schema for vehicle data
const VehicleSchema = z.object({
  make: z.string().min(1, 'Marca requerida'),
  model: z.string().min(1, 'Modelo requerido'),
  year: z
    .number({ invalid_type_error: 'Año requerido' })
    .int()
    .gte(1900, 'Año demasiado antiguo')
    .lte(new Date().getFullYear() + 1, 'Año no puede estar en el futuro'),
  mileage: z.number().nonnegative('Kilometraje debe ser positivo'),
  description: z.string().max(1000, 'Máximo 1000 caracteres'),
});

type VehicleForm = z.infer<typeof VehicleSchema>;

export default function PublishStep1() {
  const router = useRouter();
  const setVehicleData = usePublishStore(state => state.setVehicleData);
  const { register, handleSubmit, formState: { errors } } = useForm<VehicleForm>({
    resolver: zodResolver(VehicleSchema),
    defaultValues: usePublishStore.getState().vehicleData,
  });

  const onSubmit = (data: VehicleForm) => {
    setVehicleData(data);
    router.push('/publish/step2');
  };

  return (
    <section className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Paso 1 – Información del vehículo</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block font-medium mb-1" htmlFor="make">Marca</label>
          <Input id="make" {...register('make')} placeholder="Ej. Toyota" />
          {errors.make && <p className="text-sm text-rose-500">{errors.make.message}</p>}
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="model">Modelo</label>
          <Input id="model" {...register('model')} placeholder="Ej. Corolla" />
          {errors.model && <p className="text-sm text-rose-500">{errors.model.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1" htmlFor="year">Año</label>
            <Input type="number" id="year" {...register('year', { valueAsNumber: true })} />
            {errors.year && <p className="text-sm text-rose-500">{errors.year.message}</p>}
          </div>
          <div>
            <label className="block font-medium mb-1" htmlFor="mileage">Kilometraje</label>
            <Input type="number" id="mileage" {...register('mileage', { valueAsNumber: true })} />
            {errors.mileage && <p className="text-sm text-rose-500">{errors.mileage.message}</p>}
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="description">Descripción</label>
          <textarea
            id="description"
            {...register('description')}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={4}
          />
          {errors.description && <p className="text-sm text-rose-500">{errors.description.message}</p>}
        </div>
        <Button type="submit" className="bg-primary-600 hover:bg-primary-700">Siguiente</Button>
      </form>
    </section>
  );
}

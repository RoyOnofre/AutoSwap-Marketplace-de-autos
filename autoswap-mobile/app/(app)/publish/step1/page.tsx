import { useRouter } from 'expo-router';
import { View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePublishStore } from '@/store/usePublishStore';

const schema = z.object({
  make: z.string().min(1, 'Marca es requerida'),
  model: z.string().min(1, 'Modelo es requerido'),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  mileage: z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

export default function Step1() {
  const router = useRouter();
  const setVehicleInfo = usePublishStore(s => s.setVehicleInfo);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: 0,
    },
  });

  const onSubmit = (data: FormValues) => {
    setVehicleInfo({ ...data, description: '' });
    router.push('/publish/step2');
  };

  return (
    <View className="p-4">
      <Text className="text-2xl font-bold mb-4">Paso 1 – Información del vehículo</Text>
      <Controller
        control={control}
        name="make"
        render={({ field: { onChange, value } }) => (
          <Input placeholder="Marca" value={value} onChangeText={onChange} />
        )}
      />
      {errors.make && <Text className="text-red-500">{errors.make.message}</Text>}

      <Controller
        control={control}
        name="model"
        render={({ field: { onChange, value } }) => (
          <Input placeholder="Modelo" value={value} onChangeText={onChange} />
        )}
      />
      {errors.model && <Text className="text-red-500">{errors.model.message}</Text>}

      <Controller
        control={control}
        name="year"
        render={({ field: { onChange, value } }) => (
          <Input placeholder="Año" value={value} onChangeText={onChange} keyboardType="numeric" />
        )}
      />
      {errors.year && <Text className="text-red-500">{errors.year.message}</Text>}

      <Controller
        control={control}
        name="mileage"
        render={({ field: { onChange, value } }) => (
          <Input placeholder="Kilometraje" value={value} onChangeText={onChange} keyboardType="numeric" />
        )}
      />
      {errors.mileage && <Text className="text-red-500">{errors.mileage.message}</Text>}

      <Button title="Siguiente" onPress={handleSubmit(onSubmit)} />
    </View>
  );
}

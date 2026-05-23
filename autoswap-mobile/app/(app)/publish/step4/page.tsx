import { useRouter } from 'expo-router';
import { View, Text, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { usePublishStore } from '@/store/usePublishStore';
import { Alert } from '@/components/ui/Alert'; // simple alert component

const schema = z.object({
  request: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function Step4() {
  const router = useRouter();
  const price = usePublishStore((s) => s.priceBs);
  const setInspectionRequested = usePublishStore((s) => s.setInspectionRequested);
  const storedRequest = usePublishStore((s) => s.inspectionRequested);

  const mandatory = price >= 140_000; // rule for Bolivia

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { request: mandatory ? true : storedRequest },
  });

  const onSubmit = (data: FormValues) => {
    const finalRequest = mandatory ? true : data.request;
    setInspectionRequested(finalRequest);
    router.push('/publish/step5');
  };

  return (
    <View className="p-4">
      <Text className="text-2xl font-bold mb-4">Paso 4 – Inspección Técnica</Text>

      {mandatory && (
        <Alert variant="warning" className="mb-4">
          Precio ≥ Bs. 140.000 – la inspección es obligatoria.
        </Alert>
      )}

      <Controller
        control={control}
        name="request"
        render={({ field: { onChange, value } }) => (
          <View className="flex flex-row items-center">
            <Text className="mr-2">Solicitar inspección</Text>
            <Switch
              value={value}
              onValueChange={onChange}
              disabled={mandatory}
              trackColor={{ false: '#d1d5db', true: '#1e40af' }}
            />
          </View>
        )}
      />

      <View className="flex flex-row justify-between mt-6">
        <Button title="Anterior" onPress={() => router.back()} variant="secondary" />
        <Button title="Siguiente" onPress={handleSubmit(onSubmit)} />
      </View>
    </View>
  );
}

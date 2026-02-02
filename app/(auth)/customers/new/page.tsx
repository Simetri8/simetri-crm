'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { customerService } from '@/lib/firebase/customers';

const formSchema = z.object({
  name: z.string().min(2, 'Isim en az 2 karakter olmalidir'),
  company: z.string().min(2, 'Firma adi en az 2 karakter olmalidir'),
  email: z.string().email('Gecerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Gecerli bir telefon numarasi giriniz'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewCustomerPage() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      notes: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await customerService.add({
        ...values,
        notes: values.notes || '',
        lastContactDate: null,
      });
      toast.success('Musteri eklendi');
      router.push('/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Bir hata olustu');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Yeni Musteri</h2>
          <p className="text-muted-foreground">Yeni bir musteri ekleyin.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Musteri Bilgileri</CardTitle>
          <CardDescription>
            Musteri bilgilerini asagidaki formdan girebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Soyad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ahmet Yilmaz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma Adi</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC Ltd. Sti." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta</FormLabel>
                      <FormControl>
                        <Input placeholder="ornek@sirket.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="0555 123 4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Kisa notlar..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/customers">Iptal</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Customer } from '@/lib/types';
import { customerService } from '@/lib/firebase/customers';
import { useEffect } from 'react';
import { toast } from 'sonner';

const formSchema = z.object({
    name: z.string().min(2, 'Isim en az 2 karakter olmalidir'),
    company: z.string().min(2, 'Firma adi en az 2 karakter olmalidir'),
    email: z.string().email('Gecerli bir e-posta adresi giriniz'),
    phone: z.string().min(10, 'Gecerli bir telefon numarasi giriniz'),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomerFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer?: Customer | null;
    onSuccess: () => void;
}

export function CustomerFormDialog({
    open,
    onOpenChange,
    customer,
    onSuccess,
}: CustomerFormDialogProps) {
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

    useEffect(() => {
        if (customer) {
            form.reset({
                name: customer.name,
                company: customer.company,
                email: customer.email,
                phone: customer.phone,
                notes: customer.notes || '',
            });
        } else {
            form.reset({
                name: '',
                company: '',
                email: '',
                phone: '',
                notes: '',
            });
        }
    }, [customer, form, open]);

    const onSubmit = async (values: FormValues) => {
        console.log('CustomerFormDialog: Submit triggered', {
            hasCustomerId: !!customer?.id,
            values
        });
        try {
            if (customer?.id) {
                await customerService.update(customer.id, values);
                toast.success('Musteri guncellendi');
            } else {
                await customerService.add({
                    ...values,
                    notes: values.notes || '',
                    lastContactDate: null, // New customers haven't been contacted yet?
                });
                toast.success('Musteri eklendi');
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving customer:', error);
            toast.error('Bir hata olustu');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {customer ? 'Musteriyi Duzenle' : 'Yeni Musteri Ekle'}
                    </DialogTitle>
                    <DialogDescription>
                        Musteri bilgilerini asagidaki formdan girebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

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

                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

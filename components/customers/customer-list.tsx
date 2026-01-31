'use client';

import { useEffect, useState } from 'react';
import { Customer } from '@/lib/types';
import { customerService } from '@/lib/firebase/customers';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TEMPERATURE_COLORS, TEMPERATURE_LABELS } from '@/lib/utils/temperature';

interface CustomerListProps {
    onEdit: (customer: Customer) => void;
    refreshKey?: number; // Prop to trigger refresh
}

export function CustomerList({ onEdit, refreshKey }: CustomerListProps) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCustomers();
    }, [refreshKey]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const data = await customerService.getAll();
            setCustomers(data as Customer[]);
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bu musteriyi silmek istediginizden emin misiniz?')) {
            await customerService.delete(id);
            loadCustomers();
        }
    };

    if (loading) {
        return <div>Yukleniyor...</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ad Soyad</TableHead>
                        <TableHead>Firma</TableHead>
                        <TableHead>Sicaklik</TableHead>
                        <TableHead>Son Iletisim</TableHead>
                        <TableHead className="text-right">Islemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10">
                                Hic musteri bulunamadi.
                            </TableCell>
                        </TableRow>
                    ) : (
                        customers.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell>{customer.company}</TableCell>
                                <TableCell>
                                    <Badge className={TEMPERATURE_COLORS[customer.temperature]}>
                                        {TEMPERATURE_LABELS[customer.temperature].split(' ')[0]}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {customer.lastContactDate
                                        ? format(customer.lastContactDate.toDate(), 'd MMM yyyy', { locale: tr })
                                        : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(customer)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => customer.id && handleDelete(customer.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

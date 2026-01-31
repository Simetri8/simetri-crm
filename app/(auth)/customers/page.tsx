'use client';

import { useState } from 'react';
import { CustomerList } from '@/components/customers/customer-list';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Customer } from '@/lib/types';

export default function CustomersPage() {
    const [open, setOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setOpen(true);
    };

    const handleAdd = () => {
        setSelectedCustomer(null);
        setOpen(true);
    };

    const onSuccess = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Musteriler</h2>
                    <p className="text-muted-foreground">
                        Musteri listesi ve takibi buradan yapilir.
                    </p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Musteri
                </Button>
            </div>

            <CustomerList onEdit={handleEdit} refreshKey={refreshKey} />

            <CustomerFormDialog
                open={open}
                onOpenChange={setOpen}
                customer={selectedCustomer}
                onSuccess={onSuccess}
            />
        </div>
    );
}

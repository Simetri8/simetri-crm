'use client';

import { useEffect, useState } from 'react';
import { Customer } from '@/lib/types';
import { customerService } from '@/lib/firebase/customers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TEMPERATURE_COLORS, TEMPERATURE_LABELS } from '@/lib/utils/temperature';
import Link from 'next/link';

export function CustomerColumn() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('CustomerColumn: Loading customers...');
        customerService.getAll()
            .then((data) => {
                console.log(`CustomerColumn: Loaded ${data.length} customers`);
                setCustomers(data.slice(0, 10));
                setLoading(false);
            })
            .catch(err => {
                console.error('CustomerColumn: Error loading customers:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="py-4">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    Müşteriler
                    <Link href="/customers" className="text-xs text-muted-foreground hover:underline font-normal">
                        Tümünü Gör
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-3">
                        {customers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Müşteri bulunamadı.</p>
                        ) : (
                            customers.map((customer) => (
                                <Link key={customer.id} href={`/customers/${customer.id}`}>
                                    <div className="flex flex-col gap-1 p-3 rounded-md border bg-card hover:bg-accent transition-colors mb-3 last:mb-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-sm truncate">{customer.name}</span>
                                            <Badge className={TEMPERATURE_COLORS[customer.temperature]} variant="secondary" style={{ fontSize: '10px' }}>
                                                {TEMPERATURE_LABELS[customer.temperature]}
                                            </Badge>
                                        </div>
                                        {(customer.company) && (
                                            <span className="text-xs text-muted-foreground truncate">{customer.company}</span>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

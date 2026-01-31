'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Calendar,
    User,
    Users,
    Briefcase,
    Search,
    Plus,
} from 'lucide-react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { projectService } from '@/lib/firebase/projects';
import { customerService } from '@/lib/firebase/customers';
import { Project, Customer } from '@/lib/types';

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [customers, setCustomers] = React.useState<Customer[]>([]);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);

        // Initial load for search context
        const loadContext = async () => {
            const [p, c] = await Promise.all([
                projectService.getAll(),
                customerService.getAll(),
            ]);
            setProjects(p);
            setCustomers(c);
        };
        loadContext();

        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Bir komut yazın veya arayın..." />
            <CommandList>
                <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>

                <CommandGroup heading="Yönlendirme">
                    <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
                        <Search className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/projects'))}>
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>Projeler</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/customers'))}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Müşteriler</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/vision'))}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Vizyon</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Projeler">
                    {projects.map((project) => (
                        <CommandItem
                            key={project.id}
                            onSelect={() => runCommand(() => router.push(`/projects/${project.id}`))}
                        >
                            <Briefcase className="mr-2 h-4 w-4" />
                            <span>{project.name}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Müşteriler">
                    {customers.map((customer) => (
                        <CommandItem
                            key={customer.id}
                            onSelect={() => runCommand(() => router.push(`/customers/${customer.id}`))}
                        >
                            <User className="mr-2 h-4 w-4" />
                            <span>{customer.name}</span>
                            {customer.company && (
                                <span className="ml-2 text-xs text-muted-foreground">({customer.company})</span>
                            )}
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Hızlı İşlemler">
                    <CommandItem onSelect={() => runCommand(() => router.push('/projects/new'))}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Yeni Proje Ekle</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/customers/new'))}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Yeni Müşteri Ekle</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/communications/new'))}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Yeni Görüşme Kaydet</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}

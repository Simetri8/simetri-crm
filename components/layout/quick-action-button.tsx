'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
    Plus,
    Phone,
    Users,
    Mail,
    StickyNote,
    Handshake,
    ClipboardList,
    CalendarIcon,
    Loader2,
    Building2,
    UserCircle,
    CalendarClock,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';
import { activityService } from '@/lib/firebase/activities';
import { requestService } from '@/lib/firebase/requests';
import { contactService } from '@/lib/firebase/contacts';
import { companyService } from '@/lib/firebase/companies';
import {
    REQUEST_TYPES,
    REQUEST_PRIORITIES,
} from '@/lib/types';
import {
    ACTIVITY_TYPE_CONFIG,
    REQUEST_TYPE_LABELS,
    REQUEST_PRIORITY_CONFIG,
} from '@/lib/utils/status';
import type {
    ActivityType,
    ActivityFormData,
    RequestFormData,
    Contact,
    Company,
} from '@/lib/types';

const NONE_VALUE = '__none__';

const QUICK_ACTIVITY_TYPES: { type: ActivityType; icon: React.ElementType }[] = [
    { type: 'call', icon: Phone },
    { type: 'meeting', icon: Users },
    { type: 'email', icon: Mail },
    { type: 'note', icon: StickyNote },
    { type: 'networking', icon: Handshake },
];

export function QuickActionButton() {
    const { user } = useAuth();
    const [activityOpen, setActivityOpen] = useState(false);
    const [requestOpen, setRequestOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90">
                            <Plus className="h-6 w-6 text-white" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mb-2">
                        <DropdownMenuItem onClick={() => setActivityOpen(true)}>
                            <Phone className="mr-2 h-4 w-4" />
                            <span>Görüşme Kaydet</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActivityOpen(true)}>
                            <StickyNote className="mr-2 h-4 w-4" />
                            <span>Hızlı Not</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActivityOpen(true)}>
                            <CalendarClock className="mr-2 h-4 w-4" />
                            <span>Takip Planla</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setRequestOpen(true)}>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            <span>Talep Oluştur</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {user && (
                <>
                    <QuickActivitySheet
                        open={activityOpen}
                        onOpenChange={setActivityOpen}
                        userId={user.uid}
                    />
                    <QuickRequestSheet
                        open={requestOpen}
                        onOpenChange={setRequestOpen}
                        userId={user.uid}
                    />
                </>
            )}
        </>
    );
}

// =============================================================================
// Quick Activity Sheet
// =============================================================================

function QuickActivitySheet({
    open,
    onOpenChange,
    userId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
}) {
    const [selectedType, setSelectedType] = useState<ActivityType>('call');
    const [contactId, setContactId] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [summary, setSummary] = useState('');
    const [nextAction, setNextAction] = useState('');
    const [nextActionDate, setNextActionDate] = useState<Date | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!open) return;
        // Reset form
        setSelectedType('call');
        setContactId('');
        setCompanyId('');
        setSummary('');
        setNextAction('');
        setNextActionDate(null);

        const load = async () => {
            setDataLoading(true);
            try {
                const [c, co] = await Promise.all([
                    contactService.getAll(),
                    companyService.getAll({ isArchived: false }),
                ]);
                setContacts(c);
                setCompanies(co);
            } catch {
                // silent
            } finally {
                setDataLoading(false);
            }
        };
        load();
    }, [open]);

    const handleSubmit = async () => {
        if (!summary.trim()) {
            toast.error('Özet zorunludur');
            return;
        }

        setIsSubmitting(true);
        try {
            const data: ActivityFormData = {
                type: selectedType,
                summary: summary.trim(),
                contactId: contactId || null,
                companyId: companyId || null,
                nextAction: nextAction.trim() || null,
                nextActionDate: nextActionDate || null,
            };
            await activityService.add(data, userId);
            toast.success('Aktivite kaydedildi');
            onOpenChange(false);
        } catch (error) {
            console.error('Quick activity error:', error);
            toast.error('Aktivite kaydedilemedi');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[420px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Hızlı Aktivite</SheetTitle>
                </SheetHeader>

                <div className="space-y-5 mt-6">
                    {/* Type selector - icon buttons */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Tür</Label>
                        <div className="flex gap-2 flex-wrap">
                            {QUICK_ACTIVITY_TYPES.map(({ type, icon: Icon }) => {
                                const config = ACTIVITY_TYPE_CONFIG[type];
                                const isSelected = selectedType === type;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setSelectedType(type)}
                                        className={cn(
                                            'flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all min-w-[64px]',
                                            isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-transparent bg-muted/50 hover:bg-muted'
                                        )}
                                    >
                                        <Icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                                        <span className={cn('text-[11px]', isSelected ? 'text-primary font-medium' : 'text-muted-foreground')}>
                                            {config.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Contact selector */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">
                            <UserCircle className="inline h-3.5 w-3.5 mr-1" />
                            Kişi
                        </Label>
                        <Select
                            value={contactId || NONE_VALUE}
                            onValueChange={(val) => setContactId(val === NONE_VALUE ? '' : val)}
                            disabled={dataLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Kişi seç..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE_VALUE}>Kişi yok</SelectItem>
                                {contacts.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.fullName}
                                        {c.companyName ? ` (${c.companyName})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Company selector */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">
                            <Building2 className="inline h-3.5 w-3.5 mr-1" />
                            Şirket
                        </Label>
                        <Select
                            value={companyId || NONE_VALUE}
                            onValueChange={(val) => setCompanyId(val === NONE_VALUE ? '' : val)}
                            disabled={dataLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Şirket seç..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE_VALUE}>Şirket yok</SelectItem>
                                {companies.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Summary */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Özet *</Label>
                        <Textarea
                            placeholder="Görüşme özeti..."
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Next Action */}
                    <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                        <Label className="text-sm font-medium block">
                            <CalendarClock className="inline h-3.5 w-3.5 mr-1" />
                            Sonraki Adım (Opsiyonel)
                        </Label>
                        <Input
                            placeholder="Örn: Teklif gönder, Tekrar ara..."
                            value={nextAction}
                            onChange={(e) => setNextAction(e.target.value)}
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !nextActionDate && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {nextActionDate
                                        ? format(nextActionDate, 'dd MMM yyyy', { locale: tr })
                                        : 'Tarih seç'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={nextActionDate ?? undefined}
                                    onSelect={(d) => setNextActionDate(d ?? null)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            İptal
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !summary.trim()}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Kaydet
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// =============================================================================
// Quick Request Sheet
// =============================================================================

function QuickRequestSheet({
    open,
    onOpenChange,
    userId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<string>('other');
    const [priority, setPriority] = useState<string>('normal');
    const [contactId, setContactId] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!open) return;
        // Reset form
        setTitle('');
        setDescription('');
        setType('other');
        setPriority('normal');
        setContactId('');
        setCompanyId('');
        setDueDate(null);

        const load = async () => {
            setDataLoading(true);
            try {
                const [c, co] = await Promise.all([
                    contactService.getAll(),
                    companyService.getAll({ isArchived: false }),
                ]);
                setContacts(c);
                setCompanies(co);
            } catch {
                // silent
            } finally {
                setDataLoading(false);
            }
        };
        load();
    }, [open]);

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error('Başlık zorunludur');
            return;
        }

        setIsSubmitting(true);
        try {
            const data: RequestFormData = {
                title: title.trim(),
                description: description.trim() || null,
                type: type as RequestFormData['type'],
                priority: priority as RequestFormData['priority'],
                contactId: contactId || null,
                companyId: companyId || null,
                dueDate: dueDate || null,
            };
            await requestService.add(data, userId);
            toast.success('Talep oluşturuldu');
            onOpenChange(false);
        } catch (error) {
            console.error('Quick request error:', error);
            toast.error('Talep oluşturulamadı');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[420px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Hızlı Talep</SheetTitle>
                </SheetHeader>

                <div className="space-y-5 mt-6">
                    {/* Title */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Başlık *</Label>
                        <Input
                            placeholder="Demo ortamı kurulumu..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Type + Priority row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-sm font-medium mb-2 block">Tür</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {REQUEST_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {REQUEST_TYPE_LABELS[t]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-2 block">Öncelik</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {REQUEST_PRIORITIES.map((p) => (
                                        <SelectItem key={p} value={p}>
                                            {REQUEST_PRIORITY_CONFIG[p].label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Context: Contact + Company */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-sm font-medium mb-2 block">
                                <UserCircle className="inline h-3.5 w-3.5 mr-1" />
                                Kişi
                            </Label>
                            <Select
                                value={contactId || NONE_VALUE}
                                onValueChange={(val) => setContactId(val === NONE_VALUE ? '' : val)}
                                disabled={dataLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Kişi seç..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE_VALUE}>Kişi yok</SelectItem>
                                    {contacts.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.fullName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-2 block">
                                <Building2 className="inline h-3.5 w-3.5 mr-1" />
                                Şirket
                            </Label>
                            <Select
                                value={companyId || NONE_VALUE}
                                onValueChange={(val) => setCompanyId(val === NONE_VALUE ? '' : val)}
                                disabled={dataLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Şirket seç..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE_VALUE}>Şirket yok</SelectItem>
                                    {companies.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Due date */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Hedef Tarih</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !dueDate && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dueDate
                                        ? format(dueDate, 'dd MMM yyyy', { locale: tr })
                                        : 'Tarih seç'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dueDate ?? undefined}
                                    onSelect={(d) => setDueDate(d ?? null)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Description */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Açıklama</Label>
                        <Textarea
                            placeholder="Talep detayları..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            İptal
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !title.trim()}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Oluştur
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

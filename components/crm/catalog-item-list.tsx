'use client';

import {
  Package,
  Wrench,
  Key,
  MoreHorizontal,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  CATALOG_ITEM_TYPE_LABELS,
  UNIT_LABELS,
  CURRENCY_CONFIG,
  formatMoney,
} from '@/lib/utils/status';
import { cn } from '@/lib/utils';
import type { CatalogItem, CatalogItemType } from '@/lib/types';

const TYPE_ICONS: Record<CatalogItemType, typeof Package> = {
  service: Wrench,
  product: Package,
  license: Key,
};

type CatalogItemListProps = {
  items: CatalogItem[];
  onEdit: (item: CatalogItem) => void;
  onDelete: (item: CatalogItem) => void;
  onToggleActive: (item: CatalogItem) => void;
};

export function CatalogItemList({
  items,
  onEdit,
  onDelete,
  onToggleActive,
}: CatalogItemListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kalem</TableHead>
          <TableHead>Tur</TableHead>
          <TableHead>Birim</TableHead>
          <TableHead className="text-right">Fiyat</TableHead>
          <TableHead className="text-right">KDV</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const Icon = TYPE_ICONS[item.type];
          return (
            <TableRow key={item.id} className={cn(!item.isActive && 'opacity-50')}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{item.name}</span>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {CATALOG_ITEM_TYPE_LABELS[item.type]}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {UNIT_LABELS[item.unit]}
                </span>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatMoney(item.defaultUnitPriceMinor, item.currency)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                %{item.taxRate}
              </TableCell>
              <TableCell>
                <Badge
                  variant={item.isActive ? 'default' : 'secondary'}
                  className={cn(
                    item.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {item.isActive ? 'Aktif' : 'Pasif'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Islemler</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Duzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleActive(item)}>
                      {item.isActive ? (
                        <>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          Pasif Yap
                        </>
                      ) : (
                        <>
                          <ToggleRight className="mr-2 h-4 w-4" />
                          Aktif Yap
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(item)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

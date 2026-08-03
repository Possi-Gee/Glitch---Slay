
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileListItemProps {
    href: string;
    icon: React.ElementType;
    label: string;
    className?: string;
}

export function ProfileListItem({ href, icon: Icon, label, className }: ProfileListItemProps) {
    return (
        <Link href={href} className={cn("block hover:bg-muted/50", className)}>
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                    <span className="font-medium">{label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
        </Link>
    )
}

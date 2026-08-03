
'use client';

import { useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrders } from '@/hooks/use-orders';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Printer, ArrowLeft, Loader2, Download, Package } from 'lucide-react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '@/hooks/use-auth';

export default function PackingSlipPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { state: orderState } = useOrders();
    const { loading: authLoading } = useAuth();
    const { state: siteSettings } = useSiteSettings();
    const slipRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const order = useMemo(() => {
        return orderState.orders.find((o) => o.id.toString() === id);
    }, [id, orderState.orders]);

    const handleDownload = async () => {
        if (!slipRef.current || !order) return;
        
        setIsDownloading(true);
        const slipElement = slipRef.current;
        
        try {
            const canvas = await html2canvas(slipElement, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`packing-slip-${order.id}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF", error);
        } finally {
            setIsDownloading(false);
        }
    };
    
    if (authLoading || orderState.loading) {
        return (
             <div className="container mx-auto px-4 py-8 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                <p className="mt-4">Loading Packing Slip...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold">Order Not Found</h1>
                <p className="text-muted-foreground mt-2">The order you are looking for does not exist.</p>
                 <Button onClick={() => router.push('/admin/orders')} className="mt-6">
                    Back to Orders
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-muted text-foreground min-h-screen py-8 print:bg-white">
            <div className="container mx-auto px-4">
                 <div className="max-w-xl mx-auto mb-8 flex justify-between items-center print:hidden">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2" /> Back
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={() => window.print()}>
                            <Printer className="mr-2" /> Print
                        </Button>
                        <Button onClick={handleDownload} disabled={isDownloading}>
                            {isDownloading ? <Loader2 className="mr-2 animate-spin"/> : <Download className="mr-2"/>}
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </Button>
                    </div>
                </div>

                <div ref={slipRef} className="max-w-xl mx-auto print-container">
                    <Card className="p-6 shadow-lg print:shadow-none print:border-none print:p-0 bg-background print:bg-white">
                        <header className="flex justify-between items-start pb-4 border-b">
                            <div>
                                {siteSettings.logoUrl ? (
                                    <Image src={siteSettings.logoUrl} alt={siteSettings.appName} width={80} height={30} className="object-contain" />
                                ) : (
                                    <h1 className="text-xl font-bold text-primary">{siteSettings.appName}</h1>
                                )}
                            </div>
                            <div className="text-right">
                                <h2 className="text-lg font-bold uppercase">Packing Slip</h2>
                                <p className="text-muted-foreground text-sm">Order #{order.id}</p>
                            </div>
                        </header>

                        <section className="grid grid-cols-2 gap-4 my-4 text-sm">
                            <div>
                                <h3 className="font-semibold mb-1 text-xs uppercase text-muted-foreground">Ship To:</h3>
                                <address className="not-italic">
                                    {order.shippingAddress.fullName}<br />
                                    {order.shippingAddress.address}<br />
                                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                                    {order.shippingAddress.country}
                                </address>
                            </div>
                            <div className="text-right">
                                <h3 className="font-semibold mb-1 text-xs uppercase text-muted-foreground">Order Date:</h3>
                                <p>{new Date(order.date).toLocaleDateString()}</p>
                            </div>
                        </section>
                        
                        <Separator />

                        <section className="my-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Package size={16} /> Contents</h3>
                             <div className="text-sm space-y-2">
                                {order.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div>
                                            <span className="font-medium">{item.quantity} x</span> {item.name}
                                            <span className="text-muted-foreground"> ({item.variant.name})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                        
                        {order.orderNotes && (
                            <>
                                <Separator />
                                <section className="my-4 text-sm">
                                    <h3 className="font-semibold mb-1">Notes:</h3>
                                    <p className="text-muted-foreground">{order.orderNotes}</p>
                                </section>
                            </>
                        )}

                        <footer className="mt-6 pt-4 border-t text-center text-muted-foreground text-xs">
                            <p>Thank you for shopping with {siteSettings.appName}!</p>
                        </footer>
                    </Card>
                </div>
            </div>
            <style jsx global>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .print-container, .print-container * {
                    visibility: visible;
                  }
                  .print-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                  }
                }
            `}</style>
        </div>
    );
}

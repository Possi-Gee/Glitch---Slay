
'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, FileText, Loader2, User, UserCog } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DocumentationPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!contentRef.current) return;
    
    setIsDownloading(true);
    const content = contentRef.current;

    // Hide download button from the PDF
    const downloadButton = content.querySelector('#download-button');
    if (downloadButton) (downloadButton as HTMLElement).style.visibility = 'hidden';

    try {
        const canvas = await html2canvas(content, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'px', [canvas.width, canvas.height]);
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('Jaytel-Classic-Store-Technical-Documentation.pdf');
    } catch(error) {
        console.error("Failed to generate PDF", error);
    } finally {
        if (downloadButton) (downloadButton as HTMLElement).style.visibility = 'visible';
        setIsDownloading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div ref={contentRef} className="p-4 md:p-8 bg-background">
        <Card className="max-w-4xl mx-auto shadow-none border-none">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-3xl font-bold flex items-center gap-2">
                            <FileText /> Jaytel Classic Store Technical Documentation
                        </CardTitle>
                        <CardDescription className="mt-2">
                            A comprehensive guide to the project's architecture, features, and usage.
                        </CardDescription>
                    </div>
                    <div id="download-button" className="print:hidden">
                        <Button onClick={handleDownload} disabled={isDownloading}>
                            {isDownloading ? <Loader2 className="mr-2 animate-spin"/> : <Download className="mr-2"/>}
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 mt-6">
                 <section>
                    <h2 className="text-2xl font-semibold border-b pb-2 mb-4">1. Project Overview</h2>
                    <p className="text-muted-foreground">
                        Jaytel Classic Store is a modern, full-stack e-commerce application built with Next.js and Firebase. It provides a complete shopping experience, including product browsing, a shopping cart, secure checkout, user authentication, and an admin dashboard for store management. The application is designed to be scalable, performant, and easily customizable, with AI-powered features to streamline administrative tasks.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold border-b pb-2 mb-4">2. Technology Stack</h2>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li><strong>Frontend Framework:</strong> Next.js (with App Router) & React</li>
                        <li><strong>Backend & Database:</strong> Firebase (Firestore, Authentication, Cloud Functions)</li>
                        <li><strong>Generative AI:</strong> Genkit (for AI-powered features like product description generation and email automation)</li>
                        <li><strong>UI Components:</strong> ShadCN UI, Radix UI</li>
                        <li><strong>Styling:</strong> Tailwind CSS</li>
                        <li><strong>Form Management:</strong> React Hook Form with Zod for validation</li>
                        <li><strong>State Management:</strong> React Context API</li>
                        <li><strong>Deployment:</strong> Vercel & Firebase App Hosting</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold border-b pb-2 mb-4">3. Key Features</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="bg-muted/30">
                            <CardHeader><CardTitle className="text-lg">Customer-Facing</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside space-y-2 text-sm">
                                    <li>Product catalog with search and category filters.</li>
                                    <li>Detailed product pages with multiple images and variants.</li>
                                    <li>Shopping cart and persistent wishlist.</li>
                                    <li>Secure checkout with multiple payment options (Card, Mobile Money, Pay on Delivery).</li>
                                    <li>User authentication (Email/Password & Google).</li>
                                    <li>Order history and detailed order tracking.</li>
                                    <li>Push notifications for new products.</li>
                                    <li>Dynamic Flash Sales and promotional carousels.</li>
                                </ul>
                            </CardContent>
                        </Card>
                         <Card className="bg-muted/30">
                            <CardHeader><CardTitle className="text-lg">Admin Panel</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside space-y-2 text-sm">
                                    <li>Dashboard with revenue and sales analytics.</li>
                                    <li>Full product management (CRUD operations).</li>
                                    <li>AI-powered product description generation.</li>
                                    <li>Order management with status updates.</li>
                                    <li>Automated, customized email notifications for customers.</li>
                                    <li>Global site settings (name, logo, theme, fees).</li>
                                    <li>Homepage content management (promotions, sales).</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>
                
                 <section>
                    <h2 className="text-2xl font-semibold border-b pb-2 mb-4">4. Project Structure</h2>
                    <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
{`src
├── app/                  # Next.js App Router
│   ├── (main)/           # Main application routes (customer-facing)
│   ├── admin/            # Admin panel routes
│   ├── api/              # API routes (not used, server actions preferred)
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles and theme
├── components/           # Reusable React components
│   └── ui/               # ShadCN UI components
├── context/              # Global state management (React Context)
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions, Firebase config
├── ai/                   # Genkit AI flows and configuration
└── functions/            # Firebase Cloud Functions (for triggers)`}
                    </pre>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold border-b pb-2 mb-4">5. User Guide</h2>
                    
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User /> For Customers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Browsing Products</h4>
                                <p className="text-sm text-muted-foreground">On the homepage, you can find products by using the search bar to look for a specific item or by selecting a category from the dropdown menu to filter the view.</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Placing an Order</h4>
                                <p className="text-sm text-muted-foreground">Click on any product to view its details. If the product has options (e.g., size, color), select your desired variant. Choose a quantity and click "Add to Cart". You can continue shopping or go to your cart to checkout.</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Checkout Process</h4>
                                <p className="text-sm text-muted-foreground">In your cart, review your items and proceed to checkout. You must be logged in. Choose a delivery method (Home Delivery or In-store Pickup). Fill in your shipping address if applicable, then select a payment method. You can pay by Card, Mobile Money, or choose to Pay on Delivery.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Managing Your Account</h4>
                                <p className="text-sm text-muted-foreground">Click on your profile icon in the header to access your account. From here you can go to "My Orders" to view your order history and track progress, or "My Wishlist" to see saved items. You can also update your display name and password.</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Receiving Notifications</h4>
                                <p className="text-sm text-muted-foreground">A prompt may appear asking for permission to send notifications. If you accept, you will receive browser push notifications about new products as soon as they are added to the store.</p>
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><UserCog /> For Administrators</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <h4 className="font-semibold">Accessing the Admin Panel</h4>
                                <p className="text-sm text-muted-foreground">Navigate to `/admin/dashboard` or click the Wrench icon in the header. Only authorized admin accounts can access this area. The dashboard provides an overview of revenue, sales, and recent orders.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Product Management</h4>
                                <p className="text-sm text-muted-foreground">In the "Products" tab, you can manage your inventory. Click "Add Product" to open a dialog. Fill in the details, upload images, and add variants (e.g., 'Single' for individual sale, or packs like '12-Pack'). Use the "Generate with AI" button after filling in the name and features to create a product description automatically. You can edit or delete products from the main table.</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Order Management</h4>
                                <p className="text-sm text-muted-foreground">The "Orders" tab lists all customer orders. Click on an order to view its details. You can update the order status (e.g., 'Pending', 'Shipped', 'Delivered'). Changing the status will automatically trigger a customized email notification to the customer.</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Site & Homepage Settings</h4>
                                <p className="text-sm text-muted-foreground">Under "Settings", you can change the App Name, Logo, Theme Colors, Tax Rate, and Shipping Fees. Under "Homepage", you can edit the text in the top announcement bar, set the countdown for flash sales, and manage the slides in the promotional carousel.</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    
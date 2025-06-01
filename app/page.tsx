import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex flex-col items-center justify-center flex-grow p-4 md:p-24 bg-background">
        <div className="max-w-3xl w-full space-y-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Fast, Private Image Resizer
          </h1>
          
          <p className="text-xl text-muted-foreground">
            Resize and compress your images directly in your browser.
            No uploads, no data collection, just results.
          </p>

          <div className="pt-4">
            <Link 
              href="/resize" 
              className="inline-flex items-center gap-2 px-6 py-3 text-lg font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <div className="p-6 bg-card rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Client-Side Processing</h3>
              <p className="text-muted-foreground">Your images never leave your device. All processing happens locally.</p>
            </div>
            
            <div className="p-6 bg-card rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Multiple Formats</h3>
              <p className="text-muted-foreground">Support for modern formats like WebP and AVIF for better compression.</p>
            </div>
            
            <div className="p-6 bg-card rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Size Control</h3>
              <p className="text-muted-foreground">Specify target file size or dimensions for precise control.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
"use client";

import { Github } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="w-full py-6 mt-8">
      <div className="container mx-auto px-4">
        <Separator className="mb-6" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 All Rights Reserved
          </div>
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com/killcod3/image-resizer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Github size={16} />
              <span>Repository</span>
            </a>
            <a 
              href="https://github.com/killcod3" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Made by Jawad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
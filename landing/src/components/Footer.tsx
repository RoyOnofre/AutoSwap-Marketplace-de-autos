import React from 'react';
import { GitBranch, MessageSquare, Camera } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-8" id="footer">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm mb-4 md:mb-0">
          © {new Date().getFullYear()} AutoSwap Bolivia. Todos los derechos reservados.
        </p>
        <div className="flex gap-4">
          <a href="#" aria-label="Repository" className="hover:text-white transition-colors">
            <GitBranch size={20} />
          </a>
          <a href="#" aria-label="Message" className="hover:text-white transition-colors">
            <MessageSquare size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}

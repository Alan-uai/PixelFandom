import { useState } from 'react';

export default function AuthDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="hidden">
        Open Auth Dialog
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Autenticação</h2>
            <p className="text-muted-foreground">
              Diálogo de autenticação em desenvolvimento...
            </p>
            <button 
              onClick={() => setIsOpen(false)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
import { ReactNode } from 'react';

type Props = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function FinanceiroDrawer({ title, isOpen, onClose, children }: Props) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}

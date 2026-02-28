"use client";
import React from 'react';

export default function FilterForm() {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 border border-slate-300 dark:border-slate-700 rounded-md">
      <div className="flex gap-4">
        <input type="text" placeholder="Buscar..." className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded px-3 py-2 w-full max-w-md" />
        <button className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-700 dark:hover:bg-gray-600">Filtrar</button>
      </div>
    </div>
  );
}
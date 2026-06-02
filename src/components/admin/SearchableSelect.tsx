"use client";
import { useState, useRef, useEffect, useCallback } from "react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function SearchableSelect({
  options, value, onChange,
  placeholder = "Select…",
  className = "",
  required = false,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const strValue = String(value ?? "");
  const selected = options.find(o => o.value === strValue);

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const close = useCallback(() => { setOpen(false); setQuery(""); }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") close(); }
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, close]);

  // Focus search input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  function select(val: string) {
    onChange(val);
    close();
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden native select for form validation */}
      {required && (
        <select
          required
          value={strValue}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        >
          <option value="" />
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-left transition-colors focus:outline-none ${open ? "border-[#f69a39] ring-1 ring-[#f69a39]/30" : "hover:border-gray-300"} ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white text-[#1e1e21] cursor-pointer"}`}
      >
        <span className={`truncate ${!selected ? "text-gray-400" : ""}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                className="flex-1 bg-transparent text-sm outline-none text-[#1e1e21] placeholder:text-gray-400"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400 text-center">No results</li>
            ) : (
              filtered.map(o => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => select(o.value)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${o.value === strValue ? "bg-[#fff8f0] text-[#f69a39] font-medium" : "text-[#1e1e21] hover:bg-gray-50"}`}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

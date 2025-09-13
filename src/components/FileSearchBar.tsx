import { Search, Calendar, Filter, X } from 'lucide-react';

type Props = {
  search: string;
  setSearch: (val: string) => void;
  filterType: string;
  setFilterType: (val: string) => void;
  filterDate: { from?: string; to?: string };
  setFilterDate: (val: { from?: string; to?: string }) => void;
  onClear: () => void;
};

export default function FileSearchBar({
  search,
  setSearch,
  filterType,
  setFilterType,
  filterDate,
  setFilterDate,
  onClear,
}: Props) {
  return (
    <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
      {/* 🔍 Buscar por nombre */}
      <div className="flex items-center gap-2 w-full sm:w-1/3">
        <Search size={18} className="text-gray-500 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white w-full"
        />
      </div>

      {/* 📁 Filtrar por tipo */}
      <div className="flex items-center gap-2 w-full sm:w-1/4">
        <Filter size={18} className="text-gray-500 dark:text-gray-300" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white w-full"
        >
          <option value="all">Todos los tipos</option>
          <option value="pdf">PDF</option>
          <option value="image">Imagen</option>
          <option value="video">Video</option>
          <option value="excel">Excel</option>
          <option value="ppt">PowerPoint</option>
          <option value="word">Word</option>
        </select>
      </div>

      {/* 📅 Rango de fechas */}
      <div className="flex items-center gap-2 w-full sm:w-1/4">
        <Calendar size={18} className="text-gray-500 dark:text-gray-300" />
        <input
          type="date"
          value={filterDate.from || ''}
          onChange={(e) => setFilterDate({ ...filterDate, from: e.target.value })}
          className="px-2 py-2 rounded border dark:bg-gray-800 dark:text-white w-full"
        />
        <span className="text-gray-500 dark:text-gray-300">–</span>
        <input
          type="date"
          value={filterDate.to || ''}
          onChange={(e) => setFilterDate({ ...filterDate, to: e.target.value })}
          className="px-2 py-2 rounded border dark:bg-gray-800 dark:text-white w-full"
        />
      </div>

      {/* ❌ Botón limpiar */}
      <button
        onClick={onClear}
        className="flex items-center gap-1 px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      >
        <X size={16} /> Limpiar filtros
      </button>
    </div>
  );
}
import { useState } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { Button, Input } from '../../components/ui';

// ── Types ──────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  color: string;
}

// ── Constants ──────────────────────────────────────────────────

const PRESET_COLORS = [
  '#01696f', // teal
  '#437a22', // green
  '#b45309', // amber
  '#0e7490', // cyan
  '#a12c7b', // pink
  '#dc2626', // red
  '#7c3aed', // violet (only preset)
  '#6b7280', // gray
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Food', color: '#b45309' },
  { id: '2', name: 'Transport', color: '#0e7490' },
  { id: '3', name: 'Shopping', color: '#a12c7b' },
  { id: '4', name: 'Utilities', color: '#6b7280' },
  { id: '5', name: 'Entertainment', color: '#7c3aed' },
  { id: '6', name: 'Health', color: '#dc2626' },
  { id: '7', name: 'Education', color: '#01696f' },
  { id: '8', name: 'EMI/Loans', color: '#b45309' },
  { id: '9', name: 'Income', color: '#437a22' },
  { id: '10', name: 'Other', color: '#6b7280' },
];

// ── Confirm Modal ──────────────────────────────────────────────

function ConfirmModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-[8px] shadow-card-md w-full max-w-[380px] p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#a12c7b]/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#a12c7b]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#28251d]">Delete category?</h3>
            <p className="text-sm text-[#7a7974] mt-1">
              <strong>"{name}"</strong> will be permanently removed. Transactions using this category will be unaffected.
            </p>
          </div>
          <button onClick={onCancel} className="text-[#7a7974] hover:text-[#28251d] transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="md" className="flex-1" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Category Modal (Add / Edit) ────────────────────────────────

function CategoryModal({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Category;
  onSave: (name: string, color: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0]);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('Category name is required'); return; }
    onSave(name.trim(), color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-[8px] shadow-card-md w-full max-w-[380px] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#28251d]">
            {initial ? 'Edit Category' : 'Add Category'}
          </h3>
          <button onClick={onCancel} className="text-[#7a7974] hover:text-[#28251d] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <Input
          label="Category Name"
          placeholder="e.g. Groceries"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          error={error}
          autoFocus
        />

        {/* Color picker */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#28251d]">Color</p>
          <div className="flex gap-2.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={[
                  'w-8 h-8 rounded-full transition-transform hover:scale-110',
                  color === c ? 'ring-2 ring-offset-2 ring-[#28251d] scale-110' : '',
                ].join(' ')}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 mt-1">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-sm text-[#28251d] font-medium">{name || 'Category Name'}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" size="md" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="md" className="flex-1" onClick={handleSave}>
            {initial ? 'Save Changes' : 'Add Category'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleAdd = (name: string, color: string) => {
    setCategories((prev) => [
      ...prev,
      { id: Date.now().toString(), name, color },
    ]);
    setAddOpen(false);
  };

  const handleEdit = (name: string, color: string) => {
    if (!editTarget) return;
    setCategories((prev) =>
      prev.map((c) => (c.id === editTarget.id ? { ...c, name, color } : c))
    );
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="bg-white rounded-[8px] shadow-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#28251d]">Transaction Categories</p>
            <p className="text-xs text-[#7a7974] mt-0.5">{categories.length} categories</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-4 py-3 rounded-[8px] border border-[#e9e7e1] hover:border-[#d4d2cc] bg-[#fafaf8] transition-colors group"
            >
              {/* Color dot */}
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />

              {/* Name */}
              <span className="flex-1 text-sm font-medium text-[#28251d] min-w-0 truncate">
                {cat.name}
              </span>

              {/* Actions — always visible on mobile, fade-in on desktop */}
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditTarget(cat)}
                  className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#7a7974] hover:text-[#28251d] hover:bg-[#f0ede6] transition-colors"
                  aria-label={`Edit ${cat.name}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(cat)}
                  className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#7a7974] hover:text-[#a12c7b] hover:bg-[#a12c7b]/8 transition-colors"
                  aria-label={`Delete ${cat.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {addOpen && (
        <CategoryModal onSave={handleAdd} onCancel={() => setAddOpen(false)} />
      )}

      {editTarget && (
        <CategoryModal
          initial={editTarget}
          onSave={handleEdit}
          onCancel={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

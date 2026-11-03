import React, { useState } from 'react';
import { BusinessCategory } from '../../../domain/models/book';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Home, Briefcase, ShoppingBag, X } from 'lucide-react';

interface AddBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, category: BusinessCategory) => Promise<void>;
}

export const AddBusinessModal: React.FC<AddBusinessModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('retail');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a business name');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreate(name.trim(), category);
      setName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blackstone/60 backdrop-blur-sm animate-fade-in">
      <Card shadowSize="lg" className="w-full max-w-lg bg-canvas border-2 border-blackstone p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded bg-surface border-2 border-blackstone flex items-center justify-center hover:bg-canvas transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-blackstone" />
        </button>

        <h2 className="text-xl font-bold font-heading text-blackstone tracking-tight mb-1">
          Add New Business Book
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          Choose a business category to enable specialized bookkeeping features.
        </p>

        {error && (
          <div className="mb-4 p-2.5 bg-danger/10 border-2 border-danger rounded text-xs font-bold text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Business Name"
            placeholder="e.g. Mlimani Wholesale, Kariakoo Apartments"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80 mb-2">
              Select Business Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Retail / Wholesale Option */}
              <button
                type="button"
                onClick={() => setCategory('retail')}
                className={`p-3 rounded-control border-2 text-left transition-all cursor-pointer ${
                  category === 'retail'
                    ? 'border-blackstone bg-citron-lime shadow-[3px_3px_0px_#A678B9] translate-x-[-2px] translate-y-[-2px]'
                    : 'border-blackstone/30 bg-surface hover:border-blackstone'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded bg-blackstone text-citron-lime flex items-center justify-center font-bold">
                    <ShoppingBag className="w-3 h-3" />
                  </div>
                  <span className="font-extrabold text-xs text-blackstone truncate">Retail / Stock</span>
                </div>
                <p className="text-[10px] text-blackstone/80 leading-snug">
                  Inventory items, COGS, sales & running-low stock alerts.
                </p>
              </button>

              {/* Rental Option */}
              <button
                type="button"
                onClick={() => setCategory('rental')}
                className={`p-3 rounded-control border-2 text-left transition-all cursor-pointer ${
                  category === 'rental'
                    ? 'border-blackstone bg-vivid-amber shadow-[3px_3px_0px_#A678B9] translate-x-[-2px] translate-y-[-2px]'
                    : 'border-blackstone/30 bg-surface hover:border-blackstone'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded bg-blackstone text-vivid-amber flex items-center justify-center font-bold">
                    <Home className="w-3 h-3" />
                  </div>
                  <span className="font-extrabold text-xs text-blackstone truncate">Rental</span>
                </div>
                <p className="text-[10px] text-blackstone/80 leading-snug">
                  Rooms, tenants, rent due dates & 10-day payment alerts.
                </p>
              </button>

              {/* Other Business Option */}
              <button
                type="button"
                onClick={() => setCategory('other')}
                className={`p-3 rounded-control border-2 text-left transition-all cursor-pointer ${
                  category === 'other'
                    ? 'border-blackstone bg-electric-sky shadow-[3px_3px_0px_#A678B9] translate-x-[-2px] translate-y-[-2px]'
                    : 'border-blackstone/30 bg-surface hover:border-blackstone'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded bg-blackstone text-electric-sky flex items-center justify-center font-bold">
                    <Briefcase className="w-3 h-3" />
                  </div>
                  <span className="font-extrabold text-xs text-blackstone truncate">Other</span>
                </div>
                <p className="text-[10px] text-blackstone/80 leading-snug">
                  Standard cash book: daily sales & general expenses.
                </p>
              </button>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Button type="button" variant="outline" size="md" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" className="flex-1 font-black" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Business'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

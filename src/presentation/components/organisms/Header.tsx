import React, { useState, useRef, useEffect } from 'react';
import { useBook } from '../../context/BookContext';
import { Settings, Pencil, Check, X, ChevronDown, Plus, Home, Briefcase, ShoppingBag } from 'lucide-react';
import { AddBusinessModal } from './AddBusinessModal';

interface HeaderProps {
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const {
    book,
    books,
    switchBook,
    createBusiness,
    renameBook,
  } = useBook();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(book?.name || '');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditName(book?.name || '');
  }, [book]);

  // Click outside listener for switcher dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveRename = async () => {
    if (editName.trim()) {
      await renameBook(editName.trim());
      setIsEditing(false);
    }
  };

  const isRental = book?.category === 'rental';
  const isRetail = book?.category === 'retail';

  return (
    <>
      <header className="pt-4 px-4 pb-3 sticky top-0 bg-canvas/95 backdrop-blur-md z-30 border-b border-blackstone/10">
        <div className="flex items-start justify-between max-w-5xl mx-auto gap-2">
          {/* Business Info & Switcher */}
          <div className="min-w-0 flex-1 relative" ref={switcherRef}>
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 px-2 text-base font-extrabold border-2 border-blackstone rounded bg-surface"
                  autoFocus
                />
                <button
                  onClick={handleSaveRename}
                  className="w-8 h-8 rounded bg-citron-lime border border-blackstone flex items-center justify-center cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-blackstone" />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-8 h-8 rounded bg-surface border border-blackstone flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-blackstone" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Switcher Button */}
                <button
                  onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                  className="flex items-center gap-2 group px-2.5 py-1 bg-surface border-2 border-blackstone rounded-control shadow-sm hover:shadow-brutal transition-all cursor-pointer"
                  title="Switch or add business"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs font-black border border-blackstone ${
                        isRetail
                          ? 'bg-citron-lime text-blackstone'
                          : isRental
                          ? 'bg-vivid-amber text-blackstone'
                          : 'bg-electric-sky text-blackstone'
                      }`}
                    >
                      {isRetail ? (
                        <ShoppingBag className="w-3 h-3" />
                      ) : isRental ? (
                        <Home className="w-3 h-3" />
                      ) : (
                        <Briefcase className="w-3 h-3" />
                      )}
                    </span>
                    <span className="text-base sm:text-lg font-black font-heading tracking-tight text-blackstone truncate max-w-[150px] sm:max-w-[220px]">
                      {book?.name || 'My Business'}
                    </span>
                  </div>

                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase border border-blackstone/40 ${
                      isRetail
                        ? 'bg-citron-lime-tint text-blackstone'
                        : isRental
                        ? 'bg-vivid-amber-tint text-blackstone'
                        : 'bg-electric-sky-tint text-blackstone'
                    }`}
                  >
                    {isRetail ? 'Retail' : isRental ? 'Rental' : 'Other'}
                  </span>

                  <ChevronDown className="w-3.5 h-3.5 text-blackstone/70 group-hover:text-blackstone" />
                </button>

                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded text-blackstone/40 hover:text-blackstone cursor-pointer"
                  title="Rename active business"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Switcher Dropdown Popover */}
            {isSwitcherOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-canvas border-2 border-blackstone rounded-control shadow-brutal-lg z-50 p-2 animate-fade-in space-y-2">
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-text-secondary flex justify-between items-center border-b border-blackstone/10 pb-1.5">
                  <span>Your Businesses ({books.length})</span>
                  <span>Category</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1">
                  {books.map((b) => {
                    const isActive = b.id === book?.id;
                    const bIsRental = b.category === 'rental';
                    const bIsRetail = b.category === 'retail';

                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          switchBook(b.id);
                          setIsSwitcherOpen(false);
                        }}
                        className={`w-full p-2 rounded flex items-center justify-between text-left transition-all border cursor-pointer ${
                          isActive
                            ? 'bg-surface border-blackstone font-black shadow-[3px_3px_0px_#A678B9] translate-x-[-1px] translate-y-[-1px]'
                            : 'border-transparent hover:bg-surface/80'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] border border-blackstone ${
                              bIsRetail
                                ? 'bg-citron-lime text-blackstone'
                                : bIsRental
                                ? 'bg-vivid-amber text-blackstone'
                                : 'bg-electric-sky text-blackstone'
                            }`}
                          >
                            {bIsRetail ? (
                              <ShoppingBag className="w-2.5 h-2.5" />
                            ) : bIsRental ? (
                              <Home className="w-2.5 h-2.5" />
                            ) : (
                              <Briefcase className="w-2.5 h-2.5" />
                            )}
                          </span>
                          <span className="text-xs font-extrabold text-blackstone truncate">{b.name}</span>
                        </div>

                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-blackstone/30 ${
                            bIsRetail
                              ? 'bg-citron-lime-tint text-blackstone'
                              : bIsRental
                              ? 'bg-vivid-amber-tint text-blackstone'
                              : 'bg-electric-sky-tint text-blackstone'
                          }`}
                        >
                          {b.category || 'other'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 border-t border-blackstone/10">
                  <button
                    onClick={() => {
                      setIsSwitcherOpen(false);
                      setIsAddModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded bg-citron-lime border-2 border-blackstone text-blackstone text-xs font-black flex items-center justify-center gap-1.5 hover:bg-citron-lime-dark transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Business Book</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings Action Button */}
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="w-11 h-11 bg-surface border-2 border-blackstone rounded-control flex items-center justify-center shadow-brutal neo-press cursor-pointer shrink-0"
          >
            <Settings className="w-4 h-4 text-blackstone" />
          </button>
        </div>
      </header>

      {/* Add Business Modal */}
      <AddBusinessModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreate={async (name, cat) => {
          await createBusiness(name, cat);
        }}
      />
    </>
  );
};

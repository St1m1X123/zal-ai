'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'


const typeLabels = { weight_reps: 'Вага', time: 'Час', bodyweight: 'Власна вага' }

const CATEGORIES = ['Усі', 'Груди', 'Спина', 'Ноги', 'Плечі', 'Руки', 'Прес', 'Кардіо', 'Розтяжка', 'Інше']

export default function ExerciseSelector({
    // Режим 1: create-workout (controlled)
    isOpen,
    onClose,
    onSelect,
    searchQuery: externalSearch,
    setSearchQuery: externalSetSearch,
    activeCategory: externalCategory,
    setActiveCategory: externalSetCategory,
    categories: externalCategories,
    filteredDbExercises: externalFiltered,
    isLoadingExercises,
    isExactMatch: externalExactMatch,
    handleCreateCustomExercise,
    isCreatingCustom,
    user, // Передаємо юзера, щоб знати, чи можна видаляти
    handleDeleteCustomExercise, // Функція видалення
}) {
    // Внутрішній стан для режиму workout (без controlled props)
    const [internalSearch, setInternalSearch] = useState('')
    const [internalCategory, setInternalCategory] = useState('Усі')

    // Якщо isOpen передано як false — не рендеримо (controlled режим)
    if (isOpen === false) return null

    // Визначаємо: controlled (create-workout) чи standalone (workout)
    const isControlled = externalSearch !== undefined
    const search = isControlled ? externalSearch : internalSearch
    const setSearch = isControlled ? externalSetSearch : setInternalSearch
    const category = isControlled ? externalCategory : internalCategory
    const setCategory = isControlled ? externalSetCategory : setInternalCategory
    const categories = externalCategories || CATEGORIES

    // В standalone режимі — фільтруємо передані вправи або показуємо loader
    const filteredExercises = externalFiltered ?? []
    const loading = isLoadingExercises ?? false
    const exactMatch = externalExactMatch ?? false
    const canCreate = handleCreateCustomExercise && search.trim().length > 0 && !exactMatch

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-[#080b10]/90 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md mx-auto rounded-t-[28px] h-[88vh] flex flex-col border-t border-white/[0.07] bg-[#0d1117] animate-in slide-in-from-bottom duration-300 overflow-hidden">

                {/* Drag handle */}
                <div className="w-full flex justify-center pt-3 pb-2 shrink-0">
                    <div className="w-10 h-1 bg-white/[0.08] rounded-full" />
                </div>

                {/* Заголовок */}
                <div className="px-5 pb-3 flex items-center justify-between shrink-0">
                    <div>
                        <p className="text-[9px] font-bold text-[#22D3EE]/50 uppercase tracking-[0.25em] mb-0.5">ZalAI</p>
                        <h3 className="text-base font-bold text-white">Вибір вправи</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/30 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Пошук */}
                <div className="px-5 pb-3 shrink-0">
                    <div className="relative">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Пошук вправи..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/[0.04] text-white rounded-xl pl-10 pr-4 py-3 outline-none border border-white/[0.07] focus:border-[#A3E635]/35 focus:bg-[#A3E635]/[0.02] placeholder:text-white/25 transition-all text-sm"
                        />
                    </div>
                </div>

                {/* Категорії */}
                <div className="flex overflow-x-auto gap-2 px-5 pb-4 shrink-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${category === cat
                                ? 'bg-[#A3E635] text-[#080b10] shadow-[0_0_12px_rgba(163,230,53,0.3)]'
                                : 'bg-white/[0.04] text-white/35 border border-white/[0.07] hover:border-[#A3E635]/25 hover:text-white/60'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Список */}
                <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-2 [&::-webkit-scrollbar]:hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-8 h-8 border-2 border-[#A3E635]/20 border-t-[#A3E635] rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Завантаження</span>
                        </div>
                    ) : filteredExercises.length > 0 ? (
                        <>
                            {filteredExercises.map(dbEx => (
                                <div key={dbEx.id} className="flex items-stretch gap-2">
                                    {/* Select button */}
                                    <button
                                        onClick={() => onSelect(dbEx)}
                                        className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#A3E635]/25 hover:bg-white/[0.05] active:scale-[0.98] transition-all text-left group"
                                    >
                                        <div>
                                            <p className="text-white/85 font-medium text-sm group-hover:text-white transition-colors">
                                                {dbEx.name}
                                            </p>
                                            <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider mt-0.5">
                                                {typeLabels[dbEx.type] || dbEx.type}
                                            </p>
                                        </div>
                                        {dbEx.muscle && (
                                            <span className="text-[9px] font-bold text-[#A3E635]/40 uppercase tracking-wider border border-[#A3E635]/15 px-2 py-1 rounded-lg shrink-0 ml-3 group-hover:border-[#A3E635]/30 group-hover:text-[#A3E635]/70 transition-all">
                                                {dbEx.muscle}
                                            </span>
                                        )}
                                    </button>

                                    {/* Delete or Info link */}
                                    <div className="flex items-stretch gap-1.5 shrink-0">
                                        <Link
                                            href={`/exercises/${dbEx.id}`}
                                            className="flex items-center justify-center w-10 sm:w-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#22D3EE]/30 hover:bg-[rgba(34,211,238,0.05)] active:scale-[0.95] transition-all"
                                            title="Детальніше про вправу"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <svg className="w-4 h-4 text-white/25 hover:text-[#22D3EE] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                                            </svg>
                                        </Link>
                                        
                                        {dbEx.created_by && user && dbEx.created_by === user.id && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Ви впевнені, що хочете видалити власну вправу "${dbEx.name}"?`)) {
                                                        handleDeleteCustomExercise && handleDeleteCustomExercise(dbEx.id);
                                                    }
                                                }}
                                                className="flex items-center justify-center w-10 md:w-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 active:scale-[0.95] transition-all text-white/20"
                                                title="Видалити власну вправу"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}


                            {/* Кнопка створення власної */}
                            {canCreate && (
                                <button
                                    onClick={handleCreateCustomExercise}
                                    disabled={isCreatingCustom}
                                    className="mt-2 flex flex-col items-center justify-center w-full p-5 rounded-2xl border border-dashed border-[#A3E635]/30 bg-[#A3E635]/[0.03] hover:bg-[#A3E635]/[0.06] active:scale-[0.98] transition-all disabled:opacity-50 gap-1.5"
                                >
                                    <span className="text-[10px] font-bold text-[#A3E635] uppercase tracking-widest flex items-center gap-2">
                                        {isCreatingCustom
                                            ? <span className="w-3 h-3 border border-[#A3E635] border-t-transparent rounded-full animate-spin" />
                                            : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                        }
                                        {isCreatingCustom ? 'Збереження...' : 'Створити свою вправу'}
                                    </span>
                                    <span className="text-white font-semibold text-base">"{search}"</span>
                                    <span className="text-white/30 text-[9px] uppercase tracking-widest">
                                        {category === 'Усі' ? 'Категорія: Інше' : `Категорія: ${category}`}
                                    </span>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                            <p className="text-white/25 text-sm">Вправу не знайдено</p>
                            {canCreate && (
                                <button
                                    onClick={handleCreateCustomExercise}
                                    disabled={isCreatingCustom}
                                    className="mt-1 flex flex-col items-center justify-center w-full p-5 rounded-2xl border border-dashed border-[#A3E635]/30 bg-[#A3E635]/[0.03] hover:bg-[#A3E635]/[0.06] active:scale-[0.98] transition-all disabled:opacity-50 gap-1.5"
                                >
                                    <span className="text-[10px] font-bold text-[#A3E635] uppercase tracking-widest flex items-center gap-2">
                                        {isCreatingCustom
                                            ? <span className="w-3 h-3 border border-[#A3E635] border-t-transparent rounded-full animate-spin" />
                                            : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                        }
                                        {isCreatingCustom ? 'Збереження...' : 'Створити свою вправу'}
                                    </span>
                                    <span className="text-white font-semibold text-base">"{search}"</span>
                                    <span className="text-white/30 text-[9px] uppercase tracking-widest">
                                        {category === 'Усі' ? 'Категорія: Інше' : `Категорія: ${category}`}
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

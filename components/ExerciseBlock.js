'use client'

export default function ExerciseBlock({
    block, blockIndex,
    handleOpenModal, handleRemoveExercise, handleUpdateExercise,
    handleUpdateSet, handleRemoveSet, handleAddSet, handleAddToSuperset
}) {
    const isSuperset = block.length > 1

    return (
        <div className="neural-card rounded-3xl p-5 animate-in fade-in zoom-in-95 duration-200">

            {isSuperset && (
                <div className="mb-5 pb-3 border-b border-white/[0.05] flex items-center gap-2">
                    <div className="ai-badge">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Суперсет
                    </div>
                </div>
            )}

            {block.map((ex, idx) => {
                const isTimeType = ex.type === 'time'
                const isBodyweight = ex.type === 'bodyweight'

                return (
                    <div key={ex.id} className={idx > 0 ? 'mt-7 pt-7 border-t border-white/[0.05]' : ''}>

                        {/* Назва вправи */}
                        <div className="flex items-center gap-2 mb-3">
                            <button
                                onClick={() => handleOpenModal(ex.id)}
                                className={`flex-1 text-left font-semibold pb-1.5 border-b transition-all truncate ${ex.name
                                    ? 'text-white/90 border-transparent text-base'
                                    : 'text-white/25 border-white/[0.08] hover:border-[#A3E635]/30 text-sm'
                                    }`}
                            >
                                {ex.name ? ex.name : (
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#A3E635]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Вибрати вправу...
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => { if (window.confirm('Видалити вправу?')) handleRemoveExercise(ex.id) }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Нотатка */}
                        <input
                            type="text"
                            placeholder="Нотатка до вправи..."
                            value={ex.note}
                            onChange={(e) => handleUpdateExercise(ex.id, 'note', e.target.value)}
                            className="w-full bg-transparent text-[11px] text-[#22D3EE]/50 outline-none placeholder:text-white/15 mb-3"
                        />

                        {/* Тип вправи */}
                        <div className="flex bg-[#0d1117] p-1 rounded-xl border border-white/[0.05] mb-5">
                            {[
                                { key: 'weight_reps', label: 'Вага' },
                                { key: 'bodyweight', label: 'Власна' },
                                { key: 'time', label: 'Час' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => handleUpdateExercise(ex.id, 'type', key)}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${ex.type === key
                                        ? 'bg-[#A3E635] text-[#080b10] shadow-[0_0_12px_rgba(163,230,53,0.25)]'
                                        : 'text-white/30 hover:text-white/60'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Заголовки */}
                        <div className={`grid px-1 mb-2 mt-6 gap-2 ${isTimeType ? 'grid-cols-[28px_1fr_1fr_32px]' : 'grid-cols-[28px_1fr_1fr_32px]'}`}>
                            <div className="text-center text-[9px] font-bold text-white/45 uppercase tracking-wider">№</div>
                            <div className="text-center text-[9px] font-bold text-white/45 uppercase tracking-wider">
                                {isTimeType ? 'Хв' : (isBodyweight ? '—' : 'Кг')}
                            </div>
                            <div className="text-center text-[9px] font-bold text-white/45 uppercase tracking-wider">
                                {isTimeType ? 'Сек' : 'Повтори'}
                            </div>
                            <div />
                        </div>

                        {/* Підходи */}
                        <div className="flex flex-col gap-2">
                            {ex.sets.map((set, setIndex) => (
                                <div key={set.id} className="grid grid-cols-[28px_1fr_1fr_32px] gap-2 items-center rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] focus-within:border-[#A3E635]/25 focus-within:bg-[#A3E635]/[0.02] transition-all">
                                    {/* Номер */}
                                    <div className="flex items-center justify-center h-full bg-black/20 text-[10px] font-bold font-mono text-white/30 p-2.5">
                                        {setIndex + 1}
                                    </div>

                                    {isTimeType ? (
                                        <>
                                            <div className="flex flex-col items-center py-2">
                                                <input type="number" inputMode="numeric" placeholder="0" value={set.time_minutes}
                                                    onChange={(e) => handleUpdateSet(ex.id, set.id, 'time_minutes', e.target.value)}
                                                    className="w-full bg-transparent text-center text-xl font-mono font-bold text-white outline-none placeholder:text-white/10" />
                                                <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider mt-0.5">хв</span>
                                            </div>
                                            <div className="flex flex-col items-center py-2">
                                                <input type="number" inputMode="numeric" placeholder="0" value={set.time_seconds}
                                                    onChange={(e) => handleUpdateSet(ex.id, set.id, 'time_seconds', e.target.value)}
                                                    className="w-full bg-transparent text-center text-xl font-mono font-bold text-white outline-none placeholder:text-white/10" />
                                                <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider mt-0.5">сек</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {isBodyweight ? (
                                                <div className="flex flex-col items-center py-2">
                                                    <span className="text-white/15 text-xl font-light">—</span>
                                                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-wider mt-0.5">власна</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center py-2">
                                                    <input type="number" inputMode="decimal" placeholder="0" value={set.weight}
                                                        onChange={(e) => handleUpdateSet(ex.id, set.id, 'weight', e.target.value)}
                                                        className="w-full bg-transparent text-center text-xl font-mono font-bold text-white outline-none placeholder:text-white/10" />
                                                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider mt-0.5">кг</span>
                                                </div>
                                            )}
                                            <div className="flex flex-col items-center py-2">
                                                <input type="number" inputMode="numeric" placeholder="0" value={set.reps}
                                                    onChange={(e) => handleUpdateSet(ex.id, set.id, 'reps', e.target.value)}
                                                    className="w-full bg-transparent text-center text-xl font-mono font-bold text-white outline-none placeholder:text-white/10" />
                                                <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider mt-0.5">рп</span>
                                            </div>
                                        </>
                                    )}

                                    {/* Видалити підхід */}
                                    <button onClick={() => handleRemoveSet(ex.id, set.id)}
                                        className="flex items-center justify-center h-full text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all p-2">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Додати підхід */}
                        <button
                            onClick={() => handleAddSet(ex.id)}
                            className="w-full mt-3 py-2.5 border border-dashed border-white/[0.08] text-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-[#A3E635]/30 hover:text-[#A3E635]/70 transition-all flex items-center justify-center gap-1.5"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Додати підхід
                        </button>
                    </div>
                )
            })}

            {/* Суперсет кнопка */}
            <div className="w-full flex justify-center mt-5 pt-5 border-t border-white/[0.05]">
                <button
                    onClick={() => handleAddToSuperset(block)}
                    className="px-5 py-2 bg-[#22D3EE]/5 border border-[#22D3EE]/15 text-[#22D3EE]/60 rounded-full font-bold uppercase tracking-widest text-[9px] hover:border-[#22D3EE]/35 hover:text-[#22D3EE] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Додати до {isSuperset ? 'суперсету' : 'блоку'}
                </button>
            </div>
        </div>
    )
}

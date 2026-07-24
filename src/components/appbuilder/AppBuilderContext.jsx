import React, { createContext, useContext } from 'react';
import { useAppBuilderState } from '../../hooks/useAppBuilderState';

const AppBuilderContext = createContext(null);

export const AppBuilderProvider = ({ children }) => {
    // 1. Dapatkan semua state dari custom hook yang sudah dibuat
    const state = useAppBuilderState();

    // 2. Jika Anda ingin memindahkan event handler (seperti handleSave, addStep),
    // letakkan di sini agar bisa diakses oleh semua komponen anak tanpa melempar props.
    // Contoh:
    // const handleSave = () => { /* logika save menggunakan state di atas */ };

    // 3. Gabungkan state dan handlers ke dalam value
    const contextValue = {
        ...state,
        // tambahkan handler di sini nanti
        // handleSave,
        // addStep,
    };

    return (
        <AppBuilderContext.Provider value={contextValue}>
            {children}
        </AppBuilderContext.Provider>
    );
};

export const useAppBuilderContext = () => {
    const context = useContext(AppBuilderContext);
    if (!context) {
        throw new Error('useAppBuilderContext must be used within an AppBuilderProvider');
    }
    return context;
};

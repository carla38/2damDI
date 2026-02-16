/**
 * DB.JS
 * Interacción con la base de datos (Tablas: transaction, categories)
 */

App.DB = {
    // === TRANSACTIONS ===

    // === TRANSACTIONS ===

    // Obtener todas las transacciones del usuario
    // Obtener todas las transacciones del usuario
    getTransactions: async function () {
        if (!App.user) return { error: 'No authenticated user' };

        // Obtener Transacciones CON archivos asociados (join via FK)
        const { data: transactions, error: transError } = await App.supabase
            .from('transactions')
            .select('*, files(file_url)')
            .eq('user_id', App.user.id)
            .order('date', { ascending: false })
            .order('id', { ascending: false }); // Desempate: más reciente primero

        if (transError) {
            console.error('Error fetching transactions:', transError);
            return { error: transError };
        }

        if (!transactions || transactions.length === 0) {
            App.state.transactions = [];
            return { data: [] };
        }

        // Mapear archivos embebidos → file_url en cada transacción
        // [FIX] Supabase puede retornar files como array O como objeto según constraints
        transactions.forEach(t => {
            if (t.files) {
                if (Array.isArray(t.files)) {
                    // Caso normal: relación one-to-many → array de objetos
                    if (t.files.length > 0) {
                        t.file_url = t.files[0].file_url;
                    }
                } else if (t.files.file_url) {
                    // Caso: relación one-to-one (UNIQUE constraint) → objeto directo
                    t.file_url = t.files.file_url;
                }
            }
            delete t.files; // Limpiar objeto anidado
        });

        console.log('[DB] Transacciones cargadas:', transactions.length,
            '| Con archivo:', transactions.filter(t => t.file_url).length);

        App.state.transactions = transactions;
        return { data: transactions };
    },

    // Crear transacción
    addTransaction: async function (transaction) {
    if (!App.user) return { error: 'No user' };

    transaction.user_id = App.user.id;

    const { data, error } = await App.supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();

    if (error) {
        console.error("INSERT TRANSACTION ERROR:", error);
        return { error };
    }

    console.log("NEW TRANSACTION CREATED:", data);
    console.log("NEW TRANSACTION ID:", data.id);

    const newTrans = data;

    if (!App.state.transactions) App.state.transactions = [];
    App.state.transactions.unshift(newTrans);

    return { data: newTrans };
},


    // Actualizar transacción
    updateTransaction: async function (id, updates) {
        if (!App.user) return { error: 'No user' };

        const { error } = await App.supabase
            .from('transactions')
            .update(updates)
            .eq('id', id);

        if (error) return { error };

        // Actualizar caché local
        const index = App.state.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            App.state.transactions[index] = { ...App.state.transactions[index], ...updates };
            // Sort again in case date changed (with id tiebreaker)
            App.state.transactions.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
        }

        return { success: true };
    },



    // Borrar transacción
    deleteTransaction: async function (id) {
        const { error } = await App.supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) return { error };

        // Eliminar de caché local
        App.state.transactions = App.state.transactions.filter(t => String(t.id) !== String(id));
        return { success: true };
    },

    // === CATEGORIES ===

    // Obtener categorías
    getCategories: async function () {
        if (!App.user) return { error: 'No user' };

        const { data, error } = await App.supabase
            .from('categories')
            .select('*')
            .eq('user_id', App.user.id)
            .order('name');

        if (error) {
            console.warn('Error fetching categories (using defaults?):', error);
            // Si falla (ej. tabla no existe), retornamos vacío o error manejado
            return { error };
        }

        App.state.categories = data;
        return { data };
    },

    // Crear categoría
    addCategory: async function (category) {
        if (!App.user) return { error: 'No user' };

        category.user_id = App.user.id;

        const { data, error } = await App.supabase
            .from('categories')
            .insert([category])
            .select();

        if (error) return { error };

        // Actualizar caché
        App.state.categories.push(data[0]);
        // Reordenar por nombre (opcional)
        App.state.categories.sort((a, b) => a.name.localeCompare(b.name));

        return { data: data[0] };
    },

    // Borrar categoría
    deleteCategory: async function (id) {
        // 1. Obtener nombre de la categoría a borrar
        const categoryToDelete = App.state.categories.find(c => String(c.id) === String(id));
        if (!categoryToDelete) return { error: { message: 'Categoría no encontrada' } };

        const categoryName = categoryToDelete.name;

        // 2. Actualizar transacciones asociadas a "Ninguna"
        // NOTA: Esto asume que 'Ninguna' es el valor por defecto en texto.
        const { error: updateError } = await App.supabase
            .from('transactions')
            .update({ category: 'Ninguna' })
            .eq('category', categoryName)
            .eq('user_id', App.user.id); // Asegurar que solo sean del usuario

        if (updateError) {
            console.error('Error reassigning transactions:', updateError);
            return { error: updateError };
        }

        // 3. Eliminar la categoría
        const { error } = await App.supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) return { error };

        App.state.categories = App.state.categories.filter(c => String(c.id) !== String(id));

        // Actualizar transacciones locales también para reflejar el cambio inmediato
        if (App.state.transactions) {
            App.state.transactions.forEach(t => {
                if (t.category === categoryName) {
                    t.category = 'Ninguna';
                }
            });
        }

        return { success: true };
    },

    // === FILES (tabla files) ===

    /**
     * Obtener todos los archivos del usuario (para mapear a transacciones).
     * @returns {Promise<{data: Array|null, error: object|null}>}
     */
    getFiles: async function () {
        if (!App.user) return { data: [], error: null };

        const { data, error } = await App.supabase
            .from('files')
            .select('*');

        if (error) {
            console.warn('Error fetching files:', error);
            return { data: [], error };
        }

        return { data: data || [], error: null };
    },

    /**
     * Obtener archivo asociado a una transacción.
     * @param {string} transactionId
     * @returns {Promise<{data: object|null, error: object|null}>}
     */
    getFileByTransactionId: async function (transactionId) {
        const { data, error } = await App.supabase
            .from('files')
            .select('*')
            .eq('transaction_id', transactionId)
            .maybeSingle();

        return { data, error };
    },

    /**
     * Registrar un archivo en la tabla files.
     * @param {string} transactionId
     * @param {string} fileUrl - Ruta del archivo en Storage
     * @returns {Promise<{data: object|null, error: object|null}>}
     */
    addFile: async function (transactionId, fileUrl) {

    console.log("ADDING FILE RECORD:");
    console.log("transactionId:", transactionId);
    console.log("fileUrl:", fileUrl);
    console.log("userId:", App.user.id);

    if (!transactionId) {
        console.error("ERROR: transactionId is NULL or undefined");
        return { error: { message: "transactionId missing" } };
    }

    const { data, error } = await App.supabase
        .from('files')
        .insert([{
            transaction_id: transactionId,
            file_url: fileUrl,
            user_id: App.user.id
        }])
        .select()
        .single();

    if (error) {
        console.error("SUPABASE INSERT FILE ERROR:", error);
        return { error };
    }

    console.log("FILE RECORD CREATED:", data);

    return { data };
},


    /**
     * Eliminar registro de archivo por transaction_id.
     * @param {string} transactionId
     * @returns {Promise<{success: boolean, error: object|null}>}
     */
    deleteFileByTransactionId: async function (transactionId) {
        const { error } = await App.supabase
            .from('files')
            .delete()
            .eq('transaction_id', transactionId);

        if (error) {
            console.error('Error deleting file record:', error);
            return { success: false, error };
        }

        return { success: true, error: null };
    },

    // === BORRADO COMPLETO DE CUENTA ===

    /**
     * Elimina todos los datos del usuario de la DB (files, transactions, categories).
     * Se usa en la secuencia de borrado de cuenta.
     * @returns {Promise<{success: boolean, error: object|null}>}
     */
    deleteAllUserData: async function () {
        if (!App.user) return { success: false, error: { message: 'No user' } };
        const userId = App.user.id;

        try {
            // 1. Eliminar registros de files
            const { error: filesError } = await App.supabase
                .from('files')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all (RLS filters by user)

            if (filesError) console.warn('Error deleting files records:', filesError);

            // 2. Eliminar transacciones
            const { error: transError } = await App.supabase
                .from('transactions')
                .delete()
                .eq('user_id', userId);

            if (transError) console.warn('Error deleting transactions:', transError);

            // 3. Eliminar categorías
            const { error: catError } = await App.supabase
                .from('categories')
                .delete()
                .eq('user_id', userId);

            if (catError) console.warn('Error deleting categories:', catError);

            return { success: true, error: null };
        } catch (err) {
            console.error('deleteAllUserData error:', err);
            return { success: false, error: err };
        }
    }
};

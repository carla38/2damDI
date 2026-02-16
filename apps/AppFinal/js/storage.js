/**
 * STORAGE.JS
 * Gestión de archivos en Supabase Storage.
 * Bucket: user-files
 */

App.Storage = {

    /** Nombre del bucket de Supabase Storage */
    BUCKET: 'user-files',

    /**
     * Sube un archivo al Storage de Supabase.
     * Ruta: userId/timestamp_filename
     * @param {File} file - Archivo a subir
     * @param {string} userId - ID del usuario autenticado
     * @returns {Promise<{path: string|null, error: object|null}>}
     */
    uploadFile: async function (file, userId) {
        if (!file || !userId) return { path: null, error: { message: 'Archivo o usuario no válido' } };

        // Generar ruta única: userId/timestamp_filename
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${userId}/${timestamp}_${safeName}`;

        const { data, error } = await App.supabase.storage
            .from(this.BUCKET)
            .upload(filePath, file);

        if (error) {
            console.error('Storage upload error:', error);
            return { path: null, error };
        }

        return { path: filePath, error: null };
    },

    /**
     * Genera una URL firmada temporal para acceder a un archivo.
     * @param {string} path - Ruta del archivo en el bucket
     * @param {number} [expiresIn=3600] - Segundos de validez (default 1 hora)
     * @returns {Promise<{signedUrl: string|null, error: object|null}>}
     */
    createSignedUrl: async function (path, expiresIn = 3600) {
        if (!path) {
            console.warn('[Storage] createSignedUrl: path vacío o nulo');
            return { signedUrl: null, error: { message: 'Ruta no proporcionada' } };
        }

        console.log('[Storage] Generando signed URL para path:', path);

        const { data, error } = await App.supabase.storage
            .from(this.BUCKET)
            .createSignedUrl(path, expiresIn);

        if (error) {
            console.error('[Storage] Signed URL error para path:', path, error);
            // Intentar URL pública como fallback
            console.log('[Storage] Intentando URL pública como fallback...');
            return this.getPublicUrl(path);
        }

        console.log('[Storage] Signed URL generada correctamente:', data.signedUrl ? 'OK' : 'VACÍA');
        return { signedUrl: data.signedUrl, error: null };
    },

    /**
     * Genera la URL pública de un archivo (fallback si signed URL falla).
     * Requiere que el bucket tenga políticas de lectura pública o RLS adecuado.
     * @param {string} path - Ruta del archivo en el bucket
     * @returns {{signedUrl: string|null, error: object|null}}
     */
    getPublicUrl: function (path) {
        if (!path) return { signedUrl: null, error: { message: 'Ruta no proporcionada' } };

        const { data } = App.supabase.storage
            .from(this.BUCKET)
            .getPublicUrl(path);

        if (data && data.publicUrl) {
            console.log('[Storage] URL pública generada:', data.publicUrl);
            return { signedUrl: data.publicUrl, error: null };
        }

        console.error('[Storage] No se pudo generar URL pública para:', path);
        return { signedUrl: null, error: { message: 'No se pudo generar URL' } };
    },

    /**
     * Elimina un archivo del Storage.
     * @param {string} path - Ruta del archivo en el bucket
     * @returns {Promise<{success: boolean, error: object|null}>}
     */
    deleteFile: async function (path) {
        if (!path) return { success: false, error: { message: 'Ruta no proporcionada' } };

        const { error } = await App.supabase.storage
            .from(this.BUCKET)
            .remove([path]);

        if (error) {
            console.error('Storage delete error:', error);
            return { success: false, error };
        }

        return { success: true, error: null };
    },

    /**
     * Elimina TODOS los archivos de un usuario del Storage.
     * Se usa para el borrado completo de cuenta.
     * @param {string} userId - ID del usuario
     * @returns {Promise<{success: boolean, error: object|null}>}
     */
    deleteAllUserFiles: async function (userId) {
        if (!userId) return { success: false, error: { message: 'No userId' } };

        try {
            // Listar todos los archivos del usuario
            const { data: files, error: listError } = await App.supabase.storage
                .from(this.BUCKET)
                .list(userId);

            if (listError) {
                console.error('Error listing user files:', listError);
                return { success: false, error: listError };
            }

            if (!files || files.length === 0) {
                return { success: true, error: null }; // No hay archivos
            }

            // Construir rutas completas
            const paths = files.map(f => `${userId}/${f.name}`);

            // Eliminar en lote
            const { error: removeError } = await App.supabase.storage
                .from(this.BUCKET)
                .remove(paths);

            if (removeError) {
                console.error('Error removing user files:', removeError);
                return { success: false, error: removeError };
            }

            return { success: true, error: null };
        } catch (err) {
            console.error('deleteAllUserFiles error:', err);
            return { success: false, error: err };
        }
    }
};

document.addEventListener( 'DOMContentLoaded', function () {
    // Add initial converter section
    addConverterSection();

    // Add section button event
    document.getElementById( 'add-section-btn' ).addEventListener( 'click', addConverterSection );

    // Function to create toast notifications
    function showToast( message, isError = false ) {
        const toast = document.createElement( 'div' );
        toast.className = 'toast';
        if ( isError ) toast.classList.add( 'error' );
        toast.textContent = message;

        document.getElementById( 'toast-container' ).appendChild( toast );

        setTimeout( () => {
            toast.remove();
        }, 3000 );
    }

    // Function to add a new converter section
    function addConverterSection() {
        const container = document.getElementById( 'converter-container' );
        const sectionId = 'section-' + Date.now();

        const section = document.createElement( 'div' );
        section.className = 'converter-section';
        section.id = sectionId;

        section.innerHTML = `
          <div class="section-header">
            <h2>Grupo de Conversión</h2>
            <button class="delete-section">Eliminar</button>
          </div>
          
          <div class="upload-area" id="upload-area-${sectionId}">
            <div class="upload-icon">📁</div>
            <p class="upload-text">Arrastra y suelta imágenes aquí o haz clic para seleccionar</p>
            <input type="file" class="upload-input" id="upload-input-${sectionId}" accept="image/*" multiple>
          </div>
          
          <div class="converter-options">
            <label for="format-select-${sectionId}">Formato de salida:</label>
            <select id="format-select-${sectionId}">
              <option value="webp">WebP (Recomendado para web)</option>
              <option value="jpeg">JPEG (Fotografías)</option>
              <option value="png">PNG (Imágenes con transparencia)</option>
              <option value="gif">GIF (Animaciones)</option>
            </select>
            
            <div class="quality-control">
              <label for="quality-slider-${sectionId}">Calidad de la imagen: <span id="quality-value-${sectionId}">90%</span></label>
              <div class="slider-container">
                <input type="range" min="1" max="100" value="90" class="quality-slider" id="quality-slider-${sectionId}">
                <div class="quality-markers">
                  <span>Baja</span>
                  <span>Media</span>
                  <span>Alta</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="preview-container" id="preview-container-${sectionId}"></div>
          
          <button class="convert-all-btn" id="convert-btn-${sectionId}">
            <span class="spinner"></span>
            <span class="convert-text">Convertir Todas</span>
          </button>
          
          <!-- Nueva sección para imágenes convertidas -->
          <div class="converted-images-section" id="converted-section-${sectionId}" style="display: none;">
            <h3>Imágenes Convertidas</h3>
            <div class="preview-container" id="converted-container-${sectionId}"></div>
            <button class="download-all-btn" id="download-all-btn-${sectionId}">Descargar Todas</button>
          </div>
        `;

        container.appendChild( section );

        // Set up event listeners for the new section
        setupSectionEvents( sectionId );

        // Set up quality slider event
        const qualitySlider = document.getElementById( `quality-slider-${sectionId}` );
        const qualityValue = document.getElementById( `quality-value-${sectionId}` );

        qualitySlider.addEventListener( 'input', function () {
            qualityValue.textContent = this.value + '%';
        } );
    }

    // Function to set up events for a converter section
    function setupSectionEvents( sectionId ) {
        const section = document.getElementById( sectionId );
        const uploadArea = document.getElementById( `upload-area-${sectionId}` );
        const uploadInput = document.getElementById( `upload-input-${sectionId}` );
        const previewContainer = document.getElementById( `preview-container-${sectionId}` );
        const convertBtn = document.getElementById( `convert-btn-${sectionId}` );
        const downloadAllBtn = document.getElementById( `download-all-btn-${sectionId}` );

        // Delete section event
        section.querySelector( '.delete-section' ).addEventListener( 'click', function () {
            section.remove();
        } );

        // Upload area click event
        uploadArea.addEventListener( 'click', function () {
            uploadInput.click();
        } );

        // File drop events
        uploadArea.addEventListener( 'dragover', function ( e ) {
            e.preventDefault();
            uploadArea.classList.add( 'active' );
        } );

        uploadArea.addEventListener( 'dragleave', function () {
            uploadArea.classList.remove( 'active' );
        } );

        uploadArea.addEventListener( 'drop', function ( e ) {
            e.preventDefault();
            uploadArea.classList.remove( 'active' );

            if ( e.dataTransfer.files.length > 0 ) {
                handleFiles( e.dataTransfer.files, sectionId );
            }
        } );

        // File input change event
        uploadInput.addEventListener( 'change', function () {
            if ( this.files.length > 0 ) {
                handleFiles( this.files, sectionId );
            }
        } );

        // Convert button event
        convertBtn.addEventListener( 'click', function () {
            convertAllImages( sectionId );
        } );

        // Download all button event
        downloadAllBtn.addEventListener( 'click', function () {
            downloadAllConvertedImages( sectionId );
        } );
    }

    // Function to handle uploaded files
    function handleFiles( files, sectionId ) {
        const previewContainer = document.getElementById( `preview-container-${sectionId}` );

        for ( let i = 0; i < files.length; i++ ) {
            const file = files[ i ];

            // Check if file is an image
            if ( !file.type.match( 'image.*' ) ) {
                showToast( `El archivo "${file.name}" no es una imagen válida.`, true );
                continue;
            }

            const reader = new FileReader();

            reader.onload = function ( e ) {
                const previewItem = document.createElement( 'div' );
                previewItem.className = 'preview-item';
                previewItem.dataset.filename = file.name;
                previewItem.dataset.originalFormat = file.type.split( '/' )[ 1 ];
                previewItem.dataset.originalSize = file.size; // Guardar tamaño original

                const previewImage = document.createElement( 'img' );
                previewImage.className = 'preview-image';
                previewImage.src = e.target.result;
                previewItem.dataset.originalSrc = e.target.result;

                const previewInfo = document.createElement( 'div' );
                previewInfo.className = 'preview-info';
                previewInfo.textContent = `${file.name.length > 15 ? file.name.substring( 0, 15 ) + '...' : file.name} (${formatFileSize( file.size )})`;

                const previewActions = document.createElement( 'div' );
                previewActions.className = 'preview-actions';

                const deleteBtn = document.createElement( 'button' );
                deleteBtn.className = 'preview-btn delete';
                deleteBtn.textContent = 'Eliminar';
                deleteBtn.addEventListener( 'click', function () {
                    previewItem.remove();
                } );

                const convertBtn = document.createElement( 'button' );
                convertBtn.className = 'preview-btn';
                convertBtn.textContent = 'Convertir';
                convertBtn.addEventListener( 'click', function () {
                    convertImage( previewItem, sectionId, true );
                } );

                previewActions.appendChild( deleteBtn );
                previewActions.appendChild( convertBtn );

                previewItem.appendChild( previewImage );
                previewItem.appendChild( previewInfo );
                previewItem.appendChild( previewActions );

                previewContainer.appendChild( previewItem );
            };

            reader.readAsDataURL( file );
        }
    }

    // Función para obtener el tamaño en bytes de una imagen en Data URL
    function getDataUrlSize( dataUrl ) {
        // Calcula el tamaño aproximado de un Data URL eliminando el encabezado
        const base64 = dataUrl.split( ',' )[ 1 ];
        const binarySize = Math.ceil( base64.length * 3 / 4 );
        return binarySize;
    }

    // Function to convert a single image
    function convertImage( previewItem, sectionId, downloadImmediately = false ) {
        const formatSelect = document.getElementById( `format-select-${sectionId}` );
        const qualitySlider = document.getElementById( `quality-slider-${sectionId}` );
        const targetFormat = formatSelect.value;
        const quality = qualitySlider.value / 100; // Convertir de 0-100 a 0-1 para canvas
        const img = previewItem.querySelector( '.preview-image' );
        const originalFormat = previewItem.dataset.originalFormat;
        const filename = previewItem.dataset.filename;
        const originalSize = parseInt( previewItem.dataset.originalSize, 10 );

        // Check if image is already in target format
        if ( originalFormat.toLowerCase() === targetFormat ) {
            showToast( `La imagen ya está en formato ${targetFormat.toUpperCase()}.` );
            return null;
        }

        // Create canvas for conversion
        const canvas = document.createElement( 'canvas' );
        const ctx = canvas.getContext( '2d' );

        // Set canvas dimensions to match image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw image on canvas
        ctx.drawImage( img, 0, 0 );

        // Convert to target format
        let convertedImage;
        let mimeType;

        switch ( targetFormat ) {
            case 'webp':
                mimeType = 'image/webp';
                convertedImage = canvas.toDataURL( mimeType, quality );
                break;
            case 'jpeg':
                mimeType = 'image/jpeg';
                // Fill with white background (for transparent images)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect( 0, 0, canvas.width, canvas.height );
                ctx.drawImage( img, 0, 0 );
                convertedImage = canvas.toDataURL( mimeType, quality );
                break;
            case 'png':
                mimeType = 'image/png';
                convertedImage = canvas.toDataURL( mimeType );
                break;
            case 'gif':
                mimeType = 'image/gif';
                convertedImage = canvas.toDataURL( mimeType );
                break;
            default:
                mimeType = 'image/webp';
                convertedImage = canvas.toDataURL( mimeType, quality );
        }

        // Calcula el nuevo tamaño y la reducción
        const newSize = getDataUrlSize( convertedImage );
        const sizeDifference = originalSize - newSize;
        const percentReduction = ( sizeDifference / originalSize * 100 ).toFixed( 2 );

        // Extract file name without extension
        const fileBaseName = filename.replace( /\.[^/.]+$/, "" );
        const newFilename = `${fileBaseName}.${targetFormat}`;

        if ( downloadImmediately ) {
            // Create download link
            const downloadLink = document.createElement( 'a' );
            downloadLink.href = convertedImage;
            downloadLink.download = newFilename;

            // Trigger download
            document.body.appendChild( downloadLink );
            downloadLink.click();
            document.body.removeChild( downloadLink );

            showToast( `Imagen convertida a ${targetFormat.toUpperCase()} exitosamente. Reducción: ${percentReduction}%` );
        }

        return {
            src: convertedImage,
            filename: newFilename,
            format: targetFormat,
            originalFilename: filename,
            originalSize: originalSize,
            newSize: newSize,
            sizeDifference: sizeDifference,
            percentReduction: percentReduction
        };
    }

    // Function to convert all images in a section
    function convertAllImages( sectionId ) {
        const previewContainer = document.getElementById( `preview-container-${sectionId}` );
        const previewItems = previewContainer.querySelectorAll( '.preview-item' );
        const convertBtn = document.getElementById( `convert-btn-${sectionId}` );
        const convertedSection = document.getElementById( `converted-section-${sectionId}` );
        const convertedContainer = document.getElementById( `converted-container-${sectionId}` );

        if ( previewItems.length === 0 ) {
            showToast( 'No hay imágenes para convertir.', true );
            return;
        }

        // Clear previous converted images
        convertedContainer.innerHTML = '';

        // Eliminar resumen de ahorro anterior si existe
        const existingSummary = convertedSection.querySelector( '.savings-summary' );
        if ( existingSummary ) {
            existingSummary.remove();
        }

        // Set button to loading state
        convertBtn.classList.add( 'processing' );

        // Use setTimeout to prevent UI freeze
        setTimeout( () => {
            const convertedImages = [];

            // Convert each image and collect results
            previewItems.forEach( ( item ) => {
                const result = convertImage( item, sectionId, false );
                if ( result ) {
                    convertedImages.push( result );
                }
            } );

            // If we have converted images, show them in the converted section
            if ( convertedImages.length > 0 ) {
                // Show the converted section
                convertedSection.style.display = 'block';

                // Add each converted image to the converted container
                convertedImages.forEach( img => {
                    const convertedItem = document.createElement( 'div' );
                    convertedItem.className = 'preview-item converted-item';
                    convertedItem.dataset.convertedSrc = img.src;
                    convertedItem.dataset.filename = img.filename;

                    const convertedImage = document.createElement( 'img' );
                    convertedImage.className = 'preview-image';
                    convertedImage.src = img.src;

                    // Crear el indicador de ahorro con estilo atractivo
                    const savingsBadge = document.createElement( 'div' );
                    savingsBadge.className = 'savings-badge';

                    // Determinar clase para el color basado en el porcentaje de reducción
                    let savingsClass = 'savings-low';
                    if ( img.percentReduction > 30 ) {
                        savingsClass = 'savings-high';
                    } else if ( img.percentReduction > 10 ) {
                        savingsClass = 'savings-medium';
                    }

                    savingsBadge.classList.add( savingsClass );
                    savingsBadge.innerHTML = `<span>-${img.percentReduction}%</span>`;

                    // Información detallada
                    const convertedInfo = document.createElement( 'div' );
                    convertedInfo.className = 'preview-info';

                    // Información básica
                    const infoBasic = document.createElement( 'div' );
                    infoBasic.textContent = img.filename.length > 15 ?
                        img.filename.substring( 0, 15 ) + '...' :
                        img.filename;

                    // Información detallada de tamaños
                    const infoDetails = document.createElement( 'div' );
                    infoDetails.className = 'size-details';
                    infoDetails.innerHTML = `
                        <span class="original-size">Original: ${formatFileSize( img.originalSize )}</span>
                        <span class="arrow">→</span>
                        <span class="new-size">Nuevo: ${formatFileSize( img.newSize )}</span>
                    `;

                    convertedInfo.appendChild( infoBasic );
                    convertedInfo.appendChild( infoDetails );

                    const convertedActions = document.createElement( 'div' );
                    convertedActions.className = 'preview-actions';

                    const downloadBtn = document.createElement( 'button' );
                    downloadBtn.className = 'preview-btn';
                    downloadBtn.textContent = 'Descargar';
                    downloadBtn.addEventListener( 'click', function () {
                        downloadSingleImage( img.src, img.filename );
                    } );

                    convertedActions.appendChild( downloadBtn );

                    convertedItem.appendChild( convertedImage );
                    convertedItem.appendChild( savingsBadge );
                    convertedItem.appendChild( convertedInfo );
                    convertedItem.appendChild( convertedActions );

                    convertedContainer.appendChild( convertedItem );
                } );

                // Agregar resumen de ahorro total
                const totalSizeOriginal = convertedImages.reduce( ( total, img ) => total + img.originalSize, 0 );
                const totalSizeNew = convertedImages.reduce( ( total, img ) => total + img.newSize, 0 );
                const totalSavings = totalSizeOriginal - totalSizeNew;
                const totalSavingsPercent = ( totalSavings / totalSizeOriginal * 100 ).toFixed( 2 );

                const savingsSummary = document.createElement( 'div' );
                savingsSummary.className = 'savings-summary';
                savingsSummary.innerHTML = `
                    <div class="savings-title">Resumen de ahorro</div>
                    <div class="savings-stats">
                        <div class="savings-stat">
                            <span class="stat-label">Tamaño original:</span>
                            <span class="stat-value">${formatFileSize( totalSizeOriginal )}</span>
                        </div>
                        <div class="savings-stat">
                            <span class="stat-label">Tamaño nuevo:</span>
                            <span class="stat-value">${formatFileSize( totalSizeNew )}</span>
                        </div>
                        <div class="savings-stat total">
                            <span class="stat-label">Ahorro total:</span>
                            <span class="stat-value">${formatFileSize( totalSavings )} (${totalSavingsPercent}%)</span>
                        </div>
                    </div>
                `;

                convertedSection.insertBefore( savingsSummary, document.getElementById( `download-all-btn-${sectionId}` ) );
            }

            // Reset button state
            convertBtn.classList.remove( 'processing' );

            showToast( `${convertedImages.length} imágenes convertidas exitosamente.` );
        }, 100 );
    }

    // Function to download a single converted image
    function downloadSingleImage( src, filename ) {
        const downloadLink = document.createElement( 'a' );
        downloadLink.href = src;
        downloadLink.download = filename;
        document.body.appendChild( downloadLink );
        downloadLink.click();
        document.body.removeChild( downloadLink );

        showToast( `Descargando ${filename}` );
    }

    // Mejora en el cálculo de reducción de tamaño
    function calcularReduccion( tamañoOriginal, nuevoTamaño ) {
        const reduccion = ( ( tamañoOriginal - nuevoTamaño ) / tamañoOriginal * 100 );
        return Math.max( 0, reduccion.toFixed( 2 ) );
    }

    // Clasificación de ahorro con colores
    function obtenerClaseSahorro( porcentaje ) {
        if ( porcentaje > 50 ) return 'savings-high';
        if ( porcentaje > 20 ) return 'savings-medium';
        return 'savings-low';
    }

    // Mejora visual del indicador de ahorro
    function agregarIndicadorAhorro( elementoPrevia, porcentajeReduccion ) {
        const indicadorAhorro = document.createElement( 'div' );
        indicadorAhorro.className = 'savings-indicator';

        const barraAhorro = document.createElement( 'div' );
        barraAhorro.className = 'savings-bar';

        const rellenoAhorro = document.createElement( 'div' );
        rellenoAhorro.className = 'savings-fill';
        rellenoAhorro.style.width = `${Math.min( 100, porcentajeReduccion )}%`;
        rellenoAhorro.style.backgroundColor = obtenerColorAhorro( porcentajeReduccion );

        const porcentajeAhorro = document.createElement( 'div' );
        porcentajeAhorro.className = 'savings-percent';
        porcentajeAhorro.textContent = `${porcentajeReduccion.toFixed( 1 )}%`;

        barraAhorro.appendChild( rellenoAhorro );
        indicadorAhorro.appendChild( barraAhorro );
        indicadorAhorro.appendChild( porcentajeAhorro );

        elementoPrevia.appendChild( indicadorAhorro );
    }

    // Función para obtener color del ahorro
    function obtenerColorAhorro( porcentaje ) {
        if ( porcentaje > 50 ) return '#4caf50';   // Verde intenso
        if ( porcentaje > 20 ) return '#ffa726';   // Naranja
        return '#78909c';  // Gris
    }

    // Function to download all converted images in a section
    function downloadAllConvertedImages( sectionId ) {
        const convertedContainer = document.getElementById( `converted-container-${sectionId}` );
        const convertedItems = convertedContainer.querySelectorAll( '.converted-item' );

        if ( convertedItems.length === 0 ) {
            showToast( 'No hay imágenes convertidas para descargar.', true );
            return;
        }

        // Create a zip file if multiple images
        if ( convertedItems.length > 1 && typeof JSZip !== 'undefined' ) {
            // Using JSZip if available
            const zip = new JSZip();

            convertedItems.forEach( ( item, index ) => {
                const src = item.dataset.convertedSrc;
                const filename = item.dataset.filename;

                // Strip the data URL prefix
                const base64Data = src.split( ',' )[ 1 ];
                zip.file( filename, base64Data, { base64: true } );
            } );

            zip.generateAsync( { type: 'blob' } ).then( function ( content ) {
                const zipLink = document.createElement( 'a' );
                zipLink.href = URL.createObjectURL( content );
                zipLink.download = 'imagenes_convertidas.zip';
                document.body.appendChild( zipLink );
                zipLink.click();
                document.body.removeChild( zipLink );

                showToast( `Descargando ${convertedItems.length} imágenes como ZIP` );
            } );
        } else {
            // Individual downloads if JSZip is not available
            convertedItems.forEach( ( item, index ) => {
                // Add a small delay between downloads to prevent browser blocking
                setTimeout( () => {
                    const src = item.dataset.convertedSrc;
                    const filename = item.dataset.filename;
                    downloadSingleImage( src, filename );
                }, index * 300 );
            } );

            showToast( `Descargando ${convertedItems.length} imágenes` );
        }
    }

    // Helper function to format file size
    function formatFileSize( bytes ) {
        if ( bytes < 1024 ) {
            return bytes + ' B';
        } else if ( bytes < 1048576 ) {
            return ( bytes / 1024 ).toFixed( 1 ) + ' KB';
        } else {
            return ( bytes / 1048576 ).toFixed( 1 ) + ' MB';
        }
    }
} );

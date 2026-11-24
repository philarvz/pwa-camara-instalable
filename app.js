const visorVideo = document.getElementById('visor-camara')
const visorVacio = document.getElementById('visor-vacio')
const mensajeEstado = document.getElementById('mensaje-estado')

const btnInstalar = document.getElementById('btn-instalar')
const btnPrepararCamara = document.getElementById('btn-preparar-camara')
const btnAlternarCamara = document.getElementById('btn-alternar-camara')
const btnApagarCamara = document.getElementById('btn-apagar-camara')

const avisoPermiso = document.getElementById('aviso-permiso')
const btnConfirmarPermiso = document.getElementById('btn-confirmar-permiso')
const btnCancelarPermiso = document.getElementById('btn-cancelar-permiso')

const instruccionesIos = document.getElementById('instrucciones-ios')
const estadoSw = document.getElementById('estado-sw')

let streamActual = null
let modoCamaraActual = 'environment'
let permisoYaConfirmado = false
let eventoInstalacionDiferido = null

function actualizarMensajeEstado(texto) {
    mensajeEstado.textContent = texto
}

function etiquetaLenteDesdeStream(stream, modoSolicitado) {
    const pista = stream.getVideoTracks()[0]
    if (!pista) return modoSolicitado === 'environment' ? 'Trasera' : 'Frontal'

    const ajustes = typeof pista.getSettings === 'function' ? pista.getSettings() : {}
    if (ajustes.facingMode === 'environment') return 'Trasera'
    if (ajustes.facingMode === 'user') return 'Frontal'

    const etiquetaDispositivo = (pista.label || '').trim()
    if (etiquetaDispositivo) return etiquetaDispositivo
    return 'Cámara disponible'
}

function pintarVisorEncendido(stream, modoSolicitado) {
    visorVacio.hidden = true
    btnPrepararCamara.disabled = true
    btnAlternarCamara.disabled = false
    btnApagarCamara.disabled = false

    const etiqueta = etiquetaLenteDesdeStream(stream, modoSolicitado)
    actualizarMensajeEstado('Cámara activa (' + etiqueta + ').')
}

function pintarVisorApagado() {
    visorVacio.hidden = false
    btnPrepararCamara.disabled = false
    btnAlternarCamara.disabled = true
    btnApagarCamara.disabled = true
}

function detenerCamaraActiva() {
    if (streamActual) {
        streamActual.getTracks().forEach((track) => {
            console.log('[Camara] Liberando track:', track.label || track.kind)
            track.stop()
        })
        streamActual = null
    }
}

function iniciarCamara(modo) {
    detenerCamaraActiva()

    const restricciones = {
        video: { facingMode: modo },
        audio: false
    }

    return navigator.mediaDevices.getUserMedia(restricciones)
        .then((stream) => {
            streamActual = stream
            modoCamaraActual = modo
            visorVideo.srcObject = stream
            pintarVisorEncendido(stream, modo)
        })
        .catch((error) => {
            pintarVisorApagado()

            if (error.name === 'NotAllowedError') {
                actualizarMensajeEstado('Permiso denegado. Habilita el acceso a la cámara en los ajustes de tu navegador.')
            } else if (error.name === 'NotFoundError') {
                actualizarMensajeEstado('No se detectó el sensor de cámara solicitado en este dispositivo.')
            } else if (error.name === 'NotReadableError') {
                actualizarMensajeEstado('El sensor está ocupado por otra aplicación. Ciérrala e inténtalo de nuevo.')
            } else {
                actualizarMensajeEstado('Error al acceder al hardware: ' + error.message)
            }
        })
}

btnPrepararCamara.addEventListener('click', () => {
    if (permisoYaConfirmado) {
        iniciarCamara(modoCamaraActual)
        return
    }

    avisoPermiso.hidden = false
    actualizarMensajeEstado('Revisa el aviso de uso antes de continuar.')
    avisoPermiso.scrollIntoView({ behavior: 'smooth', block: 'center' })
})

btnConfirmarPermiso.addEventListener('click', () => {
    avisoPermiso.hidden = true
    permisoYaConfirmado = true
    iniciarCamara(modoCamaraActual)
})

btnCancelarPermiso.addEventListener('click', () => {
    avisoPermiso.hidden = true
    actualizarMensajeEstado('Cámara no activada. Puedes solicitar el acceso cuando lo decidas.')
})

btnAlternarCamara.addEventListener('click', () => {
    const siguienteModo = modoCamaraActual === 'environment' ? 'user' : 'environment'
    iniciarCamara(siguienteModo)
})

btnApagarCamara.addEventListener('click', () => {
    detenerCamaraActiva()
    visorVideo.srcObject = null
    pintarVisorApagado()
    actualizarMensajeEstado('Cámara apagada. Sensor liberado.')
})

function verificarEntornoIOS() {
    const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const estaInstalada = window.navigator.standalone === true ||
                          window.matchMedia('(display-mode: standalone)').matches

    if (esIOS && !estaInstalada) {
        if (instruccionesIos) instruccionesIos.hidden = false
    }
}

function configurarInstalacionAndroid() {
    window.addEventListener('beforeinstallprompt', (evento) => {
        evento.preventDefault()
        eventoInstalacionDiferido = evento
        btnInstalar.hidden = false
        console.log('[Instalacion] beforeinstallprompt capturado.')
    })

    btnInstalar.addEventListener('click', () => {
        if (!eventoInstalacionDiferido) return

        eventoInstalacionDiferido.prompt()
        eventoInstalacionDiferido.userChoice.then((resultado) => {
            console.log('[Instalacion] Resultado:', resultado.outcome)
            eventoInstalacionDiferido = null
            btnInstalar.hidden = true
        })
    })

    window.addEventListener('appinstalled', () => {
        console.log('[Instalacion] PWA instalada en el dispositivo.')
        btnInstalar.hidden = true
    })
}

function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        estadoSw.textContent = 'Service Worker no soportado en este navegador.'
        return
    }

    navigator.serviceWorker.register('./sw.js')
        .then(() => {
            estadoSw.textContent = 'Service Worker registrado correctamente.'
            console.log('[SW] Registrado')
        })
        .catch((error) => {
            estadoSw.textContent = 'Error al registrar el Service Worker.'
            console.error('[SW] Error:', error)
        })
}

configurarInstalacionAndroid()
verificarEntornoIOS()
registrarServiceWorker()
pintarVisorApagado()

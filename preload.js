const { ipcRenderer } = require('electron')

window.addEventListener('load', () => {
    ipcRenderer.once('steamworks-port', async (event) => {
        window.postMessage('steamworks-port', '*', event.ports)
    })

    ipcRenderer.send('steamworks-port')
})
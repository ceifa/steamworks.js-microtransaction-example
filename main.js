const { app, BrowserWindow, MessageChannelMain, ipcMain } = require('electron')
const steamworks = require('steamworks.js')
const steamworksApi = require('./steamworks-api')

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: __dirname + '/preload.js',
        }
    })

    // will be true when opened from steam big picture
    if (process.env.SteamTenfoot) {
        mainWindow.setFullScreen(true)
    } else {
        mainWindow.maximize()
    }

    ipcMain.on('steamworks-port', (event) => {
        const { port1: steamworksPort, port2: remoteSteamworksPort } = new MessageChannelMain();

        steamworksPort.addListener('message', async ({ data }) => {
            const { id, type, ...payload } = data
            const result = await steamworksApi[type](payload)
            steamworksPort.postMessage({
                id,
                response: result
            })
        })

        event.sender.postMessage('steamworks-port', null, [remoteSteamworksPort]);
        steamworksPort.start()
    });

    mainWindow.loadURL('http://localhost:3000')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

steamworks.electronEnableSteamOverlay()

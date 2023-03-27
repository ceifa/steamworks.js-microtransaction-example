const steamworks = require('steamworks.js')
const fetch = require('node-fetch')

// Change this to your app id
const APP_ID = 480
const client = steamworks.init(APP_ID)
const steamId64 = client.localplayer.getSteamId().steamId64.toString()

module.exports = {
    user: () => {
        return {
            steamId: steamId64,
            name: client.localplayer.getName(),
        }
    },
    purchase: ({ item, quantity }) => new Promise(async (resolve) => {
        const orderId = Math.floor(Math.random() * 1000000)

        let handle
        handle = client.callback.register(steamworks.SteamCallback.MicroTxnAuthorizationResponse, async ({
            order_id,
            authorized
        }) => {
            if (orderId === order_id) {
                if (authorized) {
                    const response = await fetch('http://localhost:3001/confirm-purchase', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            orderId,
                            steamId: steamId64,
                        })
                    })

                    if (!response.ok) {
                        handle.disconnect()
                        return resolve({ error: 'Purchase failed' })
                    }
                }

                handle.disconnect()
                resolve({
                    orderId: order_id,
                    authorized,
                })
            }
        })

        const response = await fetch('http://localhost:3001/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId,
                steamId: steamId64,
                gameLanguage: 'en',
                item,
                quantity,
            })
        })

        if (!response.ok) {
            resolve({ error: 'Purchase failed' })
        }
    }),
    purchases: async () => {
        const response = await fetch('http://localhost:3001/purchases?steamId=' + steamId64, {
            method: 'GET',
        })

        if (!response.ok) {
            return {
                error: 'Get purchases failed'
            }
        }

        return response.json()
    }
}
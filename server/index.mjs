import express from 'express'

// Change this to your publisher api key
const PUBLISHER_API_KEY = ''
// Change this to your app id
const APP_ID = 480
// Append "Sandbox" to the base url to use the sandbox
const STEAM_MICROTXN_BASEURL = 'https://partner.steam-api.com/ISteamMicroTxnSandbox'

const purchases = {}

express()
    .use(express.json())
    .post('/purchase', async (req, res) => {
        try {
            const { steamId, gameLanguage, item, quantity, orderId } = req.body

            const response = await fetch(`${STEAM_MICROTXN_BASEURL}/GetUserInfo/v2?key=${PUBLISHER_API_KEY}&appid=${APP_ID}&steamid=${steamId}`)
            const data = await response.json()

            if (data?.response?.result === 'OK') {
                const { currency } = data.response.params

                const formData = new FormData()
                formData.append('key', PUBLISHER_API_KEY)
                formData.append('appid', APP_ID)
                formData.append('steamid', steamId)
                formData.append('currency', currency)
                formData.append('language', gameLanguage)
                formData.append('orderid', orderId)
                formData.append('itemcount', 1)
                formData.append('itemid[0]', item)
                formData.append('qty[0]', quantity)
                formData.append('amount[0]', 100)
                formData.append('description[0]', 'Test')

                const txnResponse = await fetch(`${STEAM_MICROTXN_BASEURL}/InitTxn/v3/`,
                    {
                        method: 'POST',
                        body: formData
                    })

                const txnData = await txnResponse.json()
                if (txnData?.response?.result === 'OK') {
                    // Store on database
                    purchases[steamId] = [...purchases[steamId] || [], { orderId, item, quantity, confirmed: false }]

                    res.send('OK')
                } else {
                    console.log(txnData)
                    res.status(500).send()
                }
            } else {
                res.status(403).send()
            }

        } catch (e) {
            console.log(e)
            res.status(500).send()
        }
    })
    .post('/confirm-purchase', async (req, res) => {
        try {
            const { orderId, steamId } = req.body

            const formData = new FormData()
            formData.append('key', PUBLISHER_API_KEY)
            formData.append('appid', APP_ID)
            formData.append('orderid', orderId)

            const txnResponse = await fetch(`${STEAM_MICROTXN_BASEURL}/FinalizeTxn/v2/`,
                {
                    method: 'POST',
                    body: formData
                })

            const txnData = await txnResponse.json()
            if (txnData?.response?.result === 'OK') {
                // Store on database
                const purchase = purchases[steamId].find(p => p.orderId === orderId)
                purchase.confirmed = true

                res.send('OK')
            } else {
                res.status(500).send()
            }

        } catch (e) {
            console.log(e)
            res.status(500).send()
        }
    })
    .get('/purchases', (req, res) => {
        try {
            const { steamId } = req.query
            const userPurchases = purchases[steamId] || []
            const confirmed = userPurchases.filter(p => p.confirmed)
            res.send(confirmed)
        } catch (e) {
            console.log(e)
            res.status(500).send()
        }
    })
    .listen(3001)
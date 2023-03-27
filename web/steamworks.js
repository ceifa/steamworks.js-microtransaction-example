export class Steamworks {
    /** @type {MessagePort} */
    #port;
    #waitings = [];

    async init() {
        return new Promise(resolve => {
            window.addEventListener("message", ev => {
                if (ev.data === 'steamworks-port') {
                    this.#port = ev.ports[0];
                    this.#port.onmessage = ({ data }) => {
                        const waiting = this.#waitings.find(w => w.id === data.id);
                        if (waiting) {
                            waiting.resolve(data.response);
                        }
                    };
                    resolve();
                    this.#port.start()
                }
            });
        });
    }

    async getUser() {
        return this.#queueRequest({ type: 'user' });
    }

    async purchase(item, quantity) {
        return this.#queueRequest({ type: 'purchase', item, quantity })
    }

    async getPurchases() {
        return this.#queueRequest({ type: 'purchases' })
    }

    async #queueRequest(request) {
        return new Promise(resolve => {
            const id = Math.floor(Math.random() * 1000000)
            this.#waitings.push({ resolve, id });
            this.#port.postMessage({ ...request, id });
        });
    }
}
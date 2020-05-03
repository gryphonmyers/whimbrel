import { Router } from "./router.js";

const IS_ROUTING = Symbol();
const QUEUE = Symbol();
const PROCESS_QUEUE = Symbol();

export default ({window}) => {
    const { document: {documentElement}, location, URL, history } = window;

    return class HistoryRouter extends Router {
        constructor() {
            super(...arguments);
            
            let isRouting = false;
            let routingPromise = Promise.resolve();

            Object.defineProperties(this, {
                [QUEUE]: { value: []},
                [IS_ROUTING]: {
                    get: () => isRouting,
                    set: async (val) => {
                        if (val !== isRouting && val) {
                            await (routingPromise = routingPromise.then(() => this[PROCESS_QUEUE]()));
                            this[IS_ROUTING] = false;
                        }
                    }
                },
                routingPromise: {
                    get: () => routingPromise
                }
            })
            
            window.addEventListener('popstate', (evt) => {
                console.log(evt);
            });

            documentElement.addEventListener('click', (evt) => {
                evt.stopPropagation();
                
                let isA = false;
                let el = evt.target;

                while (el && !(isA = el.tagName === 'A')) {
                    el = el.parentElement;
                }

                if (el && el.href) {
                    const url = new URL(el.href, location.origin);

                    if (url.origin === location.origin) {
                        const match = this.match(url.pathname);

                        if (match) {
                            evt.preventDefault();
                            
                            this.push(url, {match});
                        }
                    }
                }
            }, true);
        }

        async [PROCESS_QUEUE]() {
            let item;

            while (item = this[QUEUE].shift()) {
                const { url, resolve, reject, title } = item;
                
                try {
                    const payload = await this.resolve(url.pathname);

                    history.pushState({url, isWhimbrelState: true}, title, url);
                    
                    resolve(payload);
                } catch(err) {
                    reject(err);
                }                
            }
        }

        async push(url, {match, title=''}={}) {
            url = new URL(url, location.origin);
            
            if (match == null && (match = this.match(url.pathname)) == null) {            
                return null;
            }
            
            return new Promise((resolve, reject) => {
                this[QUEUE].push({ url, resolve, reject, title });

                this[IS_ROUTING] = true;
            })
        }
    }
}
import { Router } from "./router.js";

const IS_ROUTING = Symbol();
const QUEUE = Symbol();
const PROCESS_QUEUE = Symbol();
const HASH = Symbol();

export default ({window}) => {
    const { document: {documentElement}, location, URL, history } = window;

    return class HistoryRouter extends Router {
        constructor({onHashChange}={}) {
            super(...arguments);
            
            let isRouting = false;
            let routingPromise = Promise.resolve();
            let hash = '';
            history.scrollRestoration = 'manual';

            Object.defineProperties(this, {
                [QUEUE]: { value: [] },
                [HASH]: {
                    get: () => hash,
                    set: (newHash) => {
                        if (newHash != hash && onHashChange) {
                            if (newHash) {
                                let el = documentElement.querySelector(newHash);
                                if (el) {
                                    el.scrollIntoView();
                                }
                            }
                            
                            onHashChange(newHash, hash);
                        }
                        hash = newHash;
                    }
                },
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
                },
                hash: { get: () => hash }
            });
            
            window.addEventListener('popstate', async (evt) => {
                if (evt.state && evt.state.isWhimbrelState) {
                    const url = new URL(evt.state.url, location.origin);
                    //@TODO need to handle successive events properly - abort / queue
                    await this.resolve(url.pathname);
                    
                    this[HASH] = url.hash;
                    
                    window.scrollTo(evt.state.pageXOffset, evt.state.pageYOffset);
                }
            });

            window.addEventListener('hashchange', () => {
                this[HASH] = location.hash;
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
                const { url, resolve, reject, title, pageXOffset, pageYOffset } = item;
                
                try {
                    const payload = await this.resolve(url.pathname);

                    history.pushState({url, pageXOffset, pageYOffset, isWhimbrelState: true}, title, url);

                    this[HASH] = url.hash;
                    
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
            //@TODO the queue is not right. we need to only push into the history stack when routing completes, and abort pending routing events when new ones come in. this will more closely mimic browser behavior.
            return new Promise((resolve, reject) => {
                const {pageXOffset, pageYOffset} = window;

                this[QUEUE].push({ url, pageXOffset, pageYOffset, resolve, reject, title });

                this[IS_ROUTING] = true;
            })
        }
    }
}
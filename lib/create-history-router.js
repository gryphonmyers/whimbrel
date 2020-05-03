import { Router } from "./router.js";

const HASH = Symbol();
const ROUTING_TO = Symbol();

export default ({window}) => {
    const { document: {documentElement}, location, URL, history } = window;

    return class HistoryRouter extends Router {
        constructor({onHashChange}={}) {
            super(...arguments);
            
            let routingPromise = Promise.resolve();
            let hash = '';
            let routingTo = null;

            history.scrollRestoration = 'manual';

            Object.defineProperties(this, {
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
                [ROUTING_TO]: {
                    get: () => routingTo,
                    set: async (val) => {
                        if (routingTo) {
                            routingTo.abort();
                        }
                        let abort;

                        const abortPromise = new Promise((reject) => abort = () => reject(new Error('Aborted')));

                        routingTo = { ...val, abort };

                        const { url, resolve, reject, title, pageXOffset, pageYOffset } = routingTo;
                
                        try {
                            const payload = await (routingPromise = this.resolve(url.pathname, abortPromise));

                            history.pushState({url, pageXOffset, pageYOffset, isWhimbrelState: true}, title, url);

                            this[HASH] = url.hash;

                            routingTo = null;

                            resolve(payload);

                        } catch(err) {
                            reject(err);
                        }
                    }
                },
                routingPromise: {
                    get: () => routingPromise
                },
                hash: { get: () => hash }
            });
            
            window.addEventListener('popstate', async (evt) => {
                console.log('EVETN', evt)
                if (evt.state && evt.state.isWhimbrelState) {
                    const url = new URL(evt.state.url, location.origin);

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

        async push(url, {match, title=''}={}) {
            url = new URL(url, location.origin);
            
            if (match == null && (match = this.match(url.pathname)) == null) {            
                return null;
            }
            
            return new Promise((resolve, reject) => {
                const { pageXOffset, pageYOffset } = window;

                this[ROUTING_TO] = { url, pageXOffset, pageYOffset, resolve, reject, title };
            })
        }
    }
}
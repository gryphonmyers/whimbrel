import { Router } from "./router.js";

const ROUTING_TO = Symbol();

export default ({window}) => {
    const { document: {documentElement}, location, URL, history } = window;

    return class HistoryRouter extends Router {
        constructor({}={}) {
            super(...arguments);
            
            let routingPromise = null;
            let routingTo = null;

            const routeTo = async (val, cb) => {
                if (routingTo) {
                    routingTo.abort();
                }

                let abort;

                const abortPromise = new Promise((reject) => abort = () => reject(new Error('Aborted')));

                routingTo = { ...val, abort };

                let { url, resolve, reject } = routingTo;
        
                try {
                    resolve(await (routingPromise = this.resolve(url.pathname, abortPromise)).then(cb));
                } catch(err) {
                    reject(err);
                } finally {
                    routingTo = routingPromise = null;
                }
            }

            history.scrollRestoration = 'manual';

            Object.defineProperties(this, {
                [ROUTING_TO]: {
                    get: () => routingTo,
                    set: val =>
                        routeTo(val, () => {
                            const { pageXOffset, pageYOffset } = window;
                            const { url, title } = val;
                            
                            if (url.hash) {
                                location.hash = url.hash;
                            }

                            history.pushState({ url, pageXOffset, pageYOffset, isWhimbrelState: true }, title, url);
                        })
                },
                routingPromise: {
                    get: () => routingPromise
                }
            });
            
            window.addEventListener('popstate', async (evt) => {
                if (evt.state && evt.state.isWhimbrelState) {
                    let { url, pageXOffset, pageYOffset } = evt.state;
                    url = new URL(url, location.origin);

                    routeTo({ url, resolve: ()=>{}, reject: ()=>{} }, () => {
                        window.scrollTo(pageXOffset, pageYOffset);
                    });
                }
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
                            
                            this.push(url, { match });
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
                this[ROUTING_TO] = { url, resolve, reject, title };
            })
        }
    }
}
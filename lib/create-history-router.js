import { Router } from "./router.js";

const IS_ROUTING = Symbol();
const STACK = Symbol();
const PROCESS_STACK = Symbol();

export default ({window}) => {
    const { document: {documentElement}, location, URL } = window;

    return class HistoryRouter extends Router {
        constructor() {
            super(...arguments);
            this[STACK] = [];
            this[IS_ROUTING] = false;
            window.addEventListener('popstate', (evt) => {
                console.log(evt);
            });
            documentElement.addEventListener('click', (evt) => {
                const {target} = evt;
                evt.stopPropagation();
                let isA = false;
                let el = target;

                while (el && !(isA = el.tagName === 'A')) {
                    el = el.parentElement;
                }

                if (el && el.href) {
                    const url = new URL(el.href, location.origin);
                    if (url.origin === location.origin) {
                        const match = this.match(url.pathname);
                        if (match) {
                            evt.preventDefault();
                            this.push(match);
                        }
                    }
                }
            }, true);
        }

        async [PROCESS_STACK]() {
            let item;
            this[IS_ROUTING] = true;
            while (item = this[STACK].shift()) {
                const { match, resolve, reject } = item;
                try {
                    resolve(await this.handle(match));
                } catch(err) {
                    reject(err);
                }                
            }
            this[IS_ROUTING] = false;
        }

        async push(match) {
            if (typeof match === 'string') match = this.match(match);
            
            return new Promise((resolve, reject) => {
                this[STACK].push({match, resolve, reject});

                if (!this[IS_ROUTING]) this[PROCESS_STACK]();
            })
        }
    }
}
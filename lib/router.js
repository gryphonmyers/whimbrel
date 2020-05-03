import { route } from "./route.js";
import RoutingError from "./routing-error";

const MIDDLEWARES = Symbol('middlewares');

class Router {
    get isWhimbrelRouter() {
        return true; 
    }
    
    constructor({onResolve}={}) {
        Object.defineProperties(this, {
            [MIDDLEWARES]: {value: []},
            onResolve: {value: onResolve}
        });
    }

    match(path) {
        let matchPath = [];
        let ii = 0;
        while (ii < this[MIDDLEWARES].length) {
            let { route, handler, partial } = this[MIDDLEWARES][ii];
            const result = route.match(path, {partial});

            if (result) {
                if (handler.isWhimbrelRouter) {
                    const subMatch = handler.match(result.remainder);
                    if (subMatch) {
                        matchPath.push(Object.assign(subMatch, {handler}));
                    }      
                } else {
                    matchPath.push({...result, path, route, handler});
                }               
            }
            ii++;
        }
        return matchPath.length ? matchPath : null;
    }

    async handle(inputMatchPath, abortPromise=Promise.resolve()) {
        if (!inputMatchPath) return null;
        let context = {};
        let resolved = null;
        let ii = 0;
        let matchPath = [];
        let aborted = false;
        abortPromise.catch((err) => aborted = err);

        const resolve = (val) => {
            resolved = val == null ? context : val;
        }

        const redirect = (path) => {
            resolve(this.resolve(path));
        }

        while (resolved == null && ii < inputMatchPath.length) {
            if (aborted) {
                throw aborted;
            }
            const { handler } = inputMatchPath[ii];
            
            matchPath.push(inputMatchPath[ii]);

            if (Array.isArray(inputMatchPath[ii])) {
                const subResult = await handler.handle(inputMatchPath[ii], abortPromise);
                if (subResult != null) return subResult;
            } else {
                //assuming function
                let result = await handler(context, { ...inputMatchPath[ii], matchPath, redirect, resolve});
                if (result != null) context = result;
            }
            ii++;
        }
        if (aborted) {
            throw aborted;
        }

        if (resolved == null) {
            throw new RoutingError('Not resolved');
        }

        if (resolved != null && this.onResolve) {
            await this.onResolve(resolved);
        }

        return resolved;
    }

    async resolve(path) {
        return this.handle(this.match(path));
    }  

    get(route, handler) {
        if (!route.isWhimbrelRoute) throw new Error(`Invalid route: ${route}`);
        this[MIDDLEWARES].push({ route, handler, partial: false });
        return this;
    }

    use(prefix, handler) {
        if (arguments.length === 1) {
            handler = prefix;
            prefix = route`/`;
        }
        if (!prefix.isWhimbrelRoute) throw new Error(`Invalid route: ${prefix}`);
        this[MIDDLEWARES].push({ route: prefix, handler, partial: true });
        return this;
    }
}

export default Router;
export { Router };
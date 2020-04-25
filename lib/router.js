import { route } from "./route.js";

const MIDDLEWARES = Symbol('middlewares');

class Router {
    get isWhimbrelRouter() {
        return true; 
    }
    
    constructor() {
        Object.defineProperties(this, {
            [MIDDLEWARES]: {value: []}
        })
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

    async handle(inputMatchPath) {
        if (!inputMatchPath) return null;
        let context = {};
        let resolved = null;
        let ii = 0;
        let matchPath = [];

        const resolve = (val) => {
            resolved = val == null ? context : val;
        }

        const redirect = (path) => {
            resolve(this.resolve(path));
        }

        while (resolved == null && ii < inputMatchPath.length) {
            const { handler } = inputMatchPath[ii];
            matchPath.push(inputMatchPath[ii]);
            if (Array.isArray(inputMatchPath[ii])) {
                const subResult = await handler.handle(inputMatchPath[ii]);
                if (subResult != null) return subResult;
            } else {
                //assuming function
                let result = await handler(context, { ...inputMatchPath[ii], matchPath, redirect, resolve});
                if (result != null) context = result;
            }
            ii++;
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
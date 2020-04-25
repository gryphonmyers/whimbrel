import Param from "./param.js";

class Route {
    get isWhimbrelRoute() {
        return true;
    }
    
    constructor(segments, ...params) {
        Object.assign(this, { 
            segments, 
            params: params.map(param => new Param(param))
        });
    }

    get regexp() {
        return new RegExp(`${this}`);
    }

    toRegExp(opts={}) {
        return new RegExp(this.toString(opts));
    }

    toString({partial=false}={}) {
        return `^${
            this.segments.reduce((acc, seg, ii) =>
                `${acc += seg}${(
                    this.params[ii]
                        ? `${!this.params[ii].required && acc.endsWith('/') ? '?' : ''}${this.params[ii]}`
                        : ''           
                )}`
            , '')
        }\/?${partial ? '' : '$'}`;
    }

    match(str, opts) {
        const regex = this.toRegExp(opts);
        const match = regex.exec(str);

        if (!match) return null;

        const params = match.slice(1);

        return {
            match,
            params: Object.assign(params, params.reduce((acc, param, ii) =>
                this.params[ii] && this.params[ii].name 
                    ? Object.assign(acc, { [this.params[ii].name]: param })
                    : acc
            , {})),
            remainder: str.replace(regex, '/')
        };
    }
}

function route() {
    return new Route(...arguments)
}

export default route;
export { route, Route };
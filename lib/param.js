export default class Param {
    constructor({name, required=true, pattern }={}) {
        Object.assign(this, {name, required, pattern});
    }

    toString() {
        return `(${this.pattern || `[^\\/]+?`})${this.required ? '' : '?'}`;
    }
}
import createDomRouterClass from './create-dom-router-class.js';
import { route } from "./route.js";

const Router = createDomRouterClass({window});

export { route, Router };
export default Router;
import test from 'ava';
import createHistoryRouter from "../lib/create-history-router";
import { route } from '../lib';

const { JSDOM } = require("jsdom");

test('basic routing works', async t => {
    const { window } = new JSDOM(`<!DOCTYPE html><p><a href="/wiggle/">Hello world</a></p>`, {url: 'http://foo.bar'});

    const Router = createHistoryRouter(window);
    let resolved;

    await new Promise((resolve) => {
        new Router({onResolve: (result) => {
            resolved = result;
            resolve();
        }})
        .get(route`/wiggle/`, (ctx, {resolve}) => {
            ctx.boo = 'boy';
            resolve();
        });

        window.document.querySelector('a').click();
    });
    
    t.deepEqual(resolved, {boo: 'boy'});
});
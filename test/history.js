import test from 'ava';
import createHistoryRouter from "../lib/create-history-router";
import { route } from '../lib';

const { JSDOM } = require("jsdom");
const sinon = require('sinon');

test('basic routing works', async t => {
    const { window } = new JSDOM(`<!DOCTYPE html><p><a href="/wiggle/">Hello world</a></p>`, {url: 'http://foo.bar'});

    const Router = createHistoryRouter(window);
    let resolved;

    const router = new Router({
        onResolve: (result) => {
            resolved = result;
        }
    })
    .get(route`/wiggle/`, (ctx, {resolve}) => {
        ctx.boo = 'boy';
        resolve();
    });


    window.document.querySelector('a').click();

    await router.routingPromise;    
    t.deepEqual(resolved, {boo: 'boy'});

    t.is(window.location.href, 'http://foo.bar/wiggle/');
});

test('routing abortion works', async t => {
    const { window } = new JSDOM(`<!DOCTYPE html><p><a href="/wiggle/">link</a><p><a href="/wiggler/">link</a></p>`, {url: 'http://foo.bar'});

    const Router = createHistoryRouter(window);
    let resolved;

    const router = new Router({
        onResolve: (result) => {
            resolved = result;
        }
    })
    .get(route`/wiggle/`, (ctx, {resolve}) => {
        ctx.boo = 'boy';
        resolve();
    })
    .get(route`/wiggler/`, (ctx, {resolve}) => {
        ctx.boo = 'bog';
        resolve();
    });

    let aborted = false;
    
    window.document.querySelector('[href="/wiggler/"]').click();
    
    router.routingPromise.then(() => aborted = true);

    window.document.querySelector('[href="/wiggle/"]').click();

    await router.routingPromise;    
    
    t.deepEqual(resolved, {boo: 'boy'});
    t.truthy(aborted);
    t.is(window.location.href, 'http://foo.bar/wiggle/');
});


test.skip('browser navigation works', async t => {
    const { window } = new JSDOM(`<!DOCTYPE html><p><a href="/wiggle/">link</a><p><a href="/wiggler/">link</a></p>`, {url: 'http://foo.bar'});
    const sandbox = sinon.createSandbox();
    sandbox.spy(window.history, 'pushState');
    const Router = createHistoryRouter(window);
    let resolved;

    //@TODO get popstate event firing

    const router = new Router({
        onResolve: (result) => {
            resolved = result;
        }
    })
    .get(route`/wiggle/`, (ctx, {resolve}) => {
        ctx.boo = 'boy';
        resolve();
    })
    .get(route`/wiggler/`, (ctx, {resolve}) => {
        ctx.boo = 'bog';
        resolve();
    });

    let aborted = false;
    
    window.document.querySelector('[href="/wiggler/"]').click();

    await router.routingPromise;

    t.deepEqual(resolved, {boo: 'bog'});
    t.is(window.location.href, 'http://foo.bar/wiggler/');

    window.document.querySelector('[href="/wiggle/"]').click();

    await router.routingPromise;

    t.deepEqual(resolved, {boo: 'boy'});
    t.is(window.location.href, 'http://foo.bar/wiggle/');

    window.history.back();
    
    console.log(window.history)
    // console.log(window.history.pushState.getCall(2).args)
    await router.routingPromise;

    t.deepEqual(resolved, {boo: 'bog'});
    t.is(window.location.href, 'http://foo.bar/wiggler/');
});

test.todo('Test hash update');
test.todo('Test scroll into view');
test.todo('Test scroll restoration');
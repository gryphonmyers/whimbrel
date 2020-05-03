import test from 'ava';
import { Router } from '../lib';
import { route } from "../lib";

test('basic param works', t => {
    t.falsy(route`/hi/there/${{}}/green/man`.regexp.exec('hi'))
    
    t.deepEqual(route`/hi/there/${{}}/green/man`.match('/hi/there/gram/green/man').params, ['gram']);
    t.falsy(route`/hi/there/${{}}/green/man`.match('/hi/there//green/man'));
    t.deepEqual(route`/hi/there/${{required:false}}/green/man`.match('/hi/there/green/man').params, [undefined]);
    t.deepEqual(route`/hi/there/${{required:false}}/green/man`.match('/hi/there/man/green/man').params, ['man']);
    t.deepEqual(route`/hi/there/${{required:false}}green/man`.match('/hi/there/mangreen/man').params, ['man']);
    t.deepEqual(route`/hi/there/${{required:false}}green/man`.match('/hi/there/green/man').params, [undefined]);
    t.deepEqual(route`/hi/there${{required:false}}/green/man`.match('/hi/thereman/green/man/').params, ['man']);
    t.deepEqual(route`/hi/there${{required:false}}/green/man`.match('/hi/there/green/man/').params, [undefined]);
    t.deepEqual(route`/hi/there/${{required:false}}/green/${{}}`.match('/hi/there/man/green/man/').params, ['man', 'man']);
    t.deepEqual(route`/hi/there/${{required:false}}/green/${{required: false}}`.match('/hi/there/man/green/man/').params, ['man', 'man']);
    t.deepEqual(route`/hi/there/${{required:false}}/green/${{required: false}}`.match('/hi/there/man/green/').params, ['man', undefined]);
    t.deepEqual(route`/hi/there/${{required:false}}/green/${{required: false}}`.match('/hi/there/green/').params, [undefined, undefined]);
    t.deepEqual(route`/hi/there/${{required:false, name: 'whip'}}/green/man`
        .match('/hi/there/man/green/man/').params, Object.assign(['man'], {whip: 'man'}));
    t.deepEqual(route`/hi/there/${{required:false, name: 'whip'}}/green/man/${{name: 'wog'}}`
        .match('/hi/there/man/green/man/wimple').params, Object.assign(['man', 'wimple'], {whip: 'man', wog: 'wimple'}));
    t.deepEqual(route`/grab/${{required:false, name: 'locale', pattern: '[a-z]{2}-[A-Z]{2}'}}/hi/there/${{}}`
        .match('/grab/de-DE/hi/there/man/').params, Object.assign(['de-DE','man'], {locale: 'de-DE'}));
    t.deepEqual(route`/grab/${{required:false, name: 'locale', pattern: '[a-z]{2}-[A-Z]{2}'}}/hi/there/${{}}`
        .match('/grab/hi/there/man/').params, Object.assign([undefined,'man'], {locale: undefined}));
    t.deepEqual(route`/${{required:false}}/green/man`.match('/man/green/man').params, ['man']);
    t.deepEqual(route`/${{required:false}}/green/man`.match('/green/man').params, [undefined]);
    t.deepEqual(route`/green/${{required: false}}`.match('/green').params, [undefined]);
    t.deepEqual(route`/green`.match('/green').params, []);

    
    // t.is(route`hi/there/${param({required:false})}/green/man`.regexp.exec('hi/there/man/green/man'), 'asdasd')
    // t.is(route`hi/there/${{}}}/green/man`.regexp.exec('hi/there/green/man'), 'asdasd')
    // t.is(route`hi/there/${param({required:false})}/green/man`.regexp.exec('hi/there/green/man'), 'asdasd')
    // t.is(route`hi/there/${param({required:false})}/green/man`.regexp.exec('hi/there//green/man'), 'asdasd')
});


test('Partial match works', t => {
    const match = route`/hi${{required:false}}/goo/`.match('/hibye/goo/friend', {partial: true});
    // console.log(match)
    t.deepEqual(match.params, ['bye']);
})

test('Express parity', t => {
    t.deepEqual(route`/flights/${{}}-${{}}`.match('/flights/LAX-SFO/').params, ['LAX', 'SFO']);
    t.deepEqual(route`/hi${{required:false}}/goo`.match('/hibye/goo').params, ['bye']);
    t.deepEqual(route`/hi${{required:false}}/goo`.match('/hi/goo').params, [undefined]);
    t.deepEqual(route`/hi/${{required:false}}goo`.match('/hi/byegoo').params, ['bye']);
    t.deepEqual(route`/hi/${{required:false}}goo`.match('/hi/goo').params, [undefined]);
    t.deepEqual(route`/hi/${{required:false}}/goo`.match('/hi/goo').params, [undefined]);
    t.deepEqual(route`/hi/${{required:false}}/goo`.match('/hi/bye/goo').params, ['bye']);
    t.deepEqual(route`/hi${{required:false}}goo`.match('/hibyegoo').params, ['bye']);
    t.deepEqual(route`/hi${{required:false}}goo`.match('/higoo').params, [undefined]);
});


test('Router works', async t => {
    const newsMasterRoute = route`/news`;
    const newsDetailRoute = route`/news/${{}}`;

    const router = new Router()
        .get(newsDetailRoute, (ctx, {resolve, path}) => {
            ctx.path = path;
            resolve(ctx)
        })
        .get(newsMasterRoute, (ctx, {resolve, path}) => {
            ctx.path = path;
            resolve(ctx);
        });
        
    t.deepEqual(await router.resolve('/news'), {path: '/news'});
    t.deepEqual(await router.resolve('/news/wingo'), { path: '/news/wingo' });
    t.deepEqual(await router.resolve('/fire'), null);
});

test('Router context is overridable', async t => {
    const newsMasterRoute = route`/news`;

    const router = new Router()
        .get(newsMasterRoute, (ctx, {resolve, path}) => {
            // ctx.path = path;
            resolve('boobah')
        })
        
    t.deepEqual(await router.resolve('/news'), 'boobah');
    // t.deepEqual(await router.resolve('/news/wingo'), { path: '/news/wingo' });
});


test('Successive matches accumulate context', async t => {
    const newsMasterRoute = route`/news`;

    const router = new Router()
        .get(newsMasterRoute, (ctx, {resolve, path}) => {
            ctx[1] = 'Wig';
        })
        .get(newsMasterRoute, (ctx, {resolve, path}) => {
            ctx[2] = 'Wam';
            resolve()
        });
        
    t.deepEqual(await router.resolve('/news'), {1:'Wig', 2:'Wam'});
});


test('Use syntax works', async t => {
    const newsMasterRoute = route`/news`;

    const router = new Router()
        .use(newsMasterRoute, (ctx, {resolve, path}) => {
            ctx[1] = 'Wig';
        })
        .use(newsMasterRoute, (ctx, {resolve, path}) => {
            ctx[2] = 'Wam';
            resolve()
        });
        
    t.deepEqual(await router.resolve('/news'), {1:'Wig', 2:'Wam'});
    t.deepEqual(await router.resolve('/news/fire'), {1:'Wig', 2:'Wam'});
    
});

test('Redirect works', async t => {
    const newsMasterRoute = route`/news`;

    const router = new Router()
        .get(route`/fire`, (ctx, {resolve}) => {
            ctx.fire = true;
            resolve();
        })
        .use(newsMasterRoute, (ctx) => {
            ctx[1] = 'Wig';
        })
        .use(newsMasterRoute, (ctx, {redirect}) => {
            ctx[2] = 'Wam';
            redirect('/fire');
        });
        
    t.deepEqual(await router.resolve('/news'), { fire: true}); 
});


test('Nested router works', async t => {
    const newsMasterRoute = route`/news`;

    const router = new Router()
        .use(route`/fire`, new Router()
            .use(route`/wiggle`, (ctx, {resolve}) => {
                ctx.food = 'candy';
                resolve();
            })
            .use(route`/win`, (ctx, {resolve}) => {
                ctx.foo = 'bar';
                resolve();
            })
        )
        
    t.deepEqual(await router.resolve('/fire/win'), { foo: 'bar'}); 
});

test('Nested router works without prefix', async t => {
    const router = new Router()
        .use(new Router()
            .use(route`/wiggle`, (ctx, {resolve}) => {
                ctx.food = 'candy';
                resolve();
            })
            .use(route`/win`, (ctx, {resolve}) => {
                ctx.foo = 'bar';
                resolve();
            })
        )
        .get(route`/fire/win`, (ctx, {resolve}) => {
            ctx.boop = 'beep';
            resolve();
        })
        
    t.deepEqual(await router.resolve('/fire/win'), { boop: 'beep'}); 
    t.deepEqual(await router.resolve('/win'), { foo: 'bar'}); 
});


test('Resolution stops handling', async t => {
    const router = new Router()
        .use(route`/fire`, (ctx, {resolve}) => {
            ctx.food = 'candy';
            resolve();
        })
        .use(route`/fire`, (ctx, {resolve}) => {
            ctx.foo = 'bar';
            resolve();
        });
        
    t.deepEqual(await router.resolve('/fire'), { food: 'candy' }); 
});

test('Matching nested router returns nested array', async t => {
    const router = new Router()
        .use(route`/fire`, new Router()
            .use(route`/time`, (ctx, {resolve}) => {
                ctx.food = 'candy';
                resolve();
            })
            .use(route`/wig`, (ctx, {resolve}) => {
                ctx.wig = 'wear';
                resolve();
            })
            .use(route`/time/${{}}/`, (ctx, {resolve}) => {
                ctx.dog = 'boy';
                resolve();
            })
        )
        .use(route`/fire`, (ctx, {resolve}) => {
            ctx.foo = 'bar';
            resolve();
        });
    const result = router.match('/fire/time/what/');

    t.is(result.length, 2);
    t.truthy(Array.isArray(result[0]));
    t.is(result[0].length, 2);
});

test.todo('Test rejection functionality')

test.todo('Test onResolve callback')
const assert = require('assert')
const rematch = require('../')

describe('rematch', () => {

    describe('matches objects', () => {
        const hasX = 'has key x'
        const hasXandHasY = 'has keys x and y'

        it('works with one parameter', () => {
            const fn = rematch({
                '{ x }': () => hasX
            })
            assert.strictEqual(fn({ x: 3 }), hasX)
        })

        it('works with two parameters', () => {
            const fn = rematch({
                '{ x, y }': () => hasXandHasY
            })
            assert.strictEqual(fn({ x: 3, y: 4 }), hasXandHasY)
        })

        it('is independent of key ordering', () => {
            const two = rematch({ '{ y, x }': () => 'two params' })
            assert.strictEqual(two({ x: 3, y: 4 }), 'two params')
            assert.strictEqual(two({ y: 3, x: 4 }), 'two params')

            const three = rematch({ '{ x, y, z }': () => 'three params' })
            assert.strictEqual(three({ x: 3, y: 4, z: 5 }), 'three params')
            assert.strictEqual(three({ x: 3, z: 4, y: 5 }), 'three params')
            assert.strictEqual(three({ y: 3, x: 4, z: 5 }), 'three params')
            assert.strictEqual(three({ y: 3, z: 4, x: 5 }), 'three params')
            assert.strictEqual(three({ z: 3, x: 4, y: 5 }), 'three params')
            assert.strictEqual(three({ z: 3, y: 4, x: 5 }), 'three params')
        })

        it('works with trailing commas', () => {
            const fn = rematch({
                '{ x, }': () => hasX
                , '{ x, y, }': () => hasXandHasY
            })
            assert.strictEqual(fn({ x: 3 }), hasX)
            assert.strictEqual(fn({ x: 3, y: 4 }), hasXandHasY)
        })

        it('works with any key names', () => {
            const fn = rematch({ '{ foo, bar }': () => 'hello' })
            assert.strictEqual(fn({ foo: 3, bar: 4 }), 'hello')

            const fn2 = rematch({ '{ who, cares }': () => 'potato' })
            assert.strictEqual(fn2({ who: 3, cares: 4 }), 'potato')
        })

        it('works with default', () => {
            const fn = rematch({
                '{ foo, bar }': () => 'hello'
                , default: () => 'DEFAULTED'
            })
            assert.strictEqual(fn({}), 'DEFAULTED')
            assert.strictEqual(fn({ foo: 0, bar: 0 }), 'hello')
        })
    })

    // describe('works on arrays', () => {
        // todo
    // })

    describe('matches booleans', () => {
        it('works with one parameter', () => {
            const fn = rematch({ false: () => 'sandwich' })
            assert.strictEqual(fn(false), 'sandwich')

            const fn2 = rematch({ true: () => 'foobar' })
            assert.strictEqual(fn2(true), 'foobar')

            const trailComma = rematch({ 'false,': () => 'sandwich' })
            assert.strictEqual(trailComma(false), 'sandwich')
        })

        it('works with two parameters', () => {
            const ff = rematch({ 'false, false': () => 'double false' })
            assert.strictEqual(ff(false, false), 'double false')

            const tt = rematch({ 'true, true': () => 'double true' })
            assert.strictEqual(tt(true, true), 'double true')

            const tf = rematch({ 'true, false': () => 'mixed, true first' })
            assert.strictEqual(tf(true, false), 'mixed, true first')

            const ftTrailComma = rematch({ 'false, true,': () => 'mixed, false first' })
            assert.strictEqual(ftTrailComma(false, true), 'mixed, false first')
        })

        it('works with default', () => {
            const fn = rematch({
                'false': () => 'sandwich'
                , default: () => 'DEFAULTED ONE'
            })
            assert.strictEqual(fn(false), 'sandwich')
            assert.strictEqual(fn(true), 'DEFAULTED ONE')

            const trailComma = rematch({
                'false, true,': () => 'mixed, false first'
                , default: () => 'DEFAULTED TWO'
            })
            assert.strictEqual(trailComma(false, true), 'mixed, false first')
            assert.strictEqual(trailComma(true, true), 'DEFAULTED TWO')
        })
    })

    describe('works on strings', () => {
        it('works with one parameter', () => {
            const strMatch = rematch({ foo: () => 'its a string' })
            assert.strictEqual(strMatch('foo'), 'its a string')

            const trailComma = rematch({ 'foo,': () => 'still a string' })
            assert.strictEqual(trailComma('foo'), 'still a string')
        })

        it('works with two parameters', () => {
            const strMatch = rematch({ 'foo, bar': () => 'its two strings' })
            assert.strictEqual(strMatch('foo', 'bar'), 'its two strings')

            const trailComma = rematch({ 'foo, bar,': () => 'still two strings' })
            assert.strictEqual(trailComma('foo', 'bar'), 'still two strings')
        })

        it('is independent of parameter order', () => {
            const arityTwo = rematch({ 'a, b': () => 'arity of two' })
            assert.strictEqual(arityTwo('a', 'b'), 'arity of two')
            assert.strictEqual(arityTwo('b', 'a'), 'arity of two')

            const arityThree = rematch({ 'a, b, c': () => 'arity of three' })
            assert.strictEqual(arityThree('a', 'b', 'c'), 'arity of three')
            assert.strictEqual(arityThree('a', 'c', 'b'), 'arity of three')
            assert.strictEqual(arityThree('b', 'a', 'c'), 'arity of three')
            assert.strictEqual(arityThree('b', 'c', 'a'), 'arity of three')
            assert.strictEqual(arityThree('c', 'b', 'a'), 'arity of three')
            assert.strictEqual(arityThree('c', 'a', 'b'), 'arity of three')
        })

        it('works with default', () => {
            const fn = rematch({
                'foo, bar': () => 'hello'
                , default: () => 'DEFAULTED'
            })
            assert.strictEqual(fn(''), 'DEFAULTED')
            assert.strictEqual(fn('randomKey'), 'DEFAULTED')
            assert.strictEqual(fn('foo', 'bar'), 'hello')
        })
    })

    describe('works recursively', () => {
        it('for factorial function', () => {
            const factorial = rematch({
                0: () => 1
                , default: (n) => n * factorial(n - 1)
            })
            assert.strictEqual(factorial(4), 24)
            assert.strictEqual(factorial(1), 1)
            assert.strictEqual(factorial(0), 1)
        })

        // it('for zipWith function', () => {
        //     const toTuple = (x, y) => [x, y]
        //     const names = [ 'karen', 'joe' ]
        //     const ages = [ 32, 28 ]

        //     //todo: make this work
        //     const zipWith = rematch({
        //         '_, [], _': () => []
        //         , '_, _, []': () => []
        //         , 'fn, xs, ys': (f, [x, ...xs], [y, ...ys]) => [f(x, y), ...zipWith(f, xs, ys)]
        //         // , 'fn, [...], [...]': (f, [x, ...xs], [y, ...ys]) => [f(x, y), ...zipWith(f, xs, ys)]
        //     })

        //     assert.deepStrictEqual(zipWith(toTuple, names, ages), [ [ 'karen', 32 ], [ 'joe', 28 ] ])
        // })
    })

    // describe('works on numbers', () => {

    // })

    // describe('throws an error no matches and no default', () => {

    // })
})

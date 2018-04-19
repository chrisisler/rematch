const assert = require('assert')
const wavematch = require('../lib/index.js')
const { accept, reject, eq } = require('./shared.js')

describe('wavematch miscellaneous specification', () => {
  it('should throw if default is out of scope', () => {
    assert.throws(() => {
      const foo = 'foo'
      // prettier-ignore
      const match = wavematch(foo)(
        (arg = foo) => accept,
        _ => accept
      )
    }, Error)
  })

  it('should throw if invalid JSON5', () => {
    assert.throws(() => {
      wavematch('doesnt matter')(
        (x = Function) => 0,
        (o = { k: Error }) => 1,
        _ => 2
      )
    }, Error)
  })

  it('null behavior', () => {
    // prettier-ignore
    let nullTest = (value, acceptOrReject) => eq(wavematch(value)(
      (arg = null) => accept,
      _ => reject
    ), acceptOrReject)

    nullTest(null, accept)
    nullTest(undefined, reject)
  })

  it('undefined behavior', () => {
    // prettier-ignore
    let undefinedTest = (value, acceptOrReject) => eq(wavematch(value)(
      (arg = undefined) => accept,
      _ => reject
    ), acceptOrReject)

    undefinedTest(undefined, accept)
    undefinedTest(null, reject)
  })

  describe('should allow destructuring', () => {
    // todo
    // describe('object destructuring', () => {
    // })

    describe('array destructuring', () => {
      it('head-rest pattern', () => {
        // prettier-ignore
        const match = wavematch([1, 2, 3])(
          ([head, ...rest]) => accept,
          _ => reject
        )
        eq(match, accept)
      })

      it('array#zip destructured', () => {
        // prettier-ignore
        const zip = (xs, ys) => wavematch(xs, ys)(
          (xs, ys = []) => [],
          (xs = [], ys) => [],
          ([x, ...xs], [y, ...ys]) => [x, y].concat(zip(xs, ys)),
          _ => reject
        )
        // prettier-ignore
        assert.deepEqual(
          zip([1, 2, 3], ['a', 'b', 'c']),
          [1, 'a', 2, 'b', 3, 'c']
        )
      })

      it('array#zipWith destructured', () => {
        // prettier-ignore
        const zipWith = (fn, xs, ys) => wavematch(fn, xs, ys)(
          (fn, xs = [], ys) => [],
          (fn, xs, ys = []) => [],
          (fn, [x, ...xs], [y, ...ys]) => [fn(x, y)].concat(zipWith(fn, xs, ys)),
          _ => reject
        )

        // prettier-ignore
        assert.deepEqual(
          zipWith((x, y) => x + y, [1, 1, 1], [1, 1, 1]),
          [2, 2, 2]
        )

        assert.throws(() => {
          zipWith()
        })

        const zip = (xs, ys) => zipWith((x, y) => [x, y], xs, ys)
        const flat = arr => arr.reduce((xs, x) => xs.concat(x), [])
        // prettier-ignore
        assert.deepEqual(
          flat(zip([1, 2, 3], ['a', 'b', 'c'])),
          [1, 'a', 2, 'b', 3, 'c']
        )
      })
    })
  })
})
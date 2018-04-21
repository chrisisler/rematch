const assert = require('assert')
const wavematch = require('../build/index.js')
const { accept, reject, eq } = require('./shared.js')

let randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) * min
let randomFrom = array => randomBetween(0, array.length)

// let someStrings = [ 'foo', 'bar', 'pizza', '', 'AAHHH!', '42' ]
// let someNumbers = [ -100, -10, -1, 0, 1, 10, 100 ]

// all these tests are very important for unhandled cases/states
describe('wavematch union specification', () => {
  // number
  // string
  // array
  // boolean
  // custom-type
  // date
  // function?
  // guard?
  // non-unary
  // object
  // regexp

  it.only('should work for regexp and array', () => {
    let match = value => wavematch(value)(
      (x = RegExp | Array) => accept,
      _ => reject
    )
    eq(match(/foo/), accept)
    eq(match(/./g), accept)
    eq(match([]), accept)
    eq(match([1]), accept)
  })

  it('should work for two plain objects and a guard rule', () => {
    let namingIsHard = object => wavematch(object)(
      (response = { status: 200 } | { ok: true }) => accept,
      (response = $ => $.status > 400) => reject,
      _ => reject
    )

    eq(namingIsHard({ status: 200 }), accept)
    eq(namingIsHard({ ok: true }), accept)

    eq(namingIsHard({ ok: false }), reject)
    eq(namingIsHard({ status: 401 }), reject)
    eq(namingIsHard({ status: 402 }), reject)
    eq(namingIsHard({ status: 510 }), reject)
  })

  it('should work for two plain objects', () => {
    let matchObj = obj => wavematch(obj)(
      (o = { key: true } | { id: 42 }) => accept,
      _ => reject
    )
    eq(matchObj({ key: true }), accept)
    eq(matchObj({ id: 42 }), accept)

    eq(matchObj({ key: false }), reject)
    eq(matchObj({ id: 0 }), reject)
    eq(matchObj({ id: -42 }), reject)

    eq(matchObj({ key: 0 }), reject)
    eq(matchObj({ key: -42 }), reject)
    eq(matchObj({ id: false }), reject)
    eq(matchObj({ id: true }), reject)

    eq(matchObj({}), reject)
    eq(matchObj({ name: 'chris' }), reject)
    eq(matchObj([]), reject)
    eq(matchObj([1]), reject)
    eq(matchObj(''), reject)
    eq(matchObj(77), reject)
    eq(matchObj(()=>{}), reject)
  })

  it('should work for boolean and array', () => {
    let match = x => wavematch(x)(
      (x = Boolean | Array) => accept,
      _ => reject
    )
    eq(match([]), accept)
    eq(match([1]), accept)
    eq(match(false), accept)
    eq(match(true), accept)

    eq(match(99), reject)
    eq(match(()=>{}), reject)
    eq(match({}), reject)
    eq(match('foo'), reject)
  })

  it('should work for numbers and strings', () => {
    let matchBoth = stringOrNumber => wavematch(stringOrNumber)(
      (arg = String | Number) => accept,
      _ => reject
    )

    eq(matchBoth('3'), accept)
    eq(matchBoth(3), accept)

    eq(matchBoth([]), reject)
    eq(matchBoth(()=>{}), reject)
    eq(matchBoth({}), reject)
    eq(matchBoth(false), reject)
    eq(matchBoth(true), reject)
  })

})
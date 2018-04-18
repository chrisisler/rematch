const assert = require('assert')
const wavematch = require('../lib/index.js')
const { accept, reject, eq } = require('./shared.js')

describe('wavematch custom types specification', () => {
  it('should work for `class` case', () => {
    class Person {}
    let person = new Person()

    // prettier-ignore
    let matchPerson = wavematch(person)(
      (p = Person) => accept,
      _ => reject
    )

    eq(matchPerson, accept)
  })

  it('should work for `function` case', () => {
    function Car() {}
    let car = new Car()

    // prettier-ignore
    eq(wavematch(car)(
      (car = Car) => accept,
      _ => reject
    ), accept)
  })

  it('should work for `class extends` child case', () => {
    class A {}
    class B extends A {}
    let b = new B()

    // prettier-ignore
    eq(wavematch(b)(
      (b = B) => accept,
      _ => reject
    ), accept)
  })

  it('should work for `class extends` parent case ', () => {
    class A {}
    class B extends A {}
    let b = new B()

    // prettier-ignore
    eq(wavematch(b)(
      (b = A) => accept,
      _ => reject
    ), accept)
  })
})

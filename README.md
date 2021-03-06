> *Wavematch is a control flow mechanism for JavaScript.*

## Introduction

Wavematch enables pattern matching.
It's super declarative.
A branch of code is executed when specified conditions of the input are satisfied. For example,

```javascript
let result = wavematch(random(0, 5))(
  (n = 0) => 'zero',
  (n = 1) => 'one',
  (n = 2) => 'two',
  _       => 'otherwise'
)
```

The value of `result` is dependent on which branch of code gets ran when one of
the conditions are satisfied. If none of the cases meet the user-given
requirements, the default branch is executed.

## Install

```sh
yarn add wavematch
```

## Matching Standard Types

Use constructors for type-based matching:

```javascript
let typeMatch = id => wavematch(id)(
  (id = Number) => 'received a number!',
  (id = String) => 'received a string!',
  _ => 'something else!'
)
```

## Matching Object Props

Use plain objects as a pattern to match on properties:

```javascript
wavematch({ done: false, rank: 42 })(
    (obj = { done: false }) => {}
)
```

```javascript
let assertShape = obj => wavematch(obj)(
  (shape = { foo: Number }) => {}, // skip this case
  _ => { throw Error() }
)
assertShape({ foo: 1 })
assertShape({ foo: 'str' }) // Error due to type difference
```

Destructure the object using the desired key as the argument name:

```javascript
let data = { done: false, error: Error() }

wavematch(data)(
  (obj = { done: false }) => neverInvoked(),
  (done = true) => getsInvoked()
)
```

Destructure the input object via the argument name _and_ match an object pattern:

```javascript
wavematch({ foo: { bar: 42 } })(
  (foo = { bar: 42 }) => {}
  _ => {}
```

> Note: Objects must be [valid JSON5](https://json5.org/).


## Matching Class Types

Use the class name as a pattern to match custom data types:

```javascript
class Person {}

wavematch(new Person())(
  (p = Person) => {
    console.log('Is a Person')
  },
  _ => {
    console.log('Not a Person')
  }
)
```

```javascript
function Car() {}

let carInstance = new Car()

wavematch(carInstance)(
  (c = Car) => {}
)
```

## Match Guards

Guards are boolean expressions for conditional behavior:

```javascript
let fib = wavematch.create(
  (n = 0 | 1) => n,
  // if (n > 1)
  (n = $ => $ > 1) => fib(n - 1) + fib(n - 2)
)
fib(7) //=> 13
```

```javascript
wavematch(await fetch(url))(
  (response = { status: 200 }) => response,
  (response = $ => $.status > 400) => Error(response)
)
```

> The `({ prop }) => {}` syntax can _not_ be used for guard functions (due to being invalid [json5](https://json5.org/)).

## Match Unions

Use `|` to match multiple patterns:

```javascript
let value = random(0, 10)

wavematch(value)(
  (other = 2 | 4 | 6) => {
    console.log('two or four or six!')
  },
  _ => {
    console.log('not two or four or six')
  }
)
```

```javascript
wavematch(await fetch(url))(
  (response = { status: 200 } | { ok: true }) => response,
  (response = $ => $.status > 400) => Error(response)
)
```

```javascript
let parseArgument = arg => wavematch(arg)(
  (arg = '-h' | '--help') => displayHelp(),
  (arg = '-v' | '--version') => displayVersion(),
  _ => unknownArgument(arg)
)
```


## Wildcard Pattern

The wildcard pattern `_` matches all input arguments.
- Binds `undefined` to the parameter
- Should be the last rule provided

```javascript
let number = wavematch(random(0, 100))(
  (n = 99)          => 'ninety-nine',
  (n = $ => $ > 30) => 'more than thirty',
  _                 => 'who knows'
)
```

## Limitations

Things that can **not** be done:

```javascript
let value = 3
let matched = wavematch(77)(
  (arg = value) => 'a', // `value` throws a ReferenceError
  _ => 'b'
)
// Workaround: If possible, replace the variable with its value.
```

```javascript
function fn() {}
let matched = wavematch('bar')(
  (arg = fn) => 'hello',
      // ^^ `fn` throws a ReferenceError
)
// Workaround: If possible, replace `fn` with an arrow function returning a boolean.
```

```javascript
wavematch({ age: 21.5 })(
  (obj = { age: Number }) => 'got a number',
             // ^^^^^^ Invalid JSON5 here throws the error!
  // Workaround: Use desired key name to match and destructure:
  (age = Number) => 'got a number!'
)
```

```javascript
wavematch('foo')(
  (_ = !Array) => {},
    // ^^^^^^ Cannot use `!` operator
  _ => {}
)
// Workaround:
wavematch('foo')(
  (x = Array) => {}, // do nothing
  (x) => { /* `x` is guaranteed NOT to be an Array in this block */ }
)
```

## Examples

```javascript
let zip = (xs, ys) => wavematch(xs, ys)(
  (_, ys = []) => [],
  (xs = [], _) => [],
  ([x, ...xs], [y, ...ys]) => [x, y].concat(zip(xs, ys))
)
zip(['a', 'b'], [1, 2]) //=> ['a', 1, 'b', 2]
```

```javascript
let zipWith = wavematch.create(
  (_, xs = [], __) => [],
  (_, __, ys = []) => [],
  (fn, [x, ...xs], [y, ...ys]) => [fn(x, y)].concat(zipWith(fn, xs, ys))
)
zipWith((x, y) => x + y, [1, 3], [2, 4]) //=> [3, 7]
```

```javascript
let unfold = (seed, fn) => wavematch(fn(seed))(
  (_ = null) => [],
  ([seed, next]) => [].concat(seed, unfold(next, fn))
)
unfold(
  5,
  n => n === 0 ? null : [n, n - 1]
) //=> [ 5, 4, 3, 2, 1 ]
```

*More examples are in the [test](test/) directory.*

## Gotchas

Be mindful of the ordering of your conditions:

```javascript
let matchFn = wavematch.create(
  (num = $ => $ < 42) => 'A',
  (num = $ => $ < 7) => 'B',
  _ => 'C'
)
```

This is a gotcha because the _expected_ behavior is that `matchFn(3)` would
return `B` because `num` is less than 7. The _actual_ behavior is `matchFn(3)`
returns `A` because the condition for checking if the input is less than 42 is
evaluated in the order given, which is before the less-than-7 condition. So, be
mindful of how the conditions are ordered.

## Development

1. Clone this repository
1. `yarn` or `npm i`
1. `yarn build:watch`

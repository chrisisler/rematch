# Wavematch

> Control flow operator for matching values against patterns.

```javascript
let number = wavematch(random(0, 5))(
  (n = 0) => 'zero',
  (n = 1) => 'one',
  (n = 2) => 'two',
  _       => 'otherwise'
)
```

The input value is a random number between 0 and 5.
`number` is assigned to the result of whichever rule matches the input first.
Four rules are given, the last being a wildcard rule providing default behavior.

## Install

```sh
yarn add wavematch
```

## Matching Types

Use constructors for type-based matching.

```javascript
let toDate = dateString => wavematch(dateString)(
  (value = Date)   => value,
  (value = String) => new Date(value)
)
```

```javascript
let map = (fn, x) => wavematch(fn, x)(
  (fn, x = Array)  => x.map(fn),
  (fn, x = Object) => Object.keys(x).map(key => fn(x[key]))
)
```

## Matching Objects

Use plain objects as parameter defaults to match object data.

```javascript
let data = { isDone: false, error: Error() }

wavematch(data)(
  (obj = { isDone: Boolean }) => {
    console.log('sick')
  }
)
```

```javascript
let assertShape = obj => wavematch(obj)(
  (shape = { foo: Number, bar: Object }) => {}, // noop
  _ => throw Error('Unexpected data type')
)
assertShape({ foo: 1, bar: {} })
assertShape({ foo: 1, bar: 1 }) // Error!
```

> Objects must be [valid JSON5](https://json5.org/).

## Matching Classes

Use custom type constructors to match custom types.

```javascript
class Person {}
let alex = new Person()

wavematch(alex)(
  (p = Person) => {
    console.log('Is a Person')
  }
  _ => {
    console.log('Not a Person')
  }
)
```

## Match Guards

Guards are boolean expressions for conditional behavior.

```javascript
let fib = n => wavematch(n)(

  // if (n === 0 || n === 1)
  (n = 0 | 1) => n,

  // if (n > 1)
  (n = $ => $ > 1) => fib(n - 1) + fib(n - 2)
)
```

```javascript
let safeFetch = async (url) => wavematch(await fetch(url))(
  (response = { status: 200 }) => response,
  (response = $ => $.status > 400) => Error(response)
)
```

## Match Unions

Use `|` to match multiple patterns.

```javascript
let value = random(0, 10)

wavematch(value)(
  (other = 2 | 4 | 6) => 'two four six',
  other => {
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

## Wildcard Pattern

The wildcard pattern `_` matches all input arguments.
- Binds `undefined` to the underscore character
- Should be the last rule provided

```javascript
let number = wavematch(random(0, 100))(
  (n = 99)          => 'ninety-nine',
  (n = $ => $ > 30) => 'more than thirty',
  _                 => 'who knows'
)
```

## Limitations

Things that can **not** be done.

```javascript
let value = 3
let matched = wavematch(77)(
  (arg = value) => 'a', // `value` causes a ReferenceError
  _ => 'b'
)
```

> _Workaround:_ If possible, replace the variable with its value.

```javascript
function fn() {}
let matched = wavematch('bar')(
  (arg = fn) => 'hello', // `fn` causes a ReferenceError
)
```

> _Workaround:_ If possible, replace the function with a arrow function returning a boolean.

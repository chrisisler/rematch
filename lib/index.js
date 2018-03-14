//      

const json5                              = require('json5')
const functionParse           = require('parse-function')().parse

const { warning, invariant } = require('./errors.js')

                               
                  
                      
  

                                           

                       
                                        
                
                        
  

module.exports = wavematch
function wavematch(...values            )                                   {
  warning(
    values.length === 0,
    'Please supply at least one argument to ' +
      'match function. Cannot match on zero parameters.'
  )

  return function(...patterns                   )         {
    invariant(
      patterns.length === 0,
      'Non-exhaustive patterns. ' +
        'Please add the wildcard pattern "_ => { expression }" at the last ' +
        'index.'
    )

    const rules              = patterns.map(toRule)

    const indexOfWildcardRule         = rules.findIndex((rule      ) =>
      rule.allReflectedArgs.some((reflectedArg              , index) => {
        // `reflectedArg.argName` is false if the argument is a
        // destructured array or destructured object
        if (reflectedArg.argName === false) {
          return false
        } else if (!reflectedArg.argName.includes('_')) {
          return false
        }

        const argNameLength         = reflectedArg.argName.length

        warning(
          reflectedArg.argName.length > 1,
          `Wildcard argument name contains ${reflectedArg.argName.length} ` +
            'underscore characters. Expected only one underscore.'
        )

        const isWildcardRule = reflectedArg.argName === '_'

        warning(
          rule.arity > 1 && isWildcardRule,
          'Wildcard pattern must be unary. ' +
            `Expected one argument (named "_"). Found ${rule.arity} args.`
        )

        return isWildcardRule
      })
    )

    const wildcardExists = indexOfWildcardRule > -1

    if (wildcardExists) {
      warning(
        patterns.length >= 1 && indexOfWildcardRule !== rules.length - 1,
        'Wildcard pattern should be the ' +
          `last pattern. Instead is at index ${indexOfWildcardRule}.`
      )

      const wildcardArg                = rules[
        indexOfWildcardRule
      ].allReflectedArgs.find(r => r.argName === '_')

      if (
        wildcardArg != null &&
        'default' in wildcardArg &&
        wildcardArg.default != null
      ) {
        warning(
          true,
          'Wildcard pattern must not have a ' +
            'default argument. Found default argument of: ' +
            wildcardArg.default
        )
      }
    } else {
      warning(
        true,
        'Non-exhaustive pattern. Expected ' +
          'wildcard rule: "_ => { expression }" as last rule.'
      )
    }

    for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
      // skip wildcard pattern as it:
      // 1) might not exist
      // 2) might not be at the last index like it's supposed to be
      if (ruleIndex !== indexOfWildcardRule) {
        if (rules[ruleIndex].arity === values.length) {
          // const matched = rules[ruleIndex].expression(...values)
          if (doesMatch(rules[ruleIndex], values, ruleIndex, rules)) {
            return rules[ruleIndex].expression(...values)
          }
        }
      }
    }

    if (wildcardExists) {
      return rules[indexOfWildcardRule].expression()
    }
  }
}

// /Users/litebox/Code/Git/wavematch/node_modules/json5/lib/json5.js:64
//             throw error;
//             ^
// SyntaxError: Expected 'a' instead of 'u' at line 1 column 16 of the JSON5 data. Still to read: "umber }"
//     at error (/Users/litebox/Code/Git/wavematch/node_modules/json5/lib/json5.js:56:25)
//     at next (/Users/litebox/Code/Git/wavematch/node_modules/json5/lib/json5.js:72:17)
//     at word (/Users/litebox/Code/Git/wavematch/node_modules/json5/lib/json5.js:389:15)
//     at value (/Users/litebox/Code/Git/wavematch/node_modules/json5/lib/json5.js:493:56)
//     at object (/Users/litebox/Code/Git/wavematch/node_modules/json5/lib/json5.js:459:35)
//     at value (/Users/litebox/Code/Git/wavematch/node_modules/json5/lib/json5.js:482:20)
//     at Object.parse (/Users/litebox/Code/Git/wavematch/node_modules/json5/lib/json5.js:508:18)
//     at parsed.args.map.argName (/Users/litebox/Code/Git/wavematch/lib/index.js:158:24)
//     at Array.map (<anonymous>)
//     at reflectArguments (/Users/litebox/Code/Git/wavematch/lib/index.js:147:42)
function reflectArguments(fn          )                      {
  const parsed                                            = functionParse(fn)

  if (parsed.args.length === 0) {
    return []
  }

  // `argName` is a false boolean if the argument is a
  // destructured array or destructured object
  if (parsed.args[0] === false) {
    warning(
      true,
      'Wavematch does not support destructured arguments. ' +
        'Returning empty array.'
    )
    // pretend the reflected args does not exist
    return []
  }

  const reflectedArguments = parsed.args.map(argName => {
    let _default = parsed.defaults[argName]

    // if no default then don't put `default` key in the returned object
    if (_default === void 0) {
      return {
        argName: argName
      }
    }
    // default is an Object, parse it into an actual Object type
    if (_default.startsWith('{')) {
      // pattern present in _default must be conformant to json5 spec
      _default = json5.parse(_default)
    } else {
      _default = eval(_default)
    }

    return {
      argName: argName,
      default: _default
    }
  })

  return reflectedArguments
}

function isType(constructor        , value     )          {
  return getType(value) === `[object ${constructor}]`
}

function getType(value     )         {
  return Object.prototype.toString.call(value)
}

function toRule(pattern          , index        )       {
  warning(
    !(typeof pattern === 'function'),
    `Pattern at index ${index} is not a ` +
      `Function, instead is: ${getType(pattern)}.`
  )

  const reflectedArgs                      = reflectArguments(pattern)

  const rule       = {
    allReflectedArgs: reflectedArgs,
    expression: pattern,
    arity: reflectedArgs.length
  }

  warning(
    rule.arity === 0,
    `${
      pattern.name === 'anonymous'
        ? 'Anonymous pattern'
        : `Pattern "${pattern.name}"`
    } at index ${index} must accept one or more arguments.`
  )
  return rule
}

const constructors = [Object, Number, Function, Array, String, Set, Map]

function doesMatch(
  rule      ,
  values            ,
  ruleIndex        ,
  rules             
)          {
  return values.every((value     , valueIndex        ) => {
    const reflectedArg               = rule.allReflectedArgs[valueIndex]

    if ('default' in reflectedArg) {
      const pattern      = reflectedArg.default

      // for `(value = Array) => { ... }` patterns
      // if (constructors.indexOf(pattern) !== -1) {
      //   return isType(pattern.name, value)
      // }

      if (isType('Object', value)) {
        return handleObjectValueMatch(
          value,
          valueIndex,
          rules,
          ruleIndex,
          pattern
        )
      }
    }
    // todo
    console.warn('----- `reflectedArg` does NOT have `default` -----')
    return true
  })
}

/**
 * @returns {Boolean} - true: accept rule, false: reject rule and try next
 */
function handleObjectValueMatch(
  value        ,
  valueIndex        ,
  rules             ,
  ruleIndex        ,
  pattern     
)          {
  const isEqual = require('lodash.isequal')

  // gets the index of the rule that has a pattern for the corresponding
  // input value (at `valueIndex`) with the highest number of keys (which
  // may exceed the number of keys that `value` has)
  const mostSpecificRuleIndex =
    rules.length === 2
      ? 0
      : rules.reduce((reducedIndex        , rule      , currentRuleIndex) => {
          const reflectedArg = rule.allReflectedArgs[valueIndex]
          if ('default' in reflectedArg) {
            if (typeof reflectedArg.default === 'object') {
              if (Object.keys(reflectedArg.default).length > reducedIndex) {
                return currentRuleIndex
              }
            }
          }
          return reducedIndex
        }, -1)

  // pattern matches any object: `(argN = Object) => { ... }`
  if (Object === pattern) {
    // show warning and skip constructor check if a rule with an `Object`
    // constructor type check is provided before a rule with a destructured
    // object pattern with the highest specificity (number of keys)
    // example (this _will_ trigger a warning):
    //   wavematch({ x: 1, y: 2 })(
    //     (obj = Object) => foo,
    //     (obj = { x: 1, y: 2 }) => bar,
    //     _ => baz
    //   )
    if (mostSpecificRuleIndex > ruleIndex) {
      // todo: this should warn/error
      warning(
        true,
        `Rule at index ${ruleIndex} uses \`Object\` constructor function (at parameter ` +
          `index ${valueIndex}) to type check. This rule should preceed any ` +
          'rules that destructure objects (due to increased specificity)'
      )
      return false
    } else {
      return isType(pattern.name, value)
    }
  } else if (isType('Object', pattern)) {
    // pattern matches specific objects: `(argN = { key: val }) => { ... }`
    const patternKeys                = Object.keys(pattern)

    // empty object `{} === {}` behavior handled by lodash's `isEqual`
    if (patternKeys.length === 0 && isEqual(pattern, value)) {
      return true
    }

    if (patternKeys.length <= Object.keys(value).length) {
      if (mostSpecificRuleIndex === ruleIndex) {
        return patternKeys.every((key        ) => {
          // todo: support constructor type checks in object value positions (json5)
          // if (constructors.includes(pattern[key])) {
          //   return isType(pattern[key].name, value)
          // }
          return isEqual(pattern[key], value[key])
        })
      }
    } else {
      // pattern has more keys than value, do not warn
      return false
    }
  }
  return false
}
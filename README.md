Replace selected text or word under cursor when selection changes (immediate) or when calling a command (by key binding).

> This extension looks a lot like [Replace Rules](https://marketplace.visualstudio.com/items?itemName=bhughes339.replacerules) by bhughes339.
>
> The difference is the possibility of immediate replacement and change of word under cursor (next version).

The search must match the selected text (for a particular Multi Cursor) completely. If you want to search for a partial match you have to add `(.*?)` to the start and end of the search string. If you don't need these strings in the replace string you can use `.*?` or `(?:.*?)`

If a rule is an `immediate` rule it is evaluated the moment you Double Click or Select Word or another means of modify the selection.

The rules **not** marked as `immediate` are evaluated when you call the command `replace-on.selection-changed` from the command menu as **Replace On: Replace selection/word by defined rules** or with a key binding. In a key binding you can add an `args` property. The `args` property has the same format as the `replace-on.selection-changed` configuration setting.

If you have Multi Cursors each selection is treated separately.

# Configuration

You specify the search/replace strings in the configuration setting `replace-on.selection-changed`.

The properties of `replace-on.selection-changed` are:

* `"all"`: an object with search/replace rules that are applied to all languageIds
*  <code>"<em>languageId</em>"</code>: an object with search/replace rules that are applied only to files with the given languageId

The rules you add for a specific languageId replace rules from the `all` section with the same search string.

Be aware that the settings from User, Workspace and Folder are merged. If you redefine a search string the properties are merged for that search string. You may need to add a property with its default value.

## Object with search/replace rules

The object with search/replace rules has the following format:

* the key is the string to search (literal or regular expression)
* the value is an object with properties:

    * `"replace"`: the replacement string if the key matches the selection, if it is a regex search/replace this string can contain capture group references, like `"$1"`
    * `"immediate"`: a boolean that signals that this rule can be applied the moment the selection changes (default: `false`)
    * `"literal"`: a boolean that signals that the search should be for a literal string, when `false` the search is using Regex (default: `false`)
    * `"flags"`: a string of flags used in the regex search. Only `"i"` (ignore case) makes sense because the search string must match the whole selection (default: `""`)

## Example

```
  "replace-on.selection-changed": {
    "all": {
      "[ABC]": {
        "replace": "[MNP]",
        "literal": true,
        "immediate": true
      },
      "A(D+)C": {
        "replace": "M$1P",
        "flags": "i",
        "immediate": true
      }
    },
    "javascript": {
      "foo": {
        "replace": "Bar",
        "flags": "i"
      }
    }
  }
```

# TODO

* replace current "word" on command (use all rules)
